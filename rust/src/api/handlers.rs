// src/api/handlers.rs
//
// Handlers Axum — équivalent des routes de l'API Python.
// Chaque handler correspond à un endpoint consommé par le frontend Next.js.

use std::sync::Arc;

use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use chrono::NaiveDate;
use sqlx::MySqlPool;

use crate::api::models::*;

use crate::db::import::{import_log_file, ImportOptions};
use crate::event_reader::read_events;
use crate::fight_extractor::extract_kills;
use crate::output::render_fight;
use crate::player_class::infer_player_classes;

pub type AppState = Arc<MySqlPool>;
type ApiResult<T> = Result<Json<T>, (StatusCode, Json<ApiError>)>;

// ─── Sécurité : limites et validation des fichiers uploadés ──────────────────

/// Taille maximale d'un fichier uploadé : 50 Mo.
const MAX_UPLOAD_BYTES: usize = 50 * 1024 * 1024;

/// Nombre d'octets analysés pour la détection de contenu binaire.
const SNIFF_BYTES: usize = 1024;

/// Extensions de fichier autorisées (en minuscules, sans le point initial).
const ALLOWED_EXTENSIONS: &[&str] = &["log", "txt"];

fn db_err(e: impl std::fmt::Display) -> (StatusCode, Json<ApiError>) {
    eprintln!("[api] DB error: {}", e);
    (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::new("Internal server error")))
}

fn bad_req(msg: impl Into<String>) -> (StatusCode, Json<ApiError>) {
    (StatusCode::BAD_REQUEST, Json(ApiError::new(msg)))
}

/// Retourne `true` si les premiers `SNIFF_BYTES` octets contiennent un octet NUL.
fn has_null_bytes(data: &[u8]) -> bool {
    let check_len = data.len().min(SNIFF_BYTES);
    data[..check_len].contains(&0u8)
}

/// Valide les octets bruts d'un upload : taille, contenu binaire, encodage UTF-8.
/// Journalise et retourne une erreur HTTP 400 en cas de rejet.
fn validate_upload_bytes(
    body: &Bytes,
    context: &str,
) -> Result<(), (StatusCode, Json<ApiError>)> {
    if body.len() > MAX_UPLOAD_BYTES {
        eprintln!(
            "[upload-rejected] ts={} context={} size={} reason=file_too_large",
            chrono::Utc::now().to_rfc3339(),
            context,
            body.len()
        );
        return Err(bad_req(format!(
            "File too large: maximum is {}MB.",
            MAX_UPLOAD_BYTES / 1024 / 1024
        )));
    }

    if has_null_bytes(body) {
        eprintln!(
            "[upload-rejected] ts={} context={} size={} reason=binary_content",
            chrono::Utc::now().to_rfc3339(),
            context,
            body.len()
        );
        return Err(bad_req(
            "Only plain text log files are accepted: binary content detected.",
        ));
    }

    if std::str::from_utf8(body).is_err() {
        eprintln!(
            "[upload-rejected] ts={} context={} size={} reason=invalid_utf8",
            chrono::Utc::now().to_rfc3339(),
            context,
            body.len()
        );
        return Err(bad_req(
            "Only plain text log files are accepted: invalid UTF-8 encoding.",
        ));
    }

    Ok(())
}

/// Valide un fichier déjà écrit sur disque : extension et contenu binaire.
fn validate_log_file_on_disk(
    file_path: &std::path::Path,
    file_name: &str,
) -> Result<(), (StatusCode, Json<ApiError>)> {
    use std::io::Read;

    // Vérification de l'extension
    let ext = file_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    if !ALLOWED_EXTENSIONS.contains(&ext.as_str()) {
        eprintln!(
            "[upload-rejected] ts={} file={} reason=disallowed_extension_{}",
            chrono::Utc::now().to_rfc3339(),
            file_name,
            ext
        );
        return Err(bad_req(
            "Only plain text log files are accepted (.log, .txt).",
        ));
    }

    // Lecture des premiers SNIFF_BYTES octets pour détecter le contenu binaire
    let mut f = std::fs::File::open(file_path)
        .map_err(|e| bad_req(format!("Cannot read uploaded file: {}", e)))?;
    let mut buf = [0u8; SNIFF_BYTES];
    let n = f
        .read(&mut buf)
        .map_err(|e| bad_req(format!("Cannot read uploaded file: {}", e)))?;

    if buf[..n].contains(&0u8) {
        eprintln!(
            "[upload-rejected] ts={} file={} reason=binary_content",
            chrono::Utc::now().to_rfc3339(),
            file_name
        );
        return Err(bad_req(
            "Only plain text log files are accepted: binary content detected.",
        ));
    }

    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/upload
// Corps : fichier de log brut (multipart ou raw bytes)
// Query : guild_id, uploader_id, date?, label?, dry_run?
// ─────────────────────────────────────────────────────────────────────────────
pub async fn upload_log(
    State(pool) : State<AppState>,
    Query(q)    : Query<UploadQuery>,
    body        : Bytes,
) -> ApiResult<UploadResponse> {
    // Validation : taille, contenu binaire, encodage UTF-8
    let context = format!("guild_id={}", q.guild_id);
    validate_upload_bytes(&body, &context)?;

    let content = std::str::from_utf8(&body)
        .map_err(|_| bad_req("Only plain text log files are accepted: invalid UTF-8 encoding."))?
        .to_string();

    // Écrire dans un fichier temporaire pour réutiliser import_log_file
    let nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let tmp_path = std::env::temp_dir().join(format!("pika_upload_{}_{}.log", q.guild_id, nonce));
    std::fs::write(&tmp_path, &content).map_err(|e| db_err(e))?;

    let base_date = match &q.date {
        Some(s) => NaiveDate::parse_from_str(s, "%Y-%m-%d")
            .map_err(|_| bad_req(format!("Date invalide: {}", s)))?,
        None    => chrono::Local::now().date_naive(),
    };

    let opts = ImportOptions {
        base_date,
        guild_id      : q.guild_id,
        uploader_id   : q.uploader_id,
        dry_run       : q.dry_run.unwrap_or(false),
        with_abilities: true,
        group_label   : q.label.clone(),
    };

    let result = import_log_file(&pool, &tmp_path, &opts)
        .await
        .map_err(|e| db_err(e))?;

    let _ = std::fs::remove_file(&tmp_path);

    Ok(Json(UploadResponse {
        ok              : true,
        fights_detected : result.fights_detected,
        runs_inserted   : result.runs_inserted,
        runs_skipped    : result.runs_skipped,
        message         : format!(
            "{} fight(s) détecté(s), {} importé(s), {} ignoré(s)",
            result.fights_detected, result.runs_inserted, result.runs_skipped
        ),
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/parse-preview
// Parse un log et retourne l'analyse en texte (sans DB)
// ─────────────────────────────────────────────────────────────────────────────
pub async fn parse_preview(body: Bytes) -> Result<String, (StatusCode, Json<ApiError>)> {
    // Validation : taille et contenu binaire (pas de journalisation IP ici — endpoint interne)
    validate_upload_bytes(&body, "parse-preview")?;

    let content = std::str::from_utf8(&body)
        .map_err(|_| bad_req("Only plain text log files are accepted: invalid UTF-8 encoding."))?
        .to_string();
    let events  = read_events(&content);
    let fights  = extract_kills(events.clone());
    let classes = infer_player_classes(&events);

    if fights.is_empty() {
        return Ok("Aucun kill détecté.".to_string());
    }

    let mut out = Vec::new();
    for fight in &fights {
        out.push(render_fight(fight, &classes, false));
    }
    Ok(out.join("\n"))
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bosses
// Liste tous les boss qui ont des runs en DB
// ─────────────────────────────────────────────────────────────────────────────
pub async fn list_bosses(State(pool): State<AppState>) -> ApiResult<Vec<BossRow>> {
    let rows: Vec<BossRow> = sqlx::query_as(
        "SELECT id, name FROM bosses ORDER BY name"
    )
    .fetch_all(pool.as_ref())
    .await
    .map_err(db_err)?;

    Ok(Json(rows))
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leaderboard/:boss_id
// Query: role?, class?, limit? (défaut 50)
// Meilleur DPS par joueur (un score par joueur, son record perso)
// ─────────────────────────────────────────────────────────────────────────────
#[derive(serde::Deserialize)]
pub struct LeaderboardQuery {
    pub role    : Option<String>,
    pub class   : Option<String>,
    pub limit   : Option<u32>,
}

pub async fn leaderboard(
    State(pool)  : State<AppState>,
    Path(boss_id): Path<i64>,
    Query(q)     : Query<LeaderboardQuery>,
) -> ApiResult<Vec<LeaderboardRow>> {
    let limit = q.limit.unwrap_or(50).min(200) as i64;

    // Requête avec filtres optionnels role/class
    // "Meilleur score par joueur" = GROUP BY player + ORDER BY MAX(dps)
    let rows: Vec<LeaderboardRow> = sqlx::query_as(
        r#"
        SELECT
            p.name          AS player_name,
            p.class         AS class,
            rp.role         AS role,
            MAX(rp.dps)     AS dps,
            rp.hps          AS hps,
            rp.aps          AS aps,
            r.id            AS run_id,
            b.name          AS boss_name,
            COALESCE(r.bossDurationS, r.durationTotalS) AS duration_s,
            r.startedAt     AS started_at,
            g.name          AS guild_name
        FROM run_players rp
        INNER JOIN runs    r  ON rp.runId    = r.id
        INNER JOIN players p  ON rp.playerId = p.id
        INNER JOIN bosses  b  ON r.bossId    = b.id
        INNER JOIN guilds  g  ON r.guildId   = g.id
        WHERE r.bossId = ?
          AND (? IS NULL OR rp.role  = ?)
          AND (? IS NULL OR p.class  = ?)
        GROUP BY p.name, p.class, rp.role, rp.hps, rp.aps,
                 r.id, b.name, r.bossDurationS, r.durationTotalS,
                 r.startedAt, g.name
        ORDER BY dps DESC
        LIMIT ?
        "#
    )
    .bind(boss_id)
    .bind(&q.role).bind(&q.role)
    .bind(&q.class).bind(&q.class)
    .bind(limit)
    .fetch_all(pool.as_ref())
    .await
    .map_err(db_err)?;

    Ok(Json(rows))
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/fastest/:boss_id
// Meilleurs temps de kill par groupe (roster unique)
// ─────────────────────────────────────────────────────────────────────────────
pub async fn fastest_kills(
    State(pool)  : State<AppState>,
    Path(boss_id): Path<i64>,
    Query(q)     : Query<LeaderboardQuery>,
) -> ApiResult<Vec<FastestKillRow>> {
    let limit = q.limit.unwrap_or(20).min(100) as i64;

    let rows: Vec<FastestKillRow> = sqlx::query_as(
        r#"
        SELECT
            r.id                AS run_id,
            b.name              AS boss_name,
            g.name              AS guild_name,
            gr.rosterHash       AS roster_hash,
            COALESCE(r.bossDurationS, r.durationTotalS) AS duration_s,
            r.dpsGroup          AS dps_group,
            r.startedAt         AS started_at
        FROM runs r
        INNER JOIN bosses b  ON r.bossId  = b.id
        INNER JOIN guilds g  ON r.guildId = g.id
        INNER JOIN `groups` gr ON r.groupId = gr.id
        WHERE r.bossId = ?
        ORDER BY duration_s ASC, r.dpsGroup DESC
        LIMIT ?
        "#
    )
    .bind(boss_id)
    .bind(limit)
    .fetch_all(pool.as_ref())
    .await
    .map_err(db_err)?;

    Ok(Json(rows))
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/run/:run_id
// Détail complet d'un run (header + liste joueurs)
// ─────────────────────────────────────────────────────────────────────────────
pub async fn run_detail(
    State(pool)  : State<AppState>,
    Path(run_id) : Path<i64>,
) -> ApiResult<RunDetailResponse> {
    let run: Option<RunInfo> = sqlx::query_as(
        r#"
        SELECT
            r.id                AS id,
            b.name              AS boss_name,
            g.name              AS guild_name,
            r.startedAt         AS started_at,
            r.durationTotalS    AS duration_total_s,
            r.bossDurationS     AS boss_duration_s,
            r.dpsGroup          AS dps_group,
            r.hpsGroup          AS hps_group,
            r.apsGroup          AS aps_group
        FROM runs r
        INNER JOIN bosses b ON r.bossId  = b.id
        INNER JOIN guilds g ON r.guildId = g.id
        WHERE r.id = ?
        "#
    )
    .bind(run_id)
    .fetch_optional(pool.as_ref())
    .await
    .map_err(db_err)?;

    let run = run.ok_or_else(|| {
        (StatusCode::NOT_FOUND, Json(ApiError::new("Run introuvable")))
    })?;

    let players: Vec<RunPlayerRow> = sqlx::query_as(
        r#"
        SELECT
            p.name          AS player_name,
            p.class         AS class,
            rp.role         AS role,
            rp.damage       AS damage,
            rp.healing      AS healing,
            rp.absorbed     AS absorbed,
            rp.dps          AS dps,
            rp.hps          AS hps,
            rp.aps          AS aps,
            rp.overheal     AS overheal,
            rd.deathCount   AS death_count
        FROM run_players rp
        INNER JOIN players p ON rp.playerId = p.id
        LEFT JOIN run_deaths rd ON rd.runId = rp.runId AND rd.playerId = rp.playerId
        WHERE rp.runId = ?
        ORDER BY rp.dps DESC
        "#
    )
    .bind(run_id)
    .fetch_all(pool.as_ref())
    .await
    .map_err(db_err)?;

    Ok(Json(RunDetailResponse { run, players }))
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/run/:run_id/player/:player_name/abilities
// Breakdown par ability pour un joueur dans un run
// ─────────────────────────────────────────────────────────────────────────────
pub async fn player_abilities(
    State(pool)              : State<AppState>,
    Path((run_id, player_name)): Path<(i64, String)>,
) -> ApiResult<PlayerAbilitiesResponse> {
    // Récupérer les infos du run + joueur
    let header: Option<(i64, String, i32, Option<i32>, i64, f64)> = sqlx::query_as(
        r#"
        SELECT
            r.id,
            b.name,
            r.durationTotalS,
            r.bossDurationS,
            rp.damage,
            rp.dps
        FROM runs r
        INNER JOIN bosses b ON r.bossId = b.id
        INNER JOIN run_players rp ON rp.runId = r.id
        INNER JOIN players p ON rp.playerId = p.id
        WHERE r.id = ? AND p.name = ?
        "#
    )
    .bind(run_id)
    .bind(&player_name)
    .fetch_optional(pool.as_ref())
    .await
    .map_err(db_err)?;

    let (_, boss_name, dur_total, dur_boss, total_damage, dps) =
        header.ok_or_else(|| {
            (StatusCode::NOT_FOUND, Json(ApiError::new("Run ou joueur introuvable")))
        })?;

    let duration_s = dur_boss.unwrap_or(dur_total);

    let abilities: Vec<AbilityRow> = sqlx::query_as(
        r#"
        SELECT
            rpa.abilityId   AS ability_id,
            rpa.abilityName AS ability_name,
            rpa.total       AS total,
            rpa.hits        AS hits,
            rpa.critRate    AS crit_rate,
            rpa.minHit      AS min_hit,
            rpa.maxHit      AS max_hit,
            rpa.avgHit      AS avg_hit,
            rpa.rate        AS rate,
            rpa.pct         AS pct,
            rpa.absorbed    AS absorbed
        FROM run_player_abilities rpa
        INNER JOIN players p ON rpa.playerId = p.id
        WHERE rpa.runId = ? AND p.name = ? AND rpa.kind = 'DAMAGE'
        ORDER BY rpa.total DESC
        "#
    )
    .bind(run_id)
    .bind(&player_name)
    .fetch_all(pool.as_ref())
    .await
    .map_err(db_err)?;

    Ok(Json(PlayerAbilitiesResponse {
        run_id,
        player_name,
        boss_name,
        duration_s,
        total_damage,
        dps,
        abilities,
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/recent
// Derniers runs uploadés (toutes guildes)
// Query: limit? (défaut 20), guild_id?
// ─────────────────────────────────────────────────────────────────────────────
#[derive(serde::Deserialize)]
pub struct RecentQuery {
    pub limit    : Option<u32>,
    pub guild_id : Option<i64>,
}

pub async fn recent_runs(
    State(pool): State<AppState>,
    Query(q)   : Query<RecentQuery>,
) -> ApiResult<Vec<RecentRunRow>> {
    let limit = q.limit.unwrap_or(20).min(100) as i64;

    let rows: Vec<RecentRunRow> = sqlx::query_as(
        r#"
        SELECT
            r.id            AS run_id,
            b.name          AS boss_name,
            g.name          AS guild_name,
            r.startedAt     AS started_at,
            COALESCE(r.bossDurationS, r.durationTotalS) AS duration_s,
            r.dpsGroup      AS dps_group,
            r.hpsGroup      AS hps_group,
            gr.rosterSize   AS roster_size
        FROM runs r
        INNER JOIN bosses  b  ON r.bossId   = b.id
        INNER JOIN guilds  g  ON r.guildId  = g.id
        INNER JOIN `groups` gr ON r.groupId = gr.id
        WHERE (? IS NULL OR r.guildId = ?)
        ORDER BY r.createdAt DESC
        LIMIT ?
        "#
    )
    .bind(q.guild_id).bind(q.guild_id)
    .bind(limit)
    .fetch_all(pool.as_ref())
    .await
    .map_err(db_err)?;

    Ok(Json(rows))
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/player/:name
// Tous les runs d'un joueur (lookup)
// ─────────────────────────────────────────────────────────────────────────────
pub async fn player_lookup(
    State(pool)      : State<AppState>,
    Path(player_name): Path<String>,
) -> ApiResult<Vec<PlayerLookupRow>> {
    let rows: Vec<PlayerLookupRow> = sqlx::query_as(
        r#"
        SELECT
            r.id            AS run_id,
            b.name          AS boss_name,
            g.name          AS guild_name,
            r.startedAt     AS started_at,
            COALESCE(r.bossDurationS, r.durationTotalS) AS duration_s,
            rp.dps          AS dps,
            rp.hps          AS hps,
            rp.aps          AS aps,
            rp.role         AS role,
            p.class         AS class
        FROM run_players rp
        INNER JOIN runs    r ON rp.runId    = r.id
        INNER JOIN players p ON rp.playerId = p.id
        INNER JOIN bosses  b ON r.bossId    = b.id
        INNER JOIN guilds  g ON r.guildId   = g.id
        WHERE p.name = ?
        ORDER BY r.startedAt DESC
        LIMIT 200
        "#
    )
    .bind(&player_name)
    .fetch_all(pool.as_ref())
    .await
    .map_err(db_err)?;

    Ok(Json(rows))
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/top-players/:boss_id
// Top joueurs par classe (meilleur score personnel, toutes dates)
// ─────────────────────────────────────────────────────────────────────────────
pub async fn top_players(
    State(pool)  : State<AppState>,
    Path(boss_id): Path<i64>,
    Query(q)     : Query<LeaderboardQuery>,
) -> ApiResult<Vec<TopPlayerRow>> {
    let limit = q.limit.unwrap_or(100).min(500) as i64;

    let rows: Vec<TopPlayerRow> = sqlx::query_as(
        r#"
        SELECT
            p.name          AS player_name,
            p.class         AS class,
            rp.role         AS role,
            MAX(rp.dps)     AS best_dps,
            MAX(rp.hps)     AS best_hps,
            COUNT(rp.runId) AS run_count,
            b.name          AS boss_name
        FROM run_players rp
        INNER JOIN players p ON rp.playerId = p.id
        INNER JOIN runs    r ON rp.runId    = r.id
        INNER JOIN bosses  b ON r.bossId    = b.id
        WHERE r.bossId = ?
          AND (? IS NULL OR p.class = ?)
          AND (? IS NULL OR rp.role = ?)
        GROUP BY p.name, p.class, rp.role, b.name
        ORDER BY best_dps DESC
        LIMIT ?
        "#
    )
    .bind(boss_id)
    .bind(&q.class).bind(&q.class)
    .bind(&q.role).bind(&q.role)
    .bind(limit)
    .fetch_all(pool.as_ref())
    .await
    .map_err(db_err)?;

    Ok(Json(rows))
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /parse
// Appelé par le frontend après sauvegarde du fichier sur le volume partagé.
// Body JSON : { fileName, guildId, uploaderAccountId }
// ─────────────────────────────────────────────────────────────────────────────
pub async fn parse_file(
    State(pool): State<AppState>,
    Json(req)  : Json<ParseRequest>,
) -> ApiResult<UploadResponse> {
    let guild_id: i64 = req.guild_id.parse()
        .map_err(|_| bad_req("guildId invalide"))?;
    let uploader_id: i64 = req.uploader_account_id.parse()
        .map_err(|_| bad_req("uploaderAccountId invalide"))?;

    // Protection path traversal : on ne garde que le nom de fichier, sans répertoire.
    let file_name = std::path::Path::new(&req.file_name)
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| bad_req("fileName invalide"))?
        .to_string();

    let base_dir = std::env::var("COMBATLOG_DIR")
        .unwrap_or_else(|_| "/data/combat.log".to_string());

    let file_path = std::path::Path::new(&base_dir).join(&file_name);

    if !file_path.exists() {
        return Err(bad_req(format!("Fichier introuvable sur le volume: {}", file_name)));
    }

    // Validation du fichier sur disque : extension et contenu binaire
    validate_log_file_on_disk(&file_path, &file_name)?;

    let opts = ImportOptions {
        base_date     : chrono::Local::now().date_naive(),
        guild_id,
        uploader_id,
        dry_run       : false,
        with_abilities: true,
        group_label   : None,
    };

    let result = import_log_file(&pool, &file_path, &opts)
        .await
        .map_err(|e| db_err(e))?;

    Ok(Json(UploadResponse {
        ok              : true,
        fights_detected : result.fights_detected,
        runs_inserted   : result.runs_inserted,
        runs_skipped    : result.runs_skipped,
        message         : format!(
            "{} fight(s) détecté(s), {} importé(s), {} ignoré(s)",
            result.fights_detected, result.runs_inserted, result.runs_skipped
        ),
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health
// ─────────────────────────────────────────────────────────────────────────────
pub async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "service": "pika-parser" }))
}
