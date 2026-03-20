// src/db/config.rs

use anyhow::{Context, Result};
use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;

#[derive(Debug, Clone)]
pub struct DbConfig {
    pub host    : String,
    pub port    : u16,
    pub user    : String,
    pub password: String,
    pub database: String,
}

impl DbConfig {
    /// Construit depuis les variables d'environnement.
    /// Priorité 1 : DATABASE_URL  (format mysql://user:pass@host:port/db)
    /// Priorité 2 : DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
    pub fn from_env() -> Result<Self> {
        if let Ok(url) = std::env::var("DATABASE_URL") {
            if !url.is_empty() {
                return Self::from_url(&url);
            }
        }
        let host = std::env::var("DB_HOST")
            .or_else(|_| std::env::var("MYSQL_HOST"))
            .unwrap_or_else(|_| "127.0.0.1".to_string());
        let port = std::env::var("DB_PORT")
            .or_else(|_| std::env::var("MYSQL_PORT"))
            .unwrap_or_else(|_| "3306".to_string())
            .parse::<u16>()
            .context("DB_PORT invalide")?;
        let user = std::env::var("DB_USER")
            .or_else(|_| std::env::var("MYSQL_USER"))
            .context("DB_USER manquant")?;
        let password = std::env::var("DB_PASSWORD")
            .or_else(|_| std::env::var("MYSQL_PASSWORD"))
            .unwrap_or_default();
        let database = std::env::var("DB_NAME")
            .or_else(|_| std::env::var("MYSQL_DATABASE"))
            .context("DB_NAME manquant")?;
        Ok(Self { host, port, user, password, database })
    }

    fn from_url(url: &str) -> Result<Self> {
        // mysql://user:password@host:port/database
        let without_scheme = url.trim_start_matches("mysql://")
            .trim_start_matches("mysql2://");

        let (userinfo, hostdb) = without_scheme.split_once('@')
            .context("DATABASE_URL invalide (pas de @)")?;

        let (user, password) = userinfo.split_once(':')
            .map(|(u, p)| (u.to_string(), p.to_string()))
            .unwrap_or_else(|| (userinfo.to_string(), String::new()));

        let (hostport, database) = hostdb.split_once('/')
            .context("DATABASE_URL invalide (pas de /database)")?;

        let (host, port) = if let Some((h, p)) = hostport.split_once(':') {
            (h.to_string(), p.parse::<u16>().unwrap_or(3306))
        } else {
            (hostport.to_string(), 3306u16)
        };

        Ok(Self {
            host,
            port,
            user    : urlencoding_decode(&user),
            password: urlencoding_decode(&password),
            database: database.to_string(),
        })
    }

    pub fn connection_string(&self) -> String {
        format!(
            "mysql://{}:{}@{}:{}/{}",
            self.user, self.password, self.host, self.port, self.database
        )
    }
}

fn urlencoding_decode(s: &str) -> String {
    // Décodage minimal de %XX
    let mut out = String::with_capacity(s.len());
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '%' {
            let h1 = chars.next().unwrap_or('0');
            let h2 = chars.next().unwrap_or('0');
            if let Ok(byte) = u8::from_str_radix(&format!("{}{}", h1, h2), 16) {
                out.push(byte as char);
            }
        } else {
            out.push(c);
        }
    }
    out
}

pub async fn create_pool(cfg: &DbConfig) -> Result<MySqlPool> {
    let pool = MySqlPoolOptions::new()
        .max_connections(5)
        .connect(&cfg.connection_string())
        .await
        .context("Impossible de se connecter à MySQL")?;
    Ok(pool)
}
