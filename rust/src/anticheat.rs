// src/anticheat.rs
//
// Détection de patterns de triche dans les logs de combat.
// Chaque pattern est une variante de CheatKind ; ajouter un nouveau pattern =
// ajouter une variante + implémenter son check dans `run_checks`.

use crate::types::CombatEvent;

// ─────────────────────────────────────────────────────────────────────────────
// Types publics
// ─────────────────────────────────────────────────────────────────────────────

/// Catégorie de triche détectée.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CheatKind {
    // Les patterns concrets seront définis ultérieurement.
    // Exemple futur : DpsSpike { player: String, dps: f64, threshold: f64 },
}

/// Violation détectée dans un log.
#[derive(Debug, Clone)]
pub struct CheatViolation {
    pub kind    : CheatKind,
    /// Message lisible pour les logs / réponse API.
    pub message : String,
}

/// Résultat de l'analyse anticheat.
#[derive(Debug)]
pub struct AntiCheatReport {
    pub violations: Vec<CheatViolation>,
}

impl AntiCheatReport {
    pub fn is_clean(&self) -> bool {
        self.violations.is_empty()
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Point d'entrée public
// ─────────────────────────────────────────────────────────────────────────────

/// Analyse les événements d'un log et retourne un rapport anticheat.
/// Retourne `Err` uniquement en cas d'erreur interne (jamais pour une simple violation).
pub fn check_log(events: &[CombatEvent]) -> AntiCheatReport {
    let mut violations = Vec::new();

    run_checks(events, &mut violations);

    AntiCheatReport { violations }
}

// ─────────────────────────────────────────────────────────────────────────────
// Checks individuels
// ─────────────────────────────────────────────────────────────────────────────

fn run_checks(events: &[CombatEvent], violations: &mut Vec<CheatViolation>) {
    // Les patterns seront ajoutés ici au fur et à mesure.
    // Exemple de structure attendue :
    //
    //   check_dps_spike(events, violations);
    //   check_impossible_crit_rate(events, violations);
    //
    let _ = events; // évite l'avertissement "unused" tant qu'il n'y a pas de checks
    let _ = violations;
}
