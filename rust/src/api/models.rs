// src/api/models.rs
//
// Structures de réponse JSON de l'API.
// Conçues pour être consommées directement par le frontend Next.js.

use serde::{Deserialize, Serialize};

// ─────────────────────────────────────────────────────────────────────────────
// Upload
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct UploadQuery {
    pub guild_id    : i64,
    pub uploader_id : i64,
    pub date        : Option<String>, // YYYY-MM-DD
    pub label       : Option<String>,
    pub dry_run     : Option<bool>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadResponse {
    pub ok              : bool,
    pub fights_detected : usize,
    pub runs_inserted   : usize,
    pub runs_skipped    : usize,
    pub message         : String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParseRequest {
    pub file_name            : String,
    pub guild_id             : String, // BigInt sérialisé en String côté Next.js
    pub uploader_account_id  : String,
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct LeaderboardRow {
    pub player_name  : String,
    pub class        : Option<String>,
    pub role         : Option<String>,
    pub dps          : f64,
    pub hps          : f64,
    pub aps          : f64,
    pub run_id       : i64,
    pub boss_name    : String,
    pub duration_s   : i32,
    pub started_at   : chrono::NaiveDateTime,
    pub guild_name   : String,
}

// ─────────────────────────────────────────────────────────────────────────────
// Top players (meilleur score par joueur par boss)
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TopPlayerRow {
    pub player_name : String,
    pub class       : Option<String>,
    pub role        : Option<String>,
    pub best_dps    : f64,
    pub best_hps    : f64,
    pub run_count   : i64,
    pub boss_name   : String,
}

// ─────────────────────────────────────────────────────────────────────────────
// Détail d'un run
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize)]
pub struct RunDetailResponse {
    pub run         : RunInfo,
    pub players     : Vec<RunPlayerRow>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct RunInfo {
    pub id              : i64,
    pub boss_name       : String,
    pub guild_name      : String,
    pub started_at      : chrono::NaiveDateTime,
    pub duration_total_s: i32,
    pub boss_duration_s : Option<i32>,
    pub dps_group       : f64,
    pub hps_group       : f64,
    pub aps_group       : f64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct RunPlayerRow {
    pub player_name : String,
    pub class       : Option<String>,
    pub role        : Option<String>,
    pub damage      : i64,
    pub healing     : i64,
    pub absorbed    : i64,
    pub dps         : f64,
    pub hps         : f64,
    pub aps         : f64,
    pub overheal    : i64,
    pub death_count : Option<i32>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Abilities d'un joueur dans un run
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize)]
pub struct PlayerAbilitiesResponse {
    pub run_id      : i64,
    pub player_name : String,
    pub boss_name   : String,
    pub duration_s  : i32,
    pub total_damage: i64,
    pub dps         : f64,
    pub abilities   : Vec<AbilityRow>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AbilityRow {
    pub ability_id  : i64,
    pub ability_name: String,
    pub total       : i64,
    pub hits        : i32,
    pub crit_rate   : f64,
    pub min_hit     : i32,
    pub max_hit     : i32,
    pub avg_hit     : f64,
    pub rate        : f64,
    pub pct         : f64,
    pub absorbed    : i64,
}

// ─────────────────────────────────────────────────────────────────────────────
// Derniers uploads
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct RecentRunRow {
    pub run_id      : i64,
    pub boss_name   : String,
    pub guild_name  : String,
    pub started_at  : chrono::NaiveDateTime,
    pub duration_s  : i32,
    pub dps_group   : f64,
    pub hps_group   : f64,
    pub roster_size : i32,
}

// ─────────────────────────────────────────────────────────────────────────────
// Boss list
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct BossRow {
    pub id   : i64,
    pub name : String,
}

// ─────────────────────────────────────────────────────────────────────────────
// Fastest kills (leaderboard par temps)
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct FastestKillRow {
    pub run_id       : i64,
    pub boss_name    : String,
    pub guild_name   : String,
    pub roster_hash  : String,
    pub duration_s   : i32,
    pub dps_group    : f64,
    pub started_at   : chrono::NaiveDateTime,
}

// ─────────────────────────────────────────────────────────────────────────────
// Lookup joueur
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PlayerLookupRow {
    pub run_id      : i64,
    pub boss_name   : String,
    pub guild_name  : String,
    pub started_at  : chrono::NaiveDateTime,
    pub duration_s  : i32,
    pub dps         : f64,
    pub hps         : f64,
    pub aps         : f64,
    pub role        : Option<String>,
    pub class       : Option<String>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Erreur générique
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize)]
pub struct ApiError {
    pub error: String,
}

impl ApiError {
    pub fn new(msg: impl Into<String>) -> Self {
        Self { error: msg.into() }
    }
}
