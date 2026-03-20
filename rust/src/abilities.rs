// src/abilities.rs
//
// Calcul du détail par compétence.
// Clé canonique : ability_id (i64, langue-neutre, field[8] du tuple)
// ability_name : uniquement pour l'affichage

use std::collections::HashMap;
use crate::bosses::match_boss_name;
use crate::types::{ActionCode, Fight};

// ─────────────────────────────────────────────────────────────────────────────
// Codes par catégorie
// ─────────────────────────────────────────────────────────────────────────────
const DMG_NORMAL  : &[ActionCode] = &[ActionCode::NormalDamage, ActionCode::DotDamage, ActionCode::Block, ActionCode::SelfDamage];
const DMG_CRIT    : &[ActionCode] = &[ActionCode::DamageCrit];
const HEAL_NORMAL : &[ActionCode] = &[ActionCode::HealNonCrit];
const HEAL_CRIT   : &[ActionCode] = &[ActionCode::HealCrit];
const ABSORB_ALL  : &[ActionCode] = &[ActionCode::Absorb, ActionCode::AbsorbCrit];

pub fn is_dmg_ev(code: ActionCode)   -> bool { DMG_NORMAL.contains(&code) || DMG_CRIT.contains(&code) }
pub fn is_heal_ev(code: ActionCode)  -> bool { HEAL_NORMAL.contains(&code) || HEAL_CRIT.contains(&code) }
pub fn is_absorb_ev(code: ActionCode)-> bool { ABSORB_ALL.contains(&code) }
pub fn is_crit_ev(code: ActionCode)  -> bool {
    DMG_CRIT.contains(&code) || HEAL_CRIT.contains(&code) || code == ActionCode::AbsorbCrit
}

// ─────────────────────────────────────────────────────────────────────────────
// Statistiques d'une compétence
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Clone)]
pub struct AbilityStats {
    pub ability_id   : i64,
    pub ability_name : String,  // premier nom vu (pour affichage/DB)
    pub total        : i64,
    pub hits         : u32,
    pub crit_hits    : u32,
    pub min_hit      : i64,
    pub max_hit      : i64,
    pub absorbed     : i64,     // portion absorbée (côté cible)
}

impl AbilityStats {
    pub fn new(ability_id: i64, ability_name: &str) -> Self {
        Self {
            ability_id,
            ability_name : ability_name.to_string(),
            total        : 0,
            hits         : 0,
            crit_hits    : 0,
            min_hit      : 0,
            max_hit      : 0,
            absorbed     : 0,
        }
    }

    pub fn add(&mut self, amount: i64, absorbed: i64, crit: bool) {
        if self.hits == 0 {
            self.min_hit = amount;
            self.max_hit = amount;
        } else {
            if amount < self.min_hit { self.min_hit = amount; }
            if amount > self.max_hit { self.max_hit = amount; }
        }
        self.total    += amount;
        self.absorbed += absorbed;
        self.hits     += 1;
        if crit { self.crit_hits += 1; }
    }

    pub fn avg(&self) -> f64 {
        if self.hits == 0 { 0.0 } else { self.total as f64 / self.hits as f64 }
    }

    pub fn crit_rate(&self) -> f64 {
        if self.hits == 0 { 0.0 } else { self.crit_hits as f64 / self.hits as f64 * 100.0 }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ligne finale (données prêtes pour la DB / l'affichage)
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Clone)]
pub struct AbilityLine {
    pub ability_id   : i64,
    pub ability_name : String,
    pub total        : i64,
    pub hits         : u32,
    pub crit_rate    : f64,
    pub min_hit      : i64,
    pub max_hit      : i64,
    pub avg_hit      : f64,
    pub rate         : f64,   // DPS / HPS / APS sur la durée du segment
    pub pct          : f64,   // % de contribution
    pub absorbed     : i64,
}

// ─────────────────────────────────────────────────────────────────────────────
// Collecte par compétence (keyed by ability_id)
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AbilityKind {
    Damage,
    Heal,
    Absorb,
}

pub fn collect_by_ability(
    fight            : &Fight,
    player           : &str,
    kind             : AbilityKind,
    boss_only        : bool,
    win_start        : u32,
    win_end          : u32,
    boss_key_override: Option<&str>,
) -> HashMap<i64, AbilityStats> {
    let mut stats: HashMap<i64, AbilityStats> = HashMap::new();
    let player_low = player.to_lowercase();
    let boss_key   = boss_key_override.or(Some(fight.encounter.as_str()));

    for ev in &fight.events {
        if ev.ts_sec < win_start || ev.ts_sec > win_end   { continue; }
        if ev.src.to_lowercase() != player_low             { continue; }

        let (valid, amount, absorbed) = match kind {
            AbilityKind::Damage => {
                if !is_dmg_ev(ev.code) { continue; }
                if boss_only {
                    if let Some(bk) = boss_key {
                        if match_boss_name(&ev.dst).as_deref() != Some(bk) { continue; }
                    }
                }
                // Formule PT : amount + absorbed + blocked + ignored
                let total = ev.amount + ev.absorbed + ev.blocked + ev.ignored;
                (total > 0, total, ev.absorbed)
            }
            AbilityKind::Heal => {
                if !is_heal_ev(ev.code) { continue; }
                let eheal = (ev.amount - ev.overheal).max(0);
                (eheal > 0, eheal, 0i64)
            }
            AbilityKind::Absorb => {
                if !is_absorb_ev(ev.code) { continue; }
                (ev.amount > 0, ev.amount, 0i64)
            }
        };

        if !valid { continue; }

        let entry = stats.entry(ev.ability_id).or_insert_with(|| {
            AbilityStats::new(ev.ability_id, &ev.ability_name)
        });
        entry.add(amount, absorbed, is_crit_ev(ev.code));
    }

    stats
}

/// Convertit la HashMap<ability_id, AbilityStats> en Vec<AbilityLine> trié par total décroissant
pub fn to_lines(
    stats      : &HashMap<i64, AbilityStats>,
    duration_s : u32,
    total_player: i64,
) -> Vec<AbilityLine> {
    let dur = duration_s.max(1) as f64;
    let tot = if total_player > 0 { total_player as f64 } else { 1.0 };

    let mut lines: Vec<AbilityLine> = stats.values().map(|s| {
        AbilityLine {
            ability_id   : s.ability_id,
            ability_name : s.ability_name.clone(),
            total        : s.total,
            hits         : s.hits,
            crit_rate    : s.crit_rate(),
            min_hit      : s.min_hit,
            max_hit      : s.max_hit,
            avg_hit      : s.avg(),
            rate         : s.total as f64 / dur,
            pct          : s.total as f64 / tot * 100.0,
            absorbed     : s.absorbed,
        }
    }).collect();

    lines.sort_by(|a, b| b.total.cmp(&a.total));
    lines
}
