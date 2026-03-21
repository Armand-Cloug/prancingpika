// src/bosses/isiel.rs

use crate::types::{ActionCode, Fight, Phase};

const VINDICATOR_NAMES: &[&str] = &[
    "vindicator mk1", "vengeur i", "vergelter ausf. 1",
    "vindicator", "vengeur", "vergelter",
];

fn is_vindicator(name: &str) -> bool {
    let low = name.to_lowercase();
    VINDICATOR_NAMES.iter().any(|n| low.contains(n))
}

fn is_isiel(name: &str) -> bool {
    let low = name.to_lowercase();
    low.contains("isiel") || low.contains("kommandant") || low.contains("commandant")
}

pub fn build_phases(fight: &Fight) -> Vec<Phase> {
    // Détecter le vrai nom du Vindicator tel qu'il apparaît dans le log (FR/EN/DE)
    let vin_actual = fight.events.iter()
        .find(|ev| is_vindicator(&ev.dst) && ev.is_damage())
        .map(|ev| ev.dst.clone());

    // Détecter le vrai nom d'Isiel
    let isiel_actual = fight.events.iter()
        .find(|ev| is_isiel(&ev.dst) && ev.is_damage())
        .map(|ev| ev.dst.clone());

    // Transition = mort du Vindicator (code 11)
    let transition = fight.events.iter()
        .find(|ev| ev.code == ActionCode::TargetSlain && is_vindicator(&ev.dst))
        .map(|ev| ev.ts_sec)
        // Fallback : premier dégât sur Isiel
        .or_else(|| fight.events.iter()
            .find(|ev| is_isiel(&ev.dst) && ev.is_damage())
            .map(|ev| ev.ts_sec))
        .unwrap_or_else(|| fight.start_sec + fight.duration_sec() / 2);

    let vin_name   = vin_actual  .unwrap_or_else(|| "Vindicator MK1".to_string());
    let isiel_name = isiel_actual.unwrap_or_else(|| "Commandant Isiel".to_string());

    vec![
        Phase {
            name      : "Vengeur".to_string(),
            start_sec : fight.start_sec,
            end_sec   : transition,
            boss_name : Some(vin_name),
        },
        Phase {
            name      : "Isiel".to_string(),
            start_sec : transition,
            end_sec   : fight.end_sec,
            boss_name : Some(isiel_name),
        },
    ]
}