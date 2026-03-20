// src/bosses/titan_x.rs

use crate::types::{CharKind, Fight, Phase};

/// Titan X : phase "Adds" (avant le boss) puis phase "Boss" (Titan X lui-même)
/// La séparation se fait au premier event impliquant "Titan X" directement
pub fn build_phases(fight: &Fight) -> Vec<Phase> {
    // Cherche le premier event où Titan X est attaqué (src = Player, dst contient "Titan X")
    let boss_start = fight.events.iter().find(|ev| {
        ev.src_kind == CharKind::Player
            && ev.dst.to_lowercase().contains("titan x")
            && ev.is_damage()
    });

    match boss_start {
        Some(ev) => {
            let mid = ev.ts_sec;
            let mut phases = Vec::new();

            if mid > fight.start_sec {
                phases.push(Phase {
                    name      : "Adds".to_string(),
                    start_sec : fight.start_sec,
                    end_sec   : mid,
                    boss_name : None, // pas de filtre boss pour la phase adds
                });
            }

            phases.push(Phase {
                name      : "Boss".to_string(),
                start_sec : mid,
                end_sec   : fight.end_sec,
                boss_name : Some("Titan X".to_string()),
            });

            phases
        }
        None => vec![Phase {
            name      : "Boss".to_string(),
            start_sec : fight.start_sec,
            end_sec   : fight.end_sec,
            boss_name : Some("Titan X".to_string()),
        }],
    }
}
