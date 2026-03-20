// src/output.rs
//
// Rendu terminal de l'analyse d'un fight.
// Utilisé par la commande `pika-parser parse`.

use crate::abilities::{collect_by_ability, to_lines, AbilityKind};
use crate::player_class::DEFAULT_CLASS;
use crate::player_role::DEFAULT_ROLE;
use crate::segments::build_segments;
use crate::stats::{build_roster, sum_absorbed, sum_damage, sum_heal, sum_player_deaths};
use crate::types::Fight;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers formatage
// ─────────────────────────────────────────────────────────────────────────────
fn fmt_dur(sec: u32) -> String {
    format!("{:02}:{:02}", sec / 60, sec % 60)
}

fn fmt_num(n: i64) -> String {
    // Séparateurs de milliers (espace)
    let s = n.abs().to_string();
    let with_sep: String = s.chars().rev().enumerate()
        .flat_map(|(i, c)| {
            if i > 0 && i % 3 == 0 { vec![' ', c] } else { vec![c] }
        })
        .collect::<String>()
        .chars().rev().collect();
    if n < 0 { format!("-{}", with_sep) } else { with_sep }
}

fn fmt_f(v: f64) -> String {
    format!("{:.1}", v)
}

fn sep(w: usize, c: char) -> String {
    std::iter::repeat(c).take(w).collect()
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendu d'un fight
// ─────────────────────────────────────────────────────────────────────────────
pub fn render_fight(
    fight          : &Fight,
    player_classes : &std::collections::HashMap<String, String>,
    show_abilities : bool,
) -> String {
    let mut out = Vec::<String>::new();

    let total_dur = fight.duration_sec().max(1);

    // ── En-tête ──────────────────────────────────────────────────────────
    out.push(sep(100, '═'));
    out.push(format!(
        "Kill #{:02}  │  {}  │  {} → {}  │  Durée: {}",
        fight.kill_index, fight.encounter,
        fight.start_ts, fight.end_ts,
        fmt_dur(total_dur)
    ));
    out.push(sep(100, '═'));

    let segments = build_segments(fight);

    for seg in &segments {
        let dur = seg.effective_duration();

        let dmg_map    = sum_damage  (&fight.events, seg.stats_start, seg.stats_end, seg.boss_filter.as_deref());
        let heal_map   = sum_heal    (&fight.events, seg.stats_start, seg.stats_end);
        let absorb_map = sum_absorbed(&fight.events, seg.stats_start, seg.stats_end);
        let deaths_map = sum_player_deaths(&fight.events, seg.start_sec, seg.end_sec);
        let roster     = build_roster(&dmg_map, &heal_map);

        let total_dmg    = dmg_map.values().sum::<i64>();
        let total_heal   = heal_map.values().sum::<i64>();
        let total_absorb = absorb_map.values().sum::<i64>();

        // Afficher le nom du segment seulement s'il y en a plusieurs
        if segments.len() > 1 {
            out.push(sep(100, '─'));
            out.push(format!("  Segment : {}  │  Durée : {}",
                seg.boss_name, fmt_dur(dur)));
        }

        out.push(format!(
            "  DPS groupe: {}  │  HPS groupe: {}  │  APS groupe: {}",
            fmt_num(total_dmg / dur as i64),
            fmt_num(total_heal / dur as i64),
            fmt_num(total_absorb / dur as i64),
        ));
        out.push(sep(100, '─'));

        // ── En-tête tableau ───────────────────────────────────────────────
        out.push(format!(
            " {:<28} {:<12} {:<10} {:>14} {:>9} {:>14} {:>9} {:>12} {:>7} {:>5}",
            "Joueur", "Classe", "Rôle",
            "Dégâts", "DPS",
            "Soins", "HPS",
            "Absorb", "APS",
            "Morts"
        ));
        out.push(sep(100, '─'));

        // ── Lignes joueurs ────────────────────────────────────────────────
        let role_map = crate::player_role::infer_player_roles(
            &fight.events, seg.start_sec, seg.end_sec,
        );

        let mut rows: Vec<(String, i64, f64, i64, f64, i64, f64, u32)> = roster.iter().map(|p| {
            let d = *dmg_map.get(p).unwrap_or(&0);
            let h = *heal_map.get(p).unwrap_or(&0);
            let a = *absorb_map.get(p).unwrap_or(&0);
            let deaths = deaths_map.get(p).map(|di| di.count).unwrap_or(0);
            (
                p.clone(),
                d, d as f64 / dur as f64,
                h, h as f64 / dur as f64,
                a, a as f64 / dur as f64,
                deaths,
            )
        }).collect();
        rows.sort_by(|a, b| b.1.cmp(&a.1)); // tri DPS décroissant

        for (player, dmg, dps, heal, hps, absorb, aps, deaths) in &rows {
            let cls  = player_classes.get(player).map(|s| s.as_str()).unwrap_or(DEFAULT_CLASS);
            let role = role_map.get(player).map(|s| s.as_str()).unwrap_or(DEFAULT_ROLE);

            out.push(format!(
                " {:<28} {:<12} {:<10} {:>14} {:>9} {:>14} {:>9} {:>12} {:>7} {:>5}",
                player, cls, role,
                fmt_num(*dmg), fmt_f(*dps),
                fmt_num(*heal), fmt_f(*hps),
                fmt_num(*absorb), fmt_f(*aps),
                if *deaths > 0 { deaths.to_string() } else { "-".to_string() }
            ));

            // ── Ability breakdown ─────────────────────────────────────────
            if show_abilities && *dmg > 0 {
                let ability_stats = collect_by_ability(
                    fight, player,
                    AbilityKind::Damage,
                    true,
                    seg.stats_start, seg.stats_end,
                    seg.boss_filter.as_deref(),
                );
                if !ability_stats.is_empty() {
                    let lines = to_lines(&ability_stats, dur, *dmg);
                    out.push(format!("   ┌─ Abilities ({}) ─────────────────────────────────", player));
                    out.push(format!(
                        "   │  {:<40} {:>10} {:>6} {:>6} {:>10} {:>10} {:>9} {:>7} {:>6}",
                        "Ability", "Total", "Hits", "Crit%", "Min", "Max", "Avg", "DPS", "%"
                    ));
                    for ln in lines.iter().take(15) {
                        out.push(format!(
                            "   │  {:<40} {:>10} {:>6} {:>5.1}% {:>10} {:>10} {:>9.0} {:>7.1} {:>5.1}%",
                            &ln.ability_name[..ln.ability_name.len().min(40)],
                            fmt_num(ln.total),
                            ln.hits,
                            ln.crit_rate,
                            fmt_num(ln.min_hit),
                            fmt_num(ln.max_hit),
                            ln.avg_hit,
                            ln.rate,
                            ln.pct,
                        ));
                    }
                    out.push("   └───────────────────────────────────────────────────".to_string());
                }
            }
        }
    }

    out.push(sep(100, '═'));
    out.join("\n")
}

/// Affiche un résumé de tous les fights d'un fichier de log
pub fn render_summary(fights: &[Fight]) {
    println!("Fichier parsé : {} fight(s) détecté(s)\n", fights.len());
    for f in fights {
        println!(
            "  Kill #{:02} │ {:30} │ {} → {} │ {}",
            f.kill_index,
            f.encounter,
            f.start_ts, f.end_ts,
            fmt_dur(f.duration_sec()),
        );
    }
    println!();
}
