// src/bosses/isiel.rs
//
// Commandant Isiel = 2 phases consécutives (non chevauchantes) :
//   Phase 1 "Vengeur" : Vindicator MK1 / Vengeur I / Vergelter Ausf. 1
//   Phase 2 "Isiel"   : Commandant Isiel lui-même
//
// Point de transition = mort du Vindicator (code 11, TargetSlain)
// Fallback = premier event impliquant Isiel

use crate::types::{ActionCode, Fight, Phase};

const VINDICATOR_NAMES: &[&str] = &[
    "vindicator mk1",
    "vengeur i",
    "vergelter ausf. 1",
    "vindicator",
    "vengeur",
    "vergelter",
];

fn is_vindicator(name: &str) -> bool {
    let low = name.to_lowercase();
    VINDICATOR_NAMES.iter().any(|n| low.contains(n))
}

fn is_isiel(name: &str) -> bool {
    let low = name.to_lowercase();
    low.contains("isiel")
}

pub fn build_phases(fight: &Fight) -> Vec<Phase> {
    // Priorité 1 : mort du Vindicator (code 11 = TargetSlain)
    // C'est le moment exact de la transition entre les deux phases
    let vindicator_death = fight.events.iter().find(|ev| {
        ev.code == ActionCode::TargetSlain && is_vindicator(&ev.dst)
    }).map(|ev| ev.ts_sec);

    // Priorité 2 : premier event de dégâts sur Isiel (début de la phase Isiel)
    let isiel_start = fight.events.iter().find(|ev| {
        is_isiel(&ev.dst) && ev.is_damage()
    }).map(|ev| ev.ts_sec);

    // Point de transition : mort du Vindicator, sinon début d'Isiel, sinon milieu du fight
    let transition = vindicator_death
        .or(isiel_start)
        .unwrap_or_else(|| fight.start_sec + fight.duration_sec() / 2);

    // Les deux phases ne se chevauchent pas : Vengeur[start→transition], Isiel[transition→end]
    vec![
        Phase {
            name      : "Vengeur".to_string(),
            start_sec : fight.start_sec,
            end_sec   : transition,
            boss_name : Some("Vindicator MK1".to_string()),
        },
        Phase {
            name      : "Isiel".to_string(),
            start_sec : transition,
            end_sec   : fight.end_sec,
            boss_name : Some("Commandant Isiel".to_string()),
        },
    ]
}