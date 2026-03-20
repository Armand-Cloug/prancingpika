// src/player_class.rs
//
// Détection de classe (calling) des joueurs.
// Approche PT étendue : events code=6 (BuffGain) + table ability_name → classe.
// Deux noms par entrée (FR + EN) pour une couverture complète.

use std::collections::HashMap;
use once_cell::sync::Lazy;

use crate::types::{ActionCode, CombatEvent};

pub const DEFAULT_CLASS: &str = "Unknown";

fn norm(s: &str) -> String {
    s.trim().to_lowercase()
}

// ─────────────────────────────────────────────────────────────────────────────
// Table ability_name (normalisé) → classe
// FR + EN + DE pour chaque entrée
// ─────────────────────────────────────────────────────────────────────────────
static ABILITY_TO_CLASS: Lazy<HashMap<String, &'static str>> = Lazy::new(|| {
    let entries: &[(&str, &str)] = &[
        // ── Rogue ─────────────────────────────────────────────────────────
        ("mode gardien",                    "Rogue"),
        ("guardian phase",                  "Rogue"),
        ("maîtrise du combat à distance",   "Rogue"),
        ("ranged combat mastery",           "Rogue"),
        ("coda of wrath",                   "Rogue"),
        ("power chord",                     "Rogue"),
        ("guarded steel",                   "Rogue"),
        ("planar splash",                   "Rogue"),
        ("phantom blow",                    "Rogue"),
        ("rapid fire shot",                 "Rogue"),
        ("hellfire blades",                 "Rogue"),

        // ── Warrior ───────────────────────────────────────────────────────
        ("inspirations profondes",          "Warrior"),
        ("deep breaths",                    "Warrior"),
        ("retournement de lame",            "Warrior"),
        ("turn the blade",                  "Warrior"),
        ("néant",                           "Warrior"),
        ("void",                            "Warrior"),
        ("posture prête",                   "Warrior"),
        ("ready posture",                   "Warrior"),
        ("conductivité améliorée",          "Warrior"),
        ("enhanced conductivity",           "Warrior"),
        ("lame-tempête",                    "Warrior"),
        ("storm blade",                     "Warrior"),
        ("unstable reaction",               "Warrior"),
        ("tempest",                         "Warrior"),
        ("balance of power",                "Warrior"),
        ("protector's fury",                "Warrior"),
        ("positive reaction",               "Warrior"),
        ("mass casualty response",          "Warrior"),
        ("rising waterfall",                "Warrior"),

        // ── Primalist ─────────────────────────────────────────────────────
        ("fontis de courroux",              "Primalist"),
        ("font of wrath",                   "Primalist"),
        ("fontis de barbarie",              "Primalist"),
        ("font of savagery",                "Primalist"),
        ("fontis de sublimation",           "Primalist"),
        ("font of sublimation",             "Primalist"),
        ("sauvagerie primitive",            "Primalist"),
        ("primal savagery",                 "Primalist"),
        ("fontis d'oblitération",           "Primalist"),
        ("font of obliteration",            "Primalist"),
        ("fontis de vitalité",              "Primalist"),
        ("font of vitality",                "Primalist"),
        ("fontis de soif de sang",          "Primalist"),
        ("font of bloodlust",               "Primalist"),
        ("fontis de rétribution",           "Primalist"),
        ("font of retaliation",             "Primalist"),
        ("fontis de frénésie",              "Primalist"),
        ("font of frenzy",                  "Primalist"),
        ("destin en sursis",                "Primalist"),
        ("delayed fate",                    "Primalist"),
        ("fontis de présence d'esprit",     "Primalist"),
        ("font of wit",                     "Primalist"),
        ("crystalline smash",               "Primalist"),
        ("wild storms",                     "Primalist"),
        ("air lash",                        "Primalist"),
        ("tailwind",                        "Primalist"),

        // ── Cleric ────────────────────────────────────────────────────────
        ("bénédiction de vitalité",         "Cleric"),
        ("boon of vitality",                "Cleric"),
        ("mine de souverain",               "Cleric"),
        ("mien of leadership",              "Cleric"),
        ("armure de dévotion",              "Cleric"),
        ("armor of devotion",               "Cleric"),
        ("armure du réveil",                "Cleric"),
        ("armor of awakening",              "Cleric"),
        ("conduit de la nature",            "Cleric"),
        ("conduit of nature",               "Cleric"),
        ("vengeance du nord primitif",      "Cleric"),
        ("vengeance of the winter storm",   "Cleric"),
        ("vengeance de la tempête hivernale","Cleric"),
        ("vengeance of the primal north",   "Cleric"),
        ("détermination héroïque",          "Cleric"),
        ("heroic resolve",                  "Cleric"),
        ("excès partagé",                   "Cleric"),
        ("shared excess",                   "Cleric"),
        ("glacial insignia",                "Cleric"),
        ("wasting insignia",                "Cleric"),
        ("hammer of faith",                 "Cleric"),
        ("hammer of duty",                  "Cleric"),
        ("fae mimicry",                     "Cleric"),
        ("bound fate",                      "Cleric"),
        ("bolt of retribution",             "Cleric"),
        ("massive blow",                    "Cleric"),
        ("siphon vitality",                 "Cleric"),

        // ── Mage ──────────────────────────────────────────────────────────
        ("rempart d'archonte",              "Mage"),
        ("archont's bulwark",               "Mage"),
        ("archon's bulwark",                "Mage"),
        ("puissance de neddra",             "Mage"),
        ("neddra's might",                  "Mage"),
        ("bienfait aqueux",                 "Mage"),
        ("aqueous blessing",                "Mage"),
        ("voile vivifiant",                 "Mage"),
        ("lifegiving veil",                 "Mage"),
        ("armure prismatique",              "Mage"),
        ("prismatic armor",                 "Mage"),
        ("charge foudroyante",              "Mage"),
        ("lightning charge",                "Mage"),
        ("armure de pyromancien",           "Mage"),
        ("pyromancer's armor",              "Mage"),
        ("voile des arcanes",               "Mage"),
        ("arcane ward",                     "Mage"),
        ("armure eldritch",                 "Mage"),
        ("eldritch armor",                  "Mage"),
        ("burning purpose",                 "Mage"),
        ("granite salvo",                   "Mage"),
        ("counter shock",                   "Mage"),
        ("icy fury",                        "Mage"),
        ("shattered reflection",            "Mage"),
        ("ruin",                            "Mage"),
        ("condemn",                         "Mage"),
        ("atrophy",                         "Mage"),
    ];

    entries.iter()
        .map(|(name, class)| (norm(name), *class))
        .collect()
});

// ─────────────────────────────────────────────────────────────────────────────
// Inférence
// ─────────────────────────────────────────────────────────────────────────────
pub fn infer_player_classes(events: &[CombatEvent]) -> HashMap<String, String> {
    // votes[player] = {class → count}
    let mut votes: HashMap<String, HashMap<String, u32>> = HashMap::new();

    for ev in events {
        // Code 6 = BuffGain : acquisition d'une capacité ou aura (meilleur signal)
        if ev.code != ActionCode::BuffGain { continue; }
        if ev.src.is_empty()               { continue; }

        let key = norm(&ev.ability_name);
        if let Some(class) = ABILITY_TO_CLASS.get(&key) {
            *votes.entry(ev.src.clone())
                  .or_default()
                  .entry(class.to_string())
                  .or_insert(0) += 1;
        }
    }

    // Résolution : classe la plus fréquente ; égalité → Unknown
    let mut out = HashMap::new();
    for (player, counts) in votes {
        if counts.is_empty() {
            out.insert(player, DEFAULT_CLASS.to_string());
            continue;
        }
        let max_count = counts.values().copied().max().unwrap_or(0);
        let best: Vec<&String> = counts.iter()
            .filter(|(_, v)| **v == max_count)
            .map(|(k, _)| k)
            .collect();

        let cls = if best.len() == 1 {
            best[0].clone()
        } else {
            DEFAULT_CLASS.to_string()
        };
        out.insert(player, cls);
    }
    out
}
