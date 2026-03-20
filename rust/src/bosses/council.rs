// src/bosses/council.rs
//
// Le Concile du Destin : 3 membres à tuer.
// Le fight se termine quand les 3 sont morts.

use crate::types::{Fight, Phase};

pub const COUNCIL_MEMBERS: &[&str] = &[
    "countessa danazhal",
    "marquise boldoch",
    "marchioness boldoch",
    "comte pluezhal",
    "count pluezhal",
    "count pleuzhal",
];

pub fn is_council_member(name: &str) -> bool {
    let low = name.to_lowercase();
    COUNCIL_MEMBERS.iter().any(|m| low.contains(m))
}

pub fn build_phases(fight: &Fight) -> Vec<Phase> {
    // Phases = une par membre (du début jusqu'à la mort de chacun)
    // Pour simplifier le stockage, on retourne une seule phase "Boss" couvrant tout le fight
    vec![Phase {
        name      : "Boss".to_string(),
        start_sec : fight.start_sec,
        end_sec   : fight.end_sec,
        boss_name : Some("Le Concile du Destin".to_string()),
    }]
}
