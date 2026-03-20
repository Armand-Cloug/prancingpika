// src/main.rs
//
// CLI pika-parser
//
// Commandes :
//   parse    <fichier>   Affiche les résultats dans le terminal (dry analysis)
//   import   <fichier>   Parse + insère en DB (sans affichage détaillé)
//   serve                Lance le serveur HTTP API pour l'app web
//   inspect  <fichier>   Affiche le résumé des fights détectés (rapide)

use std::path::PathBuf;
use std::process;

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use chrono::NaiveDate;

use pika_parser::db::config::{create_pool, DbConfig};
use pika_parser::db::import::{import_log_file, ImportOptions};
use pika_parser::event_reader::read_events;
use pika_parser::fight_extractor::extract_kills;
use pika_parser::output::{render_fight, render_summary};
use pika_parser::player_class::infer_player_classes;

// ─────────────────────────────────────────────────────────────────────────────
// CLI definition (Clap)
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Parser)]
#[command(
    name    = "pika-parser",
    version = "0.1.0",
    about   = "Rift combat-log parser — analyse et import DB",
    long_about = None,
)]
struct Cli {
    /// Chemin vers le fichier .env (défaut: .env)
    #[arg(long, default_value = ".env", global = true)]
    env_file: PathBuf,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Parse un fichier de log et affiche les résultats dans le terminal
    Parse {
        /// Fichier de log Rift à analyser
        logfile: PathBuf,

        /// Afficher le breakdown par ability pour chaque joueur
        #[arg(long, short = 'a')]
        abilities: bool,

        /// Numéro du fight à afficher uniquement (1-based, tous par défaut)
        #[arg(long, short = 'f')]
        fight: Option<u32>,
    },

    /// Parse un fichier et affiche uniquement la liste des fights détectés
    Inspect {
        /// Fichier de log Rift à inspecter
        logfile: PathBuf,
    },

    /// Parse un fichier de log et insère les résultats en DB
    Import {
        /// Fichier de log Rift à importer
        logfile: PathBuf,

        /// Date du log YYYY-MM-DD (défaut: aujourd'hui)
        #[arg(long, short = 'd')]
        date: Option<String>,

        /// ID de la guilde (obligatoire)
        #[arg(long, short = 'g')]
        guild_id: i64,

        /// ID du compte uploadeur (obligatoire)
        #[arg(long, short = 'u')]
        uploader_id: i64,

        /// Ne pas insérer en DB, afficher ce qui serait importé
        #[arg(long)]
        dry_run: bool,

        /// Ne pas insérer le détail des abilities (plus rapide)
        #[arg(long)]
        skip_abilities: bool,

        /// Label optionnel pour identifier le roster (ex: nom du raid)
        #[arg(long)]
        label: Option<String>,
    },

    /// Lance le serveur HTTP API pour l'application web
    Serve {
        /// Adresse d'écoute (défaut: 0.0.0.0)
        #[arg(long, default_value = "0.0.0.0")]
        host: String,

        /// Port d'écoute (défaut: 3001)
        #[arg(long, short = 'p', default_value = "3001")]
        port: u16,
    },
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────
#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    // Charger le .env
    if let Err(e) = dotenvy::from_path(&cli.env_file) {
        // Non-fatal : les vars peuvent être déjà dans l'environnement
        eprintln!("[warn] .env non chargé depuis {:?}: {}", cli.env_file, e);
    }

    if let Err(e) = run(cli.command).await {
        eprintln!("❌ Erreur: {:?}", e);
        process::exit(1);
    }
}

async fn run(cmd: Commands) -> Result<()> {
    match cmd {
        Commands::Parse { logfile, abilities, fight } => {
            cmd_parse(&logfile, abilities, fight).await
        }
        Commands::Inspect { logfile } => {
            cmd_inspect(&logfile).await
        }
        Commands::Import {
            logfile, date, guild_id, uploader_id,
            dry_run, skip_abilities, label,
        } => {
            cmd_import(
                &logfile, date, guild_id, uploader_id,
                dry_run, skip_abilities, label,
            ).await
        }
        Commands::Serve { host, port } => {
            cmd_serve(&host, port).await
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// parse — analyse et affichage terminal
// ─────────────────────────────────────────────────────────────────────────────
async fn cmd_parse(
    logfile       : &PathBuf,
    show_abilities: bool,
    fight_filter  : Option<u32>,
) -> Result<()> {
    let content = std::fs::read_to_string(logfile)
        .with_context(|| format!("Lecture de {}", logfile.display()))?;

    println!("🔍 Parsing de {} …", logfile.display());

    let events = read_events(&content);
    let fights = extract_kills(events.clone());
    let classes = infer_player_classes(&events);

    if fights.is_empty() {
        println!("Aucun kill de boss détecté.");
        return Ok(());
    }

    render_summary(&fights);

    for fight in &fights {
        if let Some(n) = fight_filter {
            if fight.kill_index != n { continue; }
        }
        let rendered = render_fight(fight, &classes, show_abilities);
        println!("{}", rendered);
    }

    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// inspect — liste rapide des fights
// ─────────────────────────────────────────────────────────────────────────────
async fn cmd_inspect(logfile: &PathBuf) -> Result<()> {
    let content = std::fs::read_to_string(logfile)
        .with_context(|| format!("Lecture de {}", logfile.display()))?;

    let events = read_events(&content);
    let fights = extract_kills(events);

    render_summary(&fights);

    for fight in &fights {
        let phases: Vec<String> = fight.phases.iter()
            .map(|p| format!("{}({}s)", p.name,
                p.end_sec.saturating_sub(p.start_sec)))
            .collect();
        println!("  Kill #{:02} │ {:30} │ {} events │ phases: {}",
            fight.kill_index,
            fight.encounter,
            fight.events.len(),
            if phases.is_empty() { "-".to_string() } else { phases.join(", ") },
        );
    }
    println!();

    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// import — insertion en DB
// ─────────────────────────────────────────────────────────────────────────────
async fn cmd_import(
    logfile       : &PathBuf,
    date          : Option<String>,
    guild_id      : i64,
    uploader_id   : i64,
    dry_run       : bool,
    skip_abilities: bool,
    label         : Option<String>,
) -> Result<()> {
    let base_date = match date {
        Some(ref s) => NaiveDate::parse_from_str(s, "%Y-%m-%d")
            .with_context(|| format!("Format de date invalide: {} (attendu: YYYY-MM-DD)", s))?,
        None => chrono::Local::now().date_naive(),
    };

    if dry_run {
        println!("🔍 Mode dry-run — aucune écriture en DB");
    } else {
        println!("📥 Import de {} …", logfile.display());
    }

    let opts = ImportOptions {
        base_date,
        guild_id,
        uploader_id,
        dry_run,
        with_abilities: !skip_abilities,
        group_label: label,
    };

    // Connexion DB seulement si pas dry-run
    let pool = if dry_run {
        // En dry-run, on a quand même besoin d'un pool pour les ensure_*
        // On essaie, si ça échoue, on continue en mode "vraiment dry"
        match DbConfig::from_env() {
            Ok(cfg) => match create_pool(&cfg).await {
                Ok(p)  => Some(p),
                Err(e) => {
                    eprintln!("[dry-run] Pas de connexion DB ({}), simulation pure", e);
                    None
                }
            },
            Err(_) => None,
        }
    } else {
        let cfg = DbConfig::from_env()
            .context("Configuration DB manquante — vérifier .env")?;
        let p = create_pool(&cfg).await?;
        Some(p)
    };

    if let Some(ref p) = pool {
        let result = import_log_file(p, logfile, &opts).await?;
        println!("\n✅ Import terminé :");
        println!("   Fights détectés : {}", result.fights_detected);
        println!("   Runs insérées   : {}", result.runs_inserted);
        println!("   Runs ignorées   : {} (déjà présentes)", result.runs_skipped);
    } else {
        // Dry-run sans DB : juste afficher le parsing
        let content = std::fs::read_to_string(logfile)?;
        let events  = read_events(&content);
        let fights  = extract_kills(events);
        render_summary(&fights);
        for fight in &fights {
            println!("[DRY] Kill #{} '{}' — {} events — {}s",
                fight.kill_index, fight.encounter,
                fight.events.len(), fight.duration_sec());
        }
    }

    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// serve — serveur HTTP API
// ─────────────────────────────────────────────────────────────────────────────
async fn cmd_serve(host: &str, port: u16) -> Result<()> {
    let cfg  = DbConfig::from_env().context("Configuration DB manquante")?;
    let pool = create_pool(&cfg).await?;

    println!("🚀 pika-parser API listening on {}:{}", host, port);

    pika_parser::api::serve(pool, host, port).await
}
