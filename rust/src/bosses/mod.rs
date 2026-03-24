// src/bosses/mod.rs
//
// Définitions des boss et handlers de phases.
// Philosophie : BossDef extensible avec aliases FR/EN/DE, handler séparé par boss complexe.

pub mod titan_x;
pub mod isiel;
pub mod council;

use once_cell::sync::Lazy;
use std::collections::HashMap;

use crate::types::{CombatEvent, Fight, Phase};

// ─────────────────────────────────────────────────────────────────────────────
// BossDef
// ─────────────────────────────────────────────────────────────────────────────
pub type PhaseHandler = fn(&Fight) -> Vec<Phase>;

pub struct BossDef {
    /// Nom canonique anglais (clé DB + affichage)
    pub name: &'static str,
    /// Aliases en FR / DE / EN alternatif — pour matcher les noms du log
    pub aliases: &'static [&'static str],
    /// Handler de phases spécifique à ce boss
    pub handler: PhaseHandler,
}

impl BossDef {
    /// Vérifie si un nom d'entité du log correspond à ce boss (case-insensitive, égalité exacte)
    pub fn matches(&self, entity: &str) -> bool {
        let low = entity.to_lowercase();
        if low == self.name.to_lowercase() {
            return true;
        }
        for alias in self.aliases {
            if low == alias.to_lowercase() {
                return true;
            }
        }
        false
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler commun (boss simple : phases = [Boss, start→end])
// ─────────────────────────────────────────────────────────────────────────────
fn common_handler(fight: &Fight) -> Vec<Phase> {
    vec![Phase {
        name      : "Boss".to_string(),
        start_sec : fight.start_sec,
        end_sec   : fight.end_sec,
        boss_name : Some(fight.encounter.clone()),
    }]
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalisation DisplayName (UpdateEncounterName de PT)
// Mappe noms FR/DE/EN → nom canonique anglais
// ─────────────────────────────────────────────────────────────────────────────
pub fn display_name(raw: &str) -> String {
    match raw {
        // Greenscale's Blight
        "Seigneur Vertécaille" | "Fürst Grünschuppe" => "Lord Greenscale",
        "Duc Letareus" | "Herzog Letareus" => "Duke Letareus",
        "Infiltrateur Johlen" => "Infiltrator Johlen",
        "Orakel Aleria" => "Oracle Aleria",
        "Prinz Hylas" | "Prince Hylas" => "Prince Hylas",

        // Hammerknell
        "Jornaru" => "Akylios",
        "Tyshe"   => "Akylios",
        "Tide Warden" | "Aqualix" | "Denizar" => "Inwar Darktide",

        // Drekanoth (Rhen of Fate)
        "Drekanoth des Schicksals" | "Drekanoth du Destin" => "Drekanoth of Fate",

        // Izkinra (Mount Sharax)
        "Warmaster Ilrath" | "Warmaster Shaddoth"
        | "Maître de guerre Shaddoth" | "Maître de guerre Ilrath" => "Izkinra",

        // Yrlwalach (Mount Sharax)
        "L'Yrlwalach" => "The Yrlwalach",

        // Gilded Prophecy
        "Anrak l'ignoble" | "Anrak der Üble" => "Anrak the Foul",

        // Tartaric Depths
        "Marchioness Boldoch" | "Count Pleuzhal" | "Countessa Danazhal"
        | "Boldoch's Soul" | "Pleuzhal's Soul" | "Danazhal's Soul"
        | "Marquise Boldoch" | "Âme de Pluezhal" | "Âme de Boldoch" | "Âme de Danazhal"
        | "Ame de Pluezhal" | "Ame de Boldoch" | "Ame de Danazhal"
        | "Comte Pluezhal" => "Le Concile du Destin",

        // Bastion of Steel
        "Vindicator MK1" | "Vergelter Ausf. 1" | "Vengeur I"
        | "Kommandant Isiel" | "Commandant Isiel" => "Commandant Isiel",

        // IROTP
        "Général Silgen" => "Général Silgen",
        "Grand-prêtre Arakhurn" | "High Priest Arakhurn" => "Grand-Prêtre Arakhurn",
        "Rejeton d'Arakhurn" => "Seething Core",
        "Général Silgen (Intrepid)" => "Général Silgen",

        // Gilded Prophecy / P.U.M.P.K.I.N.
        "GOLDJUNGE" | "PATATOR" => "P.U.M.P.K.I.N.",

        // Rune King Molinar
        "Prince Dollin" | "Roi runique Molinar" => "Rune King Molinar",

        // Council of fate
        "Pillars of Justice" | "Vis" | "Misericordia" => "Pillars of Justice",

        // Practice dummies FR/DE
        "Cible d'entraînement type boss de raid" | "Schlachtzugboss-Übungsfigur"
            => "Raid Boss Practice Dummy",
        "Cible d'entraînement type boss expert" | "Expertenboss-Übungsfigur"
            => "Expert Boss Practice Dummy",
        "Cible d'entraînement type boss de donjon" | "Dungeon-Boss-Übungsfigur"
            => "Dungeon Boss Practice Dummy",

        // Fragment
        "Fragment of Threngar" => "Threngar",

        other => other,
    }
    .to_string()
}

// ─────────────────────────────────────────────────────────────────────────────
// Registre global des boss
// ─────────────────────────────────────────────────────────────────────────────
pub static BOSS_DEFS: Lazy<HashMap<&'static str, BossDef>> = Lazy::new(|| {
    let mut m = HashMap::new();

    // Helper macro pour réduire la verbosité
    macro_rules! def {
        ($key:expr, $aliases:expr, $handler:expr) => {
            m.insert($key, BossDef { name: $key, aliases: $aliases, handler: $handler })
        };
    }

    // ── IROTP (Intrepid Rise of the Phoenix) ──────────────────────────────
    def!("Ereandorn",          &[],                          common_handler);
    def!("Beruhast",           &[],                          common_handler);
    def!("Général Silgen",     &["General Silgen",
                                 "Général Silgen (Intrepid)"],  common_handler);
    def!("Grand-Prêtre Arakhurn", &["High Priest Arakhurn",
                                    "Grand-prêtre Arakhurn"],   common_handler);
    def!("Seething Core",      &["Rejeton d'Arakhurn"],      common_handler);

    // ── TDNM (The Deep Night March) ──────────────────────────────────────
    def!("Beligosh",           &[],                          common_handler);
    def!("Tarjulia",           &[],                          common_handler);
    def!("Malannon",           &[],                          common_handler);

    // ── BOS (Bastion of Steel) ───────────────────────────────────────────
    def!("Azranel",            &[],                          common_handler);
    def!("Commandant Isiel",   &["Commander Isiel",
                                 "Kommandant Isiel",
                                 "Isiel"],                   isiel::build_phases);
    def!("Titan X",            &["TitanX"],                  titan_x::build_phases);

    // ── Tartaric Depths ──────────────────────────────────────────────────
    def!("Le Concile du Destin", &[
        "Countessa Danazhal", "Marquise Boldoch", "Marchioness Boldoch",
        "Comte Pluezhal",     "Count Pluezhal",   "Count Pleuzhal",
        "Boldoch's Soul",     "Âme de Boldoch",   "Ame de Boldoch",
        "Pleuzhal's Soul",    "Âme de Pluezhal",  "Ame de Pluezhal",
        "Danazhal's Soul",    "Âme de Danazhal",  "Ame de Danazhal",
    ], council::build_phases);

    // ── Mount Sharax ─────────────────────────────────────────────────────
    def!("Izkinra",            &["Warmaster Ilrath", "Warmaster Shaddoth",
                                 "Maître de guerre Ilrath",
                                 "Maître de guerre Shaddoth"], common_handler);
    def!("The Yrlwalach",      &["L'Yrlwalach"],              common_handler);
    def!("Bulf",               &[],                           common_handler);

    // ── Greenscale's Blight ──────────────────────────────────────────────
    def!("Lord Greenscale",    &["Seigneur Vertécaille",
                                 "Fürst Grünschuppe"],        common_handler);
    def!("Duke Letareus",      &["Duc Letareus",
                                 "Herzog Letareus"],           common_handler);
    def!("Infiltrator Johlen", &["Infiltrateur Johlen"],      common_handler);
    def!("Oracle Aleria",      &["Orakel Aleria"],            common_handler);
    def!("Prince Hylas",       &["Prinz Hylas"],              common_handler);

    // ── Hammerknell ──────────────────────────────────────────────────────
    def!("Akylios",            &["Jornaru", "Tyshe"],         common_handler);
    def!("Inwar Darktide",     &["Tide Warden", "Aqualix",
                                 "Denizar"],                  common_handler);

    // ── Gilded Prophecy ──────────────────────────────────────────────────
    def!("Anrak the Foul",     &["Anrak l'ignoble",
                                 "Anrak der Üble"],           common_handler);
    def!("Prince Hylas",       &["Prinz Hylas"],              common_handler);

    // ── Rhen of Fate ─────────────────────────────────────────────────────
    def!("Drekanoth of Fate",  &["Drekanoth des Schicksals",
                                 "Drekanoth du Destin"],      common_handler);
    def!("Skelf Brothers",     &["Hidrac", "Oonta", "Weyloz"], common_handler);

    // ── Mind of Madness ──────────────────────────────────────────────────
    def!("Pillars of Justice", &["Vis", "Misericordia"],      common_handler);

    // ── Practice dummies ─────────────────────────────────────────────────
    def!("Raid Boss Practice Dummy",   &[
        "Cible d'entraînement type boss de raid",
        "Schlachtzugboss-Übungsfigur",
    ], common_handler);
    def!("Expert Boss Practice Dummy", &[
        "Cible d'entraînement type boss expert",
        "Expertenboss-Übungsfigur",
    ], common_handler);
    def!("Dungeon Boss Practice Dummy", &[
        "Cible d'entraînement type boss de donjon",
        "Dungeon-Boss-Übungsfigur",
    ], common_handler);

    m
});

// ─────────────────────────────────────────────────────────────────────────────
// API publique
// ─────────────────────────────────────────────────────────────────────────────

/// Retourne la clé canonique du boss si le nom match, sinon None
pub fn match_boss_name(entity: &str) -> Option<&'static str> {
    if entity.is_empty() { return None; }
    for (key, def) in BOSS_DEFS.iter() {
        if def.matches(entity) {
            return Some(key);
        }
    }
    None
}

/// Vérifie si un événement implique activement ce boss (PT : boss_involved)
/// Exclut les marqueurs (code 0) et les morts (code 12) pour la validation pending
pub fn boss_involved(ev: &CombatEvent, boss_key: &str) -> bool {
    if ev.code_raw == 0 || ev.code == crate::types::ActionCode::Died { return false; }
    let def = match BOSS_DEFS.get(boss_key) {
        Some(d) => d,
        None    => return false,
    };
    def.matches(&ev.src) || def.matches(&ev.dst)
}

/// Construit les phases d'un fight selon le boss
pub fn build_phases_for_fight(fight: &Fight) -> Vec<Phase> {
    match BOSS_DEFS.get(fight.encounter.as_str()) {
        Some(def) => (def.handler)(fight),
        None      => common_handler(fight),
    }
}
