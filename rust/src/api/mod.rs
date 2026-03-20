// src/api/mod.rs

pub mod handlers;
pub mod routes;
pub mod models;

use anyhow::Result;
use sqlx::MySqlPool;

pub async fn serve(pool: MySqlPool, host: &str, port: u16) -> Result<()> {
    let app = routes::build_router(pool);
    let addr = format!("{}:{}", host, port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
