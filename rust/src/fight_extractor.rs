// src/fight_extractor.rs
//
// Détection des kills de boss dans un flux d'événements.
// Port fidèle de fight_extractor.py (PrancingPika) avec ajout de l'approche PT :
//   - Mort détectée via overkill > 0 (langue-neutre, PT) en priorité
//   - Fallback : code 11/12 + regex texte (PP)

use std::collections::{HashSet, VecDeque};

use once_cell::sync::Lazy;
use regex::Regex;

use crate::bosses::{boss_involved, build_phases_for_fight, match_boss_name};
use crate::bosses::council::is_council_member;
use crate::types::{ActionCode, CombatEvent, Fight};

// ─────────────────────────────────────────────────────────────────────────────
// Regex de détection de mort (fallback textuel si overkill == 0)
// Couvre FR et EN — DE également pour robustesse
// ─────────────────────────────────────────────────────────────────────────────
static DEATH_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(?:est\s+mort[e]?|has\s+died|ist\s+gestorben)").unwrap()
});
static KILL_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(?:\ba\s+tu[ée]\b|\bhas\s+slain\b|\bhat\s+getötet\b)").unwrap()
});

// Mots typiques d'une ligne de combat (filtre anti-parasite)
static COMBAT_WORD_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(inflige|dégâts?|touche|frappe|attaque|crit|critique|soigne|damage|heal|hits?|critically|suffers|afflicted)").unwrap()
});
static HAS_NUMBER_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\b\d+\b").unwrap()
});

// ─────────────────────────────────────────────────────────────────────────────
// Paramètres
// ─────────────────────────────────────────────────────────────────────────────
const REJOIN_GAP_SEC             : u32 = 90;
const BOSS_RECENT_SEC            : u32 = 180;
const CONFIRM_DEATH_AFTER_SEC    : u32 = 6;
const LOOKBACK_BEFORE_BEGIN_SEC  : u32 = 3;
const GLOBAL_BUFFER_SEC          : u32 = 12;
const MIN_COMBAT_INTERACTIONS    : usize = 2;

/// Vérifie si l'événement implique n'importe quel boss (src ou dst)
fn boss_involved_any(ev: &CombatEvent) -> bool {
    match_boss_name(&ev.src).is_some() || match_boss_name(&ev.dst).is_some()
}

/// Mort pending (code 12 "est mort" — à confirmer)
struct PendingDeath {
    boss_key    : String,
    event       : CombatEvent,
    invalidated : bool,
}

// ─────────────────────────────────────────────────────────────────────────────
// État de l'extracteur
// ─────────────────────────────────────────────────────────────────────────────
struct Extractor {
    fights             : Vec<Fight>,
    current_start      : Option<CombatEvent>,
    current_events     : Vec<CombatEvent>,
    kill_idx           : u32,
    last_combat_end    : Option<CombatEvent>,
    last_boss_seen_sec : Option<u32>,
    /// Premier hit impliquant le boss dans ce pull (peut précéder Combat Begin
    /// si le logger est entré en combat après le début effectif du fight)
    first_boss_hit_sec : Option<u32>,
    pending            : Option<PendingDeath>,
    recent             : VecDeque<CombatEvent>,
    council_dead       : HashSet<String>,
}

impl Extractor {
    fn new() -> Self {
        Self {
            fights             : Vec::new(),
            current_start      : None,
            current_events     : Vec::new(),
            kill_idx           : 0,
            last_combat_end    : None,
            last_boss_seen_sec : None,
            first_boss_hit_sec : None,
            pending            : None,
            recent             : VecDeque::new(),
            council_dead       : HashSet::new(),
        }
    }

    // ── Gestion de l'état ─────────────────────────────────────────────────

    fn reset_to_new_pull(&mut self, begin: CombatEvent) {
        // Cherche dans le buffer récent le premier hit boss avant ce Begin
        let begin_ts = begin.ts_sec;
        let earliest = self.recent.iter()
            .filter(|e| e.ts_sec <= begin_ts && boss_involved_any(e))
            .map(|e| e.ts_sec)
            .min();

        self.current_start      = Some(begin);
        self.current_events     = Vec::new();
        self.last_combat_end    = None;
        self.last_boss_seen_sec = None;
        self.first_boss_hit_sec = earliest;
        self.council_dead.clear();
        self.pending            = None;
    }

    fn discard(&mut self) {
        self.current_start      = None;
        self.current_events     = Vec::new();
        self.last_combat_end    = None;
        self.last_boss_seen_sec = None;
        self.first_boss_hit_sec = None;
        self.council_dead.clear();
        self.pending            = None;
    }

    fn note_boss_seen(&mut self, ev: &CombatEvent) {
        if match_boss_name(&ev.src).is_some() || match_boss_name(&ev.dst).is_some() {
            self.last_boss_seen_sec = Some(ev.ts_sec);
        }
    }

    fn note_first_boss_hit(&mut self, ev: &CombatEvent) {
        if boss_involved_any(ev) {
            let t = ev.ts_sec;
            self.first_boss_hit_sec = Some(match self.first_boss_hit_sec {
                Some(prev) => prev.min(t),
                None       => t,
            });
        }
    }

    // ── Finalisation d'un fight ───────────────────────────────────────────

    fn finalize(&mut self, encounter: &str, end_ev: &CombatEvent) {
        let start = match &self.current_start {
            Some(s) => s.clone(),
            None    => return,
        };

        // Utiliser le premier hit boss comme début réel (jamais après Combat Begin)
        let real_start_sec = self.first_boss_hit_sec
            .map(|t| t.min(start.ts_sec))
            .unwrap_or(start.ts_sec);

        self.kill_idx += 1;
        let mut fight = Fight {
            encounter  : encounter.to_string(),
            kill_index : self.kill_idx,
            start_sec  : real_start_sec,
            end_sec    : end_ev.ts_sec,
            start_ts   : start.ts_str.clone(),
            end_ts     : end_ev.ts_str.clone(),
            events     : self.current_events.clone(),
            phases     : Vec::new(),
        };
        fight.phases = build_phases_for_fight(&fight);
        self.fights.push(fight);
        self.discard();
    }

    // ── Confirmation pending ──────────────────────────────────────────────

    fn maybe_confirm_pending(&mut self, now_sec: u32) {
        let should_finalize = match &self.pending {
            Some(p) if !p.invalidated
                && self.current_start.is_some()
                && now_sec.saturating_sub(p.event.ts_sec) >= CONFIRM_DEATH_AFTER_SEC =>
            {
                Some((p.boss_key.clone(), p.event.clone()))
            }
            _ => None,
        };
        if let Some((key, ev)) = should_finalize {
            self.pending = None;
            self.finalize(&key, &ev);
        }
    }

    // ── Buffer circulaire anti-parasite ───────────────────────────────────

    fn trim_recent(&mut self, now_ts: u32) {
        let cutoff = now_ts.saturating_sub(GLOBAL_BUFFER_SEC);
        while self.recent.front().map_or(false, |e| e.ts_sec < cutoff) {
            self.recent.pop_front();
        }
    }

    fn is_combatlike_boss_interaction(&self, ev: &CombatEvent, boss_key: &str) -> bool {
        if !boss_involved(ev, boss_key) { return false; }
        if ev.code_raw == 0 || ev.code == ActionCode::TargetSlain || ev.code == ActionCode::Died {
            return false;
        }
        let other = if match_boss_name(&ev.src).is_some() { &ev.dst } else { &ev.src };
        if match_boss_name(other).is_some() { return false; }
        COMBAT_WORD_RE.is_match(&ev.raw) && HAS_NUMBER_RE.is_match(&ev.raw)
    }

    fn count_boss_interactions_before_begin(&self, boss_key: &str) -> usize {
        let begin_ts = match &self.current_start {
            Some(s) => s.ts_sec,
            None    => return 0,
        };
        let window_start = begin_ts.saturating_sub(LOOKBACK_BEFORE_BEGIN_SEC);
        let mut cnt = 0usize;

        for ev in self.recent.iter().rev() {
            if ev.ts_sec >= begin_ts   { continue; }
            if ev.ts_sec < window_start { break; }
            if self.is_combatlike_boss_interaction(ev, boss_key) {
                cnt += 1;
                if cnt >= MIN_COMBAT_INTERACTIONS { return cnt; }
            }
        }
        cnt
    }

    // ── Détection de qui est mort ─────────────────────────────────────────

    fn detect_death(&self, ev: &CombatEvent) -> Option<(String, bool)> {
        // Priorité 1 : code 11 TargetSlain (langue-neutre)
        if ev.code == ActionCode::TargetSlain {
            return Some((ev.dst.clone(), true)); // true = kill immédiat
        }

        // Priorité 2 : overkill > 0 via spéciaux parsés (PT, langue-neutre)
        // L'attaquant a tué la cible → dst est mort
        if ev.overkill > 0 && ev.is_damage() && !ev.dst.is_empty() {
            return Some((ev.dst.clone(), true));
        }

        // Priorité 3 : KILL_RE sur le texte (fallback FR/EN/DE)
        if KILL_RE.is_match(&ev.raw) {
            return Some((ev.dst.clone(), true));
        }

        // Priorité 4 : code 12 Died (langue-neutre)
        if ev.code == ActionCode::Died {
            return Some((ev.src.clone(), false)); // false = pending
        }

        // Priorité 5 : DEATH_RE sur le texte (fallback)
        if ev.code_raw == 12 || DEATH_RE.is_match(&ev.raw) {
            return Some((ev.src.clone(), false));
        }

        None
    }

    // ── Traitement principal d'un événement ──────────────────────────────

    fn process(&mut self, ev: CombatEvent) {
        // Buffer global
        self.recent.push_back(ev.clone());
        self.trim_recent(ev.ts_sec);

        // Confirmation pending ?
        self.maybe_confirm_pending(ev.ts_sec);

        // ── Combat Begin ───────────────────────────────────────────────
        if ev.is_combat_begin() {
            if self.current_start.is_none() {
                self.reset_to_new_pull(ev);
                return;
            }

            // Begin alors qu'un combat est ouvert → rejoin ou nouveau pull
            if let Some(ref last_end) = self.last_combat_end.clone() {
                let gap = ev.ts_sec.saturating_sub(last_end.ts_sec);
                let boss_recent = self.last_boss_seen_sec
                    .map_or(false, |t| ev.ts_sec.saturating_sub(t) <= BOSS_RECENT_SEC);
                if gap <= REJOIN_GAP_SEC && boss_recent {
                    self.current_events.push(ev);
                    self.last_combat_end = None;
                    return;
                }
            }
            self.reset_to_new_pull(ev);
            return;
        }

        // Hors combat → ignorer
        if self.current_start.is_none() {
            return;
        }

        self.current_events.push(ev.clone());
        self.note_boss_seen(&ev);
        self.note_first_boss_hit(&ev);

        // ── Combat End ────────────────────────────────────────────────
        if ev.is_combat_end() {
            self.last_combat_end = Some(ev);
            return;
        }

        // ── Invalidation pending si le boss réapparait ────────────────
        if let Some(ref mut p) = self.pending {
            if !p.invalidated && ev.ts_sec > p.event.ts_sec {
                if boss_involved(&ev, &p.boss_key.clone()) {
                    p.invalidated = true;
                }
            }
        }

        // ── Détection de mort ────────────────────────────────────────
        let died_info = self.detect_death(&ev);
        let (died_name, is_kill) = match died_info {
            Some(d) => d,
            None    => return,
        };

        let boss_key = match match_boss_name(&died_name) {
            Some(k) => k,
            None    => return,
        };

        // ── SPECIAL : Le Concile du Destin ────────────────────────────
        if boss_key == "Le Concile du Destin" {
            if !is_council_member(&died_name) {
                return; // ignorer âmes et adds
            }
            self.council_dead.insert(died_name.to_lowercase());
            if self.council_dead.len() < 3 { return; }

            if is_kill {
                let n = self.count_boss_interactions_before_begin(boss_key);
                if n >= MIN_COMBAT_INTERACTIONS {
                    eprintln!(
                        "[fight_extractor] Boss '{}' NON compté : Combat Begin trop tardif \
                         ({} interaction(s) dans les {}s avant Begin).",
                        boss_key, n, LOOKBACK_BEFORE_BEGIN_SEC
                    );
                    self.discard();
                    return;
                }
            }
            self.finalize(boss_key, &ev);
            return;
        }

        // ── Kill immédiat (code 11 / overkill / kill_re) ─────────────
        if is_kill {
            let n = self.count_boss_interactions_before_begin(boss_key);
            if n >= MIN_COMBAT_INTERACTIONS {
                eprintln!(
                    "[fight_extractor] Boss '{}' NON compté : Combat Begin trop tardif \
                     ({} interaction(s) dans les {}s avant Begin).",
                    boss_key, n, LOOKBACK_BEFORE_BEGIN_SEC
                );
                self.discard();
                return;
            }
            self.finalize(boss_key, &ev);
            return;
        }

        // ── Mort pending (code 12 / death_re) ────────────────────────
        self.pending = Some(PendingDeath {
            boss_key    : boss_key.to_string(),
            event       : ev,
            invalidated : false,
        });
    }

    // ── Finalisation globale ─────────────────────────────────────────────

    fn finish(mut self) -> Vec<Fight> {
        // Confirmer un pending encore valide en fin de fichier
        if self.current_start.is_some() {
            if let Some(p) = self.pending.take() {
                if !p.invalidated {
                    self.finalize(&p.boss_key.clone(), &p.event.clone());
                }
            }
        }
        self.fights
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// API publique
// ─────────────────────────────────────────────────────────────────────────────
pub fn extract_kills(events: Vec<CombatEvent>) -> Vec<Fight> {
    let mut ext = Extractor::new();
    for ev in events {
        ext.process(ev);
    }
    ext.finish()
}
