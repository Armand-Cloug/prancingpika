// src/db/ensure.rs
//
// Fonctions "ensure_*" : INSERT IGNORE ou SELECT + INSERT.
// Chaque fonction retourne l'ID de la ligne (existante ou créée).

use anyhow::{Context, Result};
use sha1::{Digest, Sha1};
use sqlx::MySqlPool;

use crate::abilities::AbilityStats;

// ─────────────────────────────────────────────────────────────────────────────
// Boss
// ─────────────────────────────────────────────────────────────────────────────
pub async fn ensure_boss(pool: &MySqlPool, name: &str) -> Result<i64> {
    let row: Option<(i64,)> = sqlx::query_as(
        "SELECT id FROM bosses WHERE name = ?"
    )
    .bind(name)
    .fetch_optional(pool)
    .await?;

    if let Some((id,)) = row {
        return Ok(id);
    }

    let res = sqlx::query("INSERT INTO bosses (name) VALUES (?)")
        .bind(name)
        .execute(pool)
        .await
        .context("ensure_boss insert")?;

    Ok(res.last_insert_id() as i64)
}

// ─────────────────────────────────────────────────────────────────────────────
// Group (roster hash)
// ─────────────────────────────────────────────────────────────────────────────
pub fn roster_hash(names: &[String]) -> String {
    let mut sorted = names.to_vec();
    sorted.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
    let blob = sorted.join("|");
    let mut hasher = Sha1::new();
    hasher.update(blob.as_bytes());
    hex::encode(hasher.finalize())
}

pub async fn ensure_group(
    pool        : &MySqlPool,
    roster_names: &[String],
    label       : Option<&str>,
) -> Result<i64> {
    let hash  = roster_hash(roster_names);
    let size  = roster_names.len() as i32;

    let row: Option<(i64,)> = sqlx::query_as(
        "SELECT id FROM `groups` WHERE rosterHash = ?"
    )
    .bind(&hash)
    .fetch_optional(pool)
    .await?;

    if let Some((id,)) = row {
        return Ok(id);
    }

    let res = sqlx::query(
        "INSERT INTO `groups` (rosterHash, rosterSize, label) VALUES (?, ?, ?)"
    )
    .bind(&hash)
    .bind(size)
    .bind(label)
    .execute(pool)
    .await
    .context("ensure_group insert")?;

    Ok(res.last_insert_id() as i64)
}

// ─────────────────────────────────────────────────────────────────────────────
// Player
// ─────────────────────────────────────────────────────────────────────────────
pub async fn ensure_player(
    pool        : &MySqlPool,
    name        : &str,
    player_class: Option<&str>,
) -> Result<i64> {
    let row: Option<(i64, Option<String>)> = sqlx::query_as(
        "SELECT id, `class` FROM players WHERE name = ?"
    )
    .bind(name)
    .fetch_optional(pool)
    .await?;

    if let Some((id, existing_class)) = row {
        // Mettre à jour la classe si on a une meilleure info
        let should_update = player_class.is_some()
            && (existing_class.is_none()
                || existing_class.as_deref() == Some(crate::player_class::DEFAULT_CLASS));
        if should_update {
            sqlx::query("UPDATE players SET `class` = ? WHERE id = ?")
                .bind(player_class)
                .bind(id)
                .execute(pool)
                .await?;
        }
        return Ok(id);
    }

    let res = sqlx::query("INSERT INTO players (name, `class`) VALUES (?, ?)")
        .bind(name)
        .bind(player_class)
        .execute(pool)
        .await
        .context("ensure_player insert")?;

    Ok(res.last_insert_id() as i64)
}

// ─────────────────────────────────────────────────────────────────────────────
// Ability (référentiel sorts — ability_id est la PK réelle, pas autoincrement)
// ─────────────────────────────────────────────────────────────────────────────
pub async fn ensure_ability(
    pool       : &MySqlPool,
    ability_id : i64,
    name       : &str,
    damage_type: Option<&str>,
) -> Result<()> {
    sqlx::query(
        "INSERT IGNORE INTO abilities (id, name, damageType) VALUES (?, ?, ?)"
    )
    .bind(ability_id)
    .bind(name)
    .bind(damage_type)
    .execute(pool)
    .await
    .context("ensure_ability insert")?;
    Ok(())
}

/// Enregistre toutes les abilities vues dans un fight
pub async fn ensure_abilities_bulk(
    pool          : &MySqlPool,
    ability_stats : &std::collections::HashMap<i64, AbilityStats>,
) -> Result<()> {
    for stats in ability_stats.values() {
        ensure_ability(pool, stats.ability_id, &stats.ability_name, None).await?;
    }
    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// Run existence check
// ─────────────────────────────────────────────────────────────────────────────
pub async fn run_exists(
    pool      : &MySqlPool,
    boss_id   : i64,
    group_id  : i64,
    started_at: chrono::NaiveDateTime,
    ended_at  : chrono::NaiveDateTime,
) -> Result<Option<i64>> {
    let row: Option<(i64,)> = sqlx::query_as(
        "SELECT id FROM runs WHERE bossId=? AND groupId=? AND startedAt=? AND endedAt=?"
    )
    .bind(boss_id)
    .bind(group_id)
    .bind(started_at)
    .bind(ended_at)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|(id,)| id))
}
