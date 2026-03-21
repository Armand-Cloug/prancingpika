// src/api/routes.rs

use std::sync::Arc;

use axum::{
    http::{Method},
    routing::{get, post},
    Router,
};
use sqlx::MySqlPool;
use tower_http::cors::{Any, CorsLayer};

use crate::api::handlers::*;

pub fn build_router(pool: MySqlPool) -> Router {
    let state = Arc::new(pool);

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(Any)
        .allow_origin(Any); // Restreindre en production via ALLOWED_ORIGIN env var

    Router::new()
        // ── Santé ───────────────────────────────────────────────────────
        .route("/api/health", get(health))

        // ── Upload / Preview ─────────────────────────────────────────────
        .route("/api/upload",         post(upload_log))
        .route("/parse",              post(parse_file))   // appelé par le frontend Next.js
        .route("/api/parse-preview",  post(parse_preview))

        // ── Référentiels ─────────────────────────────────────────────────
        .route("/api/bosses",         get(list_bosses))

        // ── Leaderboards ─────────────────────────────────────────────────
        .route("/api/leaderboard/:boss_id",  get(leaderboard))
        .route("/api/fastest/:boss_id",      get(fastest_kills))
        .route("/api/top-players/:boss_id",  get(top_players))

        // ── Détail run ───────────────────────────────────────────────────
        .route("/api/run/:run_id",           get(run_detail))
        .route(
            "/api/run/:run_id/player/:player_name/abilities",
            get(player_abilities),
        )

        // ── Historique / lookup ───────────────────────────────────────────
        .route("/api/recent",          get(recent_runs))
        .route("/api/player/:name",    get(player_lookup))

        // ── State + middleware ────────────────────────────────────────────
        .with_state(state)
        .layer(cors)
}
