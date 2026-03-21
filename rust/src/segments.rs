// src/segments.rs
//
// Construction des segments de run à insérer en DB.
// 1 segment = 1 ligne dans la table `runs`.
// Pour les boss simples : 1 segment.
// Pour Isiel : 2 segments (Vengeur + Isiel).
// Pour Titan X : 1 segment avec bossDurationS distinct.

use crate::types::{Fight};

fn norm(s: &str) -> String {
    s.split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .to_lowercase()
}

fn duration_between(start: u32, end: u32) -> u32 {
    if end >= start { end - start } else { (86400 - start) + end }
}

// ─────────────────────────────────────────────────────────────────────────────
// RunSegment
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Clone)]
pub struct RunSegment {
    /// Nom canonique du boss pour cette entrée en DB
    pub boss_name       : String,

    /// Bornes du combat (pour startedAt / endedAt en DB)
    pub start_sec       : u32,
    pub end_sec         : u32,

    /// Filtre dégâts : sur quel boss calculer DPS/HPS
    pub boss_filter     : Option<String>,

    /// Durée totale du segment (durationTotalS en DB)
    pub duration_total_s: u32,

    /// Durée de la phase boss seule (bossDurationS en DB), si différente
    pub boss_duration_s : Option<u32>,

    /// Fenêtre de stats (peut différer des bornes si boss_duration_s est défini)
    pub stats_start     : u32,
    pub stats_end       : u32,
}

impl RunSegment {
    /// Durée effective pour les calculs DPS/HPS
    pub fn effective_duration(&self) -> u32 {
        self.boss_duration_s.unwrap_or(self.duration_total_s).max(1)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// build_segments
// ─────────────────────────────────────────────────────────────────────────────
pub fn build_segments(fight: &Fight) -> Vec<RunSegment> {
    let enc          = norm(&fight.encounter);
    let total_dur    = duration_between(fight.start_sec, fight.end_sec).max(1);
    let phases       = &fight.phases;

    // ── Titan X ──────────────────────────────────────────────────────────
    if enc == norm("Titan X") && !phases.is_empty() {
        let boss_phase = phases.iter()
            .find(|p| norm(&p.name) == "boss")
            .unwrap_or(&phases[0]);

        let boss_dur = duration_between(boss_phase.start_sec, boss_phase.end_sec).max(1);
        let boss_name = boss_phase.boss_name.clone()
            .unwrap_or_else(|| fight.encounter.clone());

        return vec![RunSegment {
            boss_name,
            start_sec        : fight.start_sec,
            end_sec          : fight.end_sec,
            boss_filter      : boss_phase.boss_name.clone(),
            duration_total_s : total_dur,
            boss_duration_s  : Some(boss_dur),
            stats_start      : boss_phase.start_sec,
            stats_end        : boss_phase.end_sec,
        }];
    }

    // ── Commandant Isiel ─────────────────────────────────────────────────
    if enc == norm("Commandant Isiel") && !phases.is_empty() {
        let mut segs = Vec::new();

        let vengeur_phase = phases.iter().find(|p| norm(&p.name).contains("vengeur"));
        let isiel_phase   = phases.iter().find(|p| norm(&p.name).contains("isiel"));

        if let Some(vp) = vengeur_phase {
            let vdur        = duration_between(vp.start_sec, vp.end_sec).max(1);
            // boss_filter = raw log name (used to filter events in memory)
            let vfilter     = vp.boss_name.clone().unwrap_or_else(|| "Vindicator MK1".to_string());
            segs.push(RunSegment {
                boss_name        : "Vindicator MK1".to_string(), // canonical EN name for DB
                start_sec        : vp.start_sec,
                end_sec          : vp.end_sec,
                boss_filter      : Some(vfilter),
                duration_total_s : vdur,
                boss_duration_s  : None,
                stats_start      : vp.start_sec,
                stats_end        : vp.end_sec,
            });
        }

        // Segment Isiel = durée totale du combat + phase boss distincte
        // boss_filter = raw log name (used to filter events in memory)
        let isiel_filter = isiel_phase
            .and_then(|p| p.boss_name.clone())
            .unwrap_or_else(|| fight.encounter.clone());
        let isiel_dur   = isiel_phase
            .map(|p| duration_between(p.start_sec, p.end_sec).max(1));
        let (is_stats_start, is_stats_end) = isiel_phase
            .map(|p| (p.start_sec, p.end_sec))
            .unwrap_or((fight.start_sec, fight.end_sec));

        segs.push(RunSegment {
            boss_name        : "Commandant Isiel".to_string(), // canonical EN name for DB
            start_sec        : fight.start_sec,
            end_sec          : fight.end_sec,
            boss_filter      : Some(isiel_filter),
            duration_total_s : total_dur,
            boss_duration_s  : isiel_dur,
            stats_start      : is_stats_start,
            stats_end        : is_stats_end,
        });

        return segs;
    }

    // ── Boss commun : 1 segment ───────────────────────────────────────────
    vec![RunSegment {
        boss_name        : fight.encounter.clone(),
        start_sec        : fight.start_sec,
        end_sec          : fight.end_sec,
        boss_filter      : Some(fight.encounter.clone()),
        duration_total_s : total_dur,
        boss_duration_s  : None,
        stats_start      : fight.start_sec,
        stats_end        : fight.end_sec,
    }]
}
