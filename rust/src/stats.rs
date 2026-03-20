// src/stats.rs
//
// Calculs de stats agrégées sur les events d'un fight.
// Formule PT pour TotalDamage : amount + absorbed + blocked + ignored (intercepted exclu)

use std::collections::HashMap;
use crate::types::{ActionCode, CharKind, CombatEvent};

const DAMAGE_CODES: &[ActionCode] = &[
    ActionCode::NormalDamage,
    ActionCode::DotDamage,
    ActionCode::DamageCrit,
    ActionCode::Block,
    ActionCode::SelfDamage,
];

const HEAL_CODES: &[ActionCode] = &[
    ActionCode::HealNonCrit,
    ActionCode::HealCrit,
];

const ABSORB_CODES: &[ActionCode] = &[
    ActionCode::Absorb,
    ActionCode::AbsorbCrit,
];

fn in_window(ev: &CombatEvent, start: u32, end: u32) -> bool {
    ev.ts_sec >= start && ev.ts_sec <= end
}

/// Dégâts par joueur (source Player → cible NPC)
/// boss_filter : si Some(name), filtre uniquement les events vers ce boss
pub fn sum_damage(
    events     : &[CombatEvent],
    start      : u32,
    end        : u32,
    boss_filter: Option<&str>,
) -> HashMap<String, i64> {
    let boss_low = boss_filter.map(|s| s.to_lowercase());
    let mut out  = HashMap::new();

    for ev in events {
        if !in_window(ev, start, end) { continue; }
        if ev.src_kind != CharKind::Player { continue; }
        if ev.dst_kind != CharKind::Npc    { continue; }
        if ev.src.is_empty()               { continue; }

        let is_dmg = DAMAGE_CODES.contains(&ev.code);
        if !is_dmg { continue; }

        if let Some(ref bl) = boss_low {
            if !ev.dst.to_lowercase().contains(bl.as_str()) { continue; }
        }

        // Formule PT : amount + absorbed + blocked + ignored (intercepted exclu)
        let total = ev.amount + ev.absorbed + ev.blocked + ev.ignored;
        if total <= 0 { continue; }

        *out.entry(ev.src.clone()).or_insert(0i64) += total;
    }
    out
}

/// Soins bruts par joueur (source Player, toutes cibles)
pub fn sum_heal(events: &[CombatEvent], start: u32, end: u32) -> HashMap<String, i64> {
    let mut out = HashMap::new();
    for ev in events {
        if !in_window(ev, start, end) { continue; }
        if ev.src_kind != CharKind::Player { continue; }
        if ev.src.is_empty()               { continue; }
        if !HEAL_CODES.contains(&ev.code)  { continue; }
        if ev.amount <= 0                  { continue; }
        *out.entry(ev.src.clone()).or_insert(0i64) += ev.amount;
    }
    out
}

/// Soins effectifs (EHPS) = soins bruts − overheal
pub fn sum_eheal(events: &[CombatEvent], start: u32, end: u32) -> HashMap<String, i64> {
    let mut out = HashMap::new();
    for ev in events {
        if !in_window(ev, start, end) { continue; }
        if ev.src_kind != CharKind::Player { continue; }
        if ev.src.is_empty()               { continue; }
        if !HEAL_CODES.contains(&ev.code)  { continue; }
        let eheal = (ev.amount - ev.overheal).max(0);
        if eheal <= 0 { continue; }
        *out.entry(ev.src.clone()).or_insert(0i64) += eheal;
    }
    out
}

/// Absorptions (boucliers) par joueur (source Player, APS)
pub fn sum_absorbed(events: &[CombatEvent], start: u32, end: u32) -> HashMap<String, i64> {
    let mut out = HashMap::new();
    for ev in events {
        if !in_window(ev, start, end) { continue; }
        if ev.src_kind != CharKind::Player { continue; }
        if ev.src.is_empty()               { continue; }
        if !ABSORB_CODES.contains(&ev.code) { continue; }
        if ev.amount <= 0                   { continue; }
        *out.entry(ev.src.clone()).or_insert(0i64) += ev.amount;
    }
    out
}

/// Overheal par joueur
pub fn sum_overheal(events: &[CombatEvent], start: u32, end: u32) -> HashMap<String, i64> {
    let mut out = HashMap::new();
    for ev in events {
        if !in_window(ev, start, end) { continue; }
        if ev.src_kind != CharKind::Player { continue; }
        if ev.src.is_empty()               { continue; }
        if !HEAL_CODES.contains(&ev.code)  { continue; }
        if ev.overheal <= 0                { continue; }
        *out.entry(ev.src.clone()).or_insert(0i64) += ev.overheal;
    }
    out
}

/// Dégâts bloqués cumulés par joueur (pour les stats de la run)
pub fn sum_blocked(events: &[CombatEvent], start: u32, end: u32) -> HashMap<String, i64> {
    let mut out = HashMap::new();
    for ev in events {
        if !in_window(ev, start, end) { continue; }
        if ev.src_kind != CharKind::Player { continue; }
        if ev.src.is_empty()               { continue; }
        if ev.blocked <= 0                 { continue; }
        *out.entry(ev.src.clone()).or_insert(0i64) += ev.blocked;
    }
    out
}

/// Roster = union des joueurs qui ont fait des dégâts ou des soins
pub fn build_roster(
    dmg : &HashMap<String, i64>,
    heal: &HashMap<String, i64>,
) -> Vec<String> {
    let mut players: Vec<String> = dmg.keys()
        .chain(heal.keys())
        .cloned()
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();
    players.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
    players
}

/// Morts de joueurs : {player → count, premier décès en sec}
#[derive(Debug, Default, Clone)]
pub struct DeathInfo {
    pub count          : u32,
    pub first_death_sec: Option<u32>,
    pub last_death_sec : Option<u32>,
}

pub fn sum_player_deaths(events: &[CombatEvent], start: u32, end: u32) -> HashMap<String, DeathInfo> {
    let mut out: HashMap<String, DeathInfo> = HashMap::new();
    for ev in events {
        if !in_window(ev, start, end) { continue; }
        if !ev.is_player_death_by_npc() { continue; }
        let e = out.entry(ev.dst.clone()).or_default();
        e.count += 1;
        if e.first_death_sec.is_none() { e.first_death_sec = Some(ev.ts_sec); }
        e.last_death_sec = Some(ev.ts_sec);
    }
    out
}
