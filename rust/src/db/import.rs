// src/db/import.rs
//
// Import d'un fichier de log parsé vers la DB MySQL.
// Port de import_runs.py avec formules PT et ability_id comme clé canonique.

use std::collections::HashMap;
use std::path::Path;

use anyhow::{Context, Result};
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};
use sqlx::MySqlPool;

use crate::abilities::{collect_by_ability, to_lines, AbilityKind};
use crate::db::ensure::{
    ensure_abilities_bulk, ensure_boss, ensure_group, ensure_player, run_exists,
};
use crate::event_reader::read_events;
use crate::fight_extractor::extract_kills;
use crate::player_class::{infer_player_classes, DEFAULT_CLASS};
use crate::player_role::{infer_player_roles, DEFAULT_ROLE};
use crate::segments::build_segments;
use crate::stats::{
    build_roster, sum_absorbed, sum_blocked, sum_damage,
    sum_heal, sum_overheal, sum_player_deaths,
};
use crate::types::Fight;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers temps
// ─────────────────────────────────────────────────────────────────────────────
fn dt_from_sec(base: NaiveDate, sec: u32) -> NaiveDateTime {
    let t = NaiveTime::from_num_seconds_from_midnight_opt(sec, 0)
        .unwrap_or(NaiveTime::MIN);
    base.and_time(t)
}

fn dt_ensure_after(start: NaiveDateTime, end: NaiveDateTime) -> NaiveDateTime {
    if end >= start { end } else { end + chrono::Duration::days(1) }
}

// ─────────────────────────────────────────────────────────────────────────────
// Import options
// ─────────────────────────────────────────────────────────────────────────────
pub struct ImportOptions {
    pub base_date      : NaiveDate,
    pub guild_id       : i64,
    pub uploader_id    : i64,
    pub dry_run        : bool,
    pub with_abilities : bool,
    pub group_label    : Option<String>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Résultat de l'import
// ─────────────────────────────────────────────────────────────────────────────
pub struct ImportResult {
    pub fights_detected : usize,
    pub runs_inserted   : usize,
    pub runs_skipped    : usize,
}

// ─────────────────────────────────────────────────────────────────────────────
// Entrée principale
// ─────────────────────────────────────────────────────────────────────────────
pub async fn import_log_file(
    pool      : &MySqlPool,
    log_path  : &Path,
    opts      : &ImportOptions,
) -> Result<ImportResult> {
    let content = std::fs::read_to_string(log_path)
        .with_context(|| format!("Lecture du fichier {}", log_path.display()))?;

    let events = read_events(&content);
    let fights = extract_kills(events.clone()); // clone car on a besoin des events pour classes

    if fights.is_empty() {
        println!("Aucun kill détecté dans le fichier.");
        return Ok(ImportResult { fights_detected: 0, runs_inserted: 0, runs_skipped: 0 });
    }

    let classes = infer_player_classes(&events);
    let log_name = log_path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown.log");

    let mut inserted = 0usize;
    let mut skipped  = 0usize;

    for fight in &fights {
        let result = import_fight(pool, fight, &classes, log_name, opts).await;
        match result {
            Ok((ins, sk)) => { inserted += ins; skipped += sk; }
            Err(e) => {
                eprintln!("❌ Erreur import fight '{}' kill #{}: {:?}",
                    fight.encounter, fight.kill_index, e);
                if !opts.dry_run {
                    return Err(e);
                }
            }
        }
    }

    Ok(ImportResult {
        fights_detected: fights.len(),
        runs_inserted  : inserted,
        runs_skipped   : skipped,
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// Import d'un fight (→ N segments → N runs en DB)
// ─────────────────────────────────────────────────────────────────────────────
async fn import_fight(
    pool    : &MySqlPool,
    fight   : &Fight,
    classes : &HashMap<String, String>,
    log_name: &str,
    opts    : &ImportOptions,
) -> Result<(usize, usize)> {
    // Roster global du fight (dégâts + soins, toutes fenêtres)
    let dmg_all  = sum_damage (&fight.events, fight.start_sec, fight.end_sec, None);
    let heal_all = sum_heal   (&fight.events, fight.start_sec, fight.end_sec);
    let roster   = build_roster(&dmg_all, &heal_all);

    let group_id = ensure_group(
        pool, &roster,
        opts.group_label.as_deref()
    ).await?;

    let segments  = build_segments(fight);
    let mut ins   = 0usize;
    let mut skip  = 0usize;

    for seg in &segments {
        let boss_id    = ensure_boss(pool, &seg.boss_name).await?;
        let started_at = dt_from_sec(opts.base_date, seg.start_sec);
        let ended_at   = dt_ensure_after(
            started_at,
            dt_from_sec(opts.base_date, seg.end_sec),
        );

        if run_exists(pool, boss_id, group_id, started_at, ended_at).await?.is_some() {
            skip += 1;
            continue;
        }

        // ── Stats du segment ──────────────────────────────────────────────
        let stats_start = seg.stats_start;
        let stats_end   = seg.stats_end;
        let dur_s       = seg.effective_duration();

        let dmg_seg    = sum_damage  (&fight.events, stats_start, stats_end, seg.boss_filter.as_deref());
        let heal_seg   = sum_heal    (&fight.events, stats_start, stats_end);
        let absorb_seg = sum_absorbed(&fight.events, stats_start, stats_end);

        let total_damage  = dmg_seg.values().sum::<i64>();
        let total_healing = heal_seg.values().sum::<i64>();
        let total_absorbed= absorb_seg.values().sum::<i64>();

        let dps_group = total_damage   as f64 / dur_s as f64;
        let hps_group = total_healing  as f64 / dur_s as f64;
        let aps_group = total_absorbed as f64 / dur_s as f64;

        // ── Rôles (sur le segment entier, pas la fenêtre stats réduite) ──
        let roles_map = infer_player_roles(&fight.events, seg.start_sec, seg.end_sec);

        if opts.dry_run {
            let sample: Vec<String> = roster.iter().take(6)
                .map(|p| format!("{}:{}", p, roles_map.get(p).map(|s| s.as_str()).unwrap_or(DEFAULT_ROLE)))
                .collect();
            println!(
                "[DRY] boss='{}' started={} ended={} durTotal={}s durStats={}s \
                 roster={} DMG={} DPS={:.1} roles=[{}]",
                seg.boss_name, started_at, ended_at,
                seg.duration_total_s, dur_s,
                roster.len(), total_damage, dps_group,
                sample.join(", ")
            );
            ins += 1;
            continue;
        }

        // ── Insert run ────────────────────────────────────────────────────
        let run_res = sqlx::query(
            r#"INSERT INTO runs
               (bossId, groupId, guildId, uploaderId,
                startedAt, endedAt,
                durationTotalS, bossDurationS,
                totalDamage, totalHealing, totalAbsorbed,
                dpsGroup, hpsGroup, apsGroup, logFile)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"#
        )
        .bind(boss_id)
        .bind(group_id)
        .bind(opts.guild_id)
        .bind(opts.uploader_id)
        .bind(started_at)
        .bind(ended_at)
        .bind(seg.duration_total_s as i32)
        .bind(seg.boss_duration_s.map(|d| d as i32))
        .bind(total_damage)
        .bind(total_healing)
        .bind(total_absorbed)
        .bind(dps_group)
        .bind(hps_group)
        .bind(aps_group)
        .bind(log_name)
        .execute(pool)
        .await
        .context("INSERT runs")?;

        let run_id = run_res.last_insert_id() as i64;

        // ── Insert run_players + abilities ────────────────────────────────
        let overheal_map = sum_overheal(&fight.events, stats_start, stats_end);
        let blocked_map  = sum_blocked (&fight.events, stats_start, stats_end);
        let deaths_map   = sum_player_deaths(&fight.events, seg.start_sec, seg.end_sec);

        let mut abilities_rows: Vec<AbilityRow> = Vec::new();

        for player in &roster {
            let d  = *dmg_seg.get(player).unwrap_or(&0);
            let h  = *heal_seg.get(player).unwrap_or(&0);
            let a  = *absorb_seg.get(player).unwrap_or(&0);
            let oh = *overheal_map.get(player).unwrap_or(&0);
            let bl = *blocked_map.get(player).unwrap_or(&0);
            let dps = d as f64 / dur_s as f64;
            let hps = h as f64 / dur_s as f64;
            let aps = a as f64 / dur_s as f64;
            let role = roles_map.get(player).map(|s| s.as_str()).unwrap_or(DEFAULT_ROLE);
            let cls  = classes.get(player).map(|s| s.as_str()).unwrap_or(DEFAULT_CLASS);

            let player_id = ensure_player(pool, player, Some(cls)).await?;

            sqlx::query(
                r#"INSERT INTO run_players
                   (runId, playerId, damage, healing, absorbed,
                    dps, hps, aps, overheal, blocked, role)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?)"#
            )
            .bind(run_id)
            .bind(player_id)
            .bind(d)
            .bind(h)
            .bind(a)
            .bind(dps)
            .bind(hps)
            .bind(aps)
            .bind(oh)
            .bind(bl)
            .bind(role)
            .execute(pool)
            .await
            .context("INSERT run_players")?;

            // ── Deaths ────────────────────────────────────────────────────
            if let Some(di) = deaths_map.get(player) {
                sqlx::query(
                    r#"INSERT IGNORE INTO run_deaths
                       (runId, playerId, deathCount, firstDeathSec, lastDeathSec)
                       VALUES (?,?,?,?,?)"#
                )
                .bind(run_id)
                .bind(player_id)
                .bind(di.count as i32)
                .bind(di.first_death_sec.map(|s| s as i32))
                .bind(di.last_death_sec.map(|s| s as i32))
                .execute(pool)
                .await?;
            }

            // ── Abilities ─────────────────────────────────────────────────
            if !opts.with_abilities || d == 0 { continue; }

            let ab_stats = collect_by_ability(
                fight, player,
                AbilityKind::Damage,
                true,
                stats_start, stats_end,
                seg.boss_filter.as_deref(),
            );
            if ab_stats.is_empty() { continue; }

            // Enregistrer les abilities dans le référentiel
            ensure_abilities_bulk(pool, &ab_stats).await?;

            let dmg_total_player = ab_stats.values().map(|s| s.total).sum::<i64>();
            if dmg_total_player <= 0 { continue; }

            let lines = to_lines(&ab_stats, dur_s, dmg_total_player);

            for ln in &lines {
                abilities_rows.push(AbilityRow {
                    run_id,
                    player_id,
                    kind        : "DAMAGE",
                    ability_id  : ln.ability_id,
                    ability_name: ln.ability_name.clone(),
                    total       : ln.total,
                    hits        : ln.hits as i32,
                    crit_rate   : ln.crit_rate,
                    min_hit     : ln.min_hit as i32,
                    max_hit     : ln.max_hit as i32,
                    avg_hit     : ln.avg_hit,
                    rate        : ln.rate,
                    pct         : ln.pct,
                    absorbed    : ln.absorbed,
                });
            }
        }

        // ── Batch insert abilities ────────────────────────────────────────
        for row in &abilities_rows {
            sqlx::query(
                r#"INSERT IGNORE INTO run_player_abilities
                   (runId, playerId, kind, abilityId, abilityName,
                    total, hits, critRate, minHit, maxHit, avgHit,
                    rate, pct, absorbed)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)"#
            )
            .bind(row.run_id)
            .bind(row.player_id)
            .bind(row.kind)
            .bind(row.ability_id)
            .bind(&row.ability_name)
            .bind(row.total)
            .bind(row.hits)
            .bind(row.crit_rate)
            .bind(row.min_hit)
            .bind(row.max_hit)
            .bind(row.avg_hit)
            .bind(row.rate)
            .bind(row.pct)
            .bind(row.absorbed)
            .execute(pool)
            .await
            .context("INSERT run_player_abilities")?;
        }

        ins += 1;
        println!("✅ Kill #{} '{}' importé (run_id={})", fight.kill_index, seg.boss_name, run_id);
    }

    Ok((ins, skip))
}

// ─────────────────────────────────────────────────────────────────────────────
// Struct interne pour batch insert
// ─────────────────────────────────────────────────────────────────────────────
struct AbilityRow {
    run_id      : i64,
    player_id   : i64,
    kind        : &'static str,
    ability_id  : i64,
    ability_name: String,
    total       : i64,
    hits        : i32,
    crit_rate   : f64,
    min_hit     : i32,
    max_hit     : i32,
    avg_hit     : f64,
    rate        : f64,
    pct         : f64,
    absorbed    : i64,
}
