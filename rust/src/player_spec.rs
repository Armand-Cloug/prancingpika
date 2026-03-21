// src/player_spec.rs
//
// Détection de la spécialisation jouée (Marksman, Nightblade, Chloromancer…)
// Système de vote : on compte les abilities de chaque spec utilisées, la plus fréquente gagne.
// Basé sur les ability_names réels des logs Rift (FR + EN).

use std::collections::HashMap;
use once_cell::sync::Lazy;
use crate::types::{ActionCode, CombatEvent};

pub const DEFAULT_SPEC: &str = "Unknown";

fn norm(s: &str) -> String { s.trim().to_lowercase() }

// ─────────────────────────────────────────────────────────────────────────────
// Mapping ability_name → nom de spec
// Un même sort peut confirmer une spec (plusieurs entrées possibles par spec)
// ─────────────────────────────────────────────────────────────────────────────
static ABILITY_TO_SPEC: Lazy<HashMap<String, &'static str>> = Lazy::new(|| {
    let entries: &[(&str, &str)] = &[

        // ══ ROGUE ════════════════════════════════════════════════════════════
        // Marksman
        ("rapid fire shot",          "Marksman"),
        ("tir de barrage rapide",    "Marksman"),
        ("barbed shot",              "Marksman"),
        ("tir bardé de piques",      "Marksman"),
        ("strafe",                   "Marksman"),
        ("mitraillage",              "Marksman"),
        ("empyrean ascension",       "Marksman"),
        ("ascension empyréenne",     "Marksman"),
        ("shoot to kill",            "Marksman"),
        ("tir mortel",               "Marksman"),
        ("head shot",                "Marksman"),
        ("tir à la tête",            "Marksman"),
        ("trick shot",               "Marksman"),
        ("silver tip munitions",     "Marksman"),
        ("munitions à pointe d'argent","Marksman"),
        ("rending munitions",        "Marksman"),
        ("munitions déchirantes",    "Marksman"),

        // Nightblade
        ("dusk strike",              "Nightblade"),
        ("frappe du crépuscule",     "Nightblade"),
        ("hellfire blades",          "Nightblade"),
        ("lames d'enfer",            "Nightblade"),
        ("shadow fire",              "Nightblade"),
        ("feu des ombres",           "Nightblade"),
        ("twilight force",           "Nightblade"),
        ("force du crépuscule",      "Nightblade"),
        ("blazing fury",             "Nightblade"),
        ("furie ardente",            "Nightblade"),
        ("ebon fury",                "Nightblade"),
        ("furie ébène",              "Nightblade"),
        ("emptiness",                "Nightblade"),
        ("néant de l'ombre",         "Nightblade"),
        ("fell blades",              "Nightblade"),
        ("lames funestes",           "Nightblade"),
        ("flame blitz",              "Nightblade"),
        ("ruée enflammée",           "Nightblade"),
        ("touch of darkness",        "Nightblade"),
        ("contact des ténèbres",     "Nightblade"),

        // Bladedancer
        ("hundred blades",           "Bladedancer"),
        ("cent lames",               "Bladedancer"),
        ("blade tempo",              "Bladedancer"),
        ("tempo des lames",          "Bladedancer"),
        ("weapon flare",             "Bladedancer"),
        ("éclat d'arme",             "Bladedancer"),
        ("dancing steel",            "Bladedancer"),

        // Riftstalker (Tank)
        ("guarded steel",            "Riftstalker"),
        ("acier gardé",              "Riftstalker"),
        ("planar splash",            "Riftstalker"),
        ("éclaboussure planaire",    "Riftstalker"),
        ("phantom blow",             "Riftstalker"),
        ("coup fantôme",             "Riftstalker"),
        ("rift distortion",          "Riftstalker"),
        ("distorsion du rift",       "Riftstalker"),

        // Bard (Support)
        ("coda of wrath",            "Bard"),
        ("code de colère",           "Bard"),
        ("power chord",              "Bard"),
        ("accord puissant",          "Bard"),
        ("anthem of competence",     "Bard"),
        ("anthem of defiance",       "Bard"),
        ("verse of agony",           "Bard"),
        ("verset d'agonie",          "Bard"),
        ("motif of tenacity",        "Bard"),

        // ══ WARRIOR ══════════════════════════════════════════════════════════
        // Paragon
        ("rising waterfall",         "Paragon"),
        ("cascade montante",         "Paragon"),
        ("twin strike",              "Paragon"),
        ("double frappe",            "Paragon"),
        ("combined effort",          "Paragon"),

        // Riftblade
        ("storm blade",              "Riftblade"),
        ("lame-tempête",             "Riftblade"),
        ("turn the blade",           "Riftblade"),
        ("retournement de lame",     "Riftblade"),
        ("ethereal strikes",         "Riftblade"),
        ("frappes éthérées",         "Riftblade"),
        ("essence strike",           "Riftblade"),
        ("frappe d'essence",         "Riftblade"),
        ("building fury",            "Riftblade"),
        ("fureur croissante",        "Riftblade"),
        ("elemental affinity",       "Riftblade"),
        ("affinité élémentaire",     "Riftblade"),
        ("planar blade",             "Riftblade"),
        ("lame planaire",            "Riftblade"),

        // Champion
        ("mighty blow",              "Champion"),
        ("coup puissant",            "Champion"),
        ("battlefield intimidation", "Champion"),
        ("savage blow",              "Champion"),
        ("coup sauvage",             "Champion"),

        // Void Knight (Tank)
        ("unstable reaction",        "Void Knight"),
        ("réaction instable",        "Void Knight"),
        ("contempt",                 "Void Knight"),
        ("mépris",                   "Void Knight"),
        ("weapon defense",           "Void Knight"),
        ("défense armée",            "Void Knight"),
        ("tempest",                  "Void Knight"),
        ("tempête du vide",          "Void Knight"),

        // Paladin (Tank)
        ("balance of power",         "Paladin"),
        ("équilibre des forces",     "Paladin"),
        ("protector's fury",         "Paladin"),
        ("fureur du protecteur",     "Paladin"),
        ("hammer of faith",          "Paladin"),
        ("marteau de la foi",        "Paladin"),

        // Liberator (Healer)
        ("positive reaction",        "Liberator"),
        ("réaction positive",        "Liberator"),
        ("mass casualty response",   "Liberator"),
        ("death's door",             "Liberator"),

        // Tempest
        ("cross current",            "Tempest"),
        ("contre-courant",           "Tempest"),

        // ══ MAGE ══════════════════════════════════════════════════════════════
        // Chloromancer (Healer)
        ("ruin",                     "Chloromancer"),
        ("ruine",                    "Chloromancer"),
        ("lifegiving veil",          "Chloromancer"),
        ("voile vivifiant",          "Chloromancer"),
        ("nature's touch",           "Chloromancer"),
        ("contact de la nature",     "Chloromancer"),
        ("flourish",                 "Chloromancer"),
        ("épanouissement",           "Chloromancer"),
        ("withering vine",           "Chloromancer"),
        ("vigne flétrie",            "Chloromancer"),
        ("living seed",              "Chloromancer"),
        ("graine vivante",           "Chloromancer"),

        // Pyromancer
        ("flame bolt",               "Pyromancer"),
        ("carreau de flamme",        "Pyromancer"),
        ("fireball",                 "Pyromancer"),
        ("boule de feu",             "Pyromancer"),
        ("countdown",                "Pyromancer"),
        ("compte à rebours",         "Pyromancer"),
        ("burning bright",           "Pyromancer"),
        ("clarté ardente",           "Pyromancer"),
        ("dancing flames",           "Pyromancer"),
        ("flammes dansantes",        "Pyromancer"),

        // Necromancer
        ("condemn",                  "Necromancer"),
        ("condamner",                "Necromancer"),
        ("deathly calling",          "Necromancer"),
        ("appel mortel",             "Necromancer"),
        ("necrotic wounds",          "Necromancer"),

        // Warlock
        ("atrophy",                  "Warlock"),
        ("atrophie",                 "Warlock"),
        ("dark touch",               "Warlock"),
        ("vex",                      "Warlock"),
        ("soul sickness",            "Warlock"),

        // Stormcaller
        ("wailing winds",            "Stormcaller"),
        ("vents gémissants",         "Stormcaller"),
        ("living storm",             "Stormcaller"),
        ("tempête vivante",          "Stormcaller"),
        ("glacial strike",           "Stormcaller"),
        ("icy burst",                "Stormcaller"),
        ("rafale glaciale",          "Stormcaller"),

        // Arbiter (Tank)
        ("counter shock",            "Arbiter"),
        ("contre-choc",              "Arbiter"),
        ("icy fury",                 "Arbiter"),
        ("furie glaciale",           "Arbiter"),
        ("shattered reflection",     "Arbiter"),

        // Archon (Support)
        ("granite salvo",            "Archon"),
        ("burning purpose",          "Archon"),
        ("crumbling resistance",     "Archon"),
        ("affaiblissement des résistances", "Archon"),
        ("rock slide",               "Archon"),
        ("disrupting aura",          "Archon"),
        ("aura perturbatrice",       "Archon"),
        ("earth burst",              "Archon"),

        // Harbinger
        ("lucent slash",             "Harbinger"),
        ("entaille lumineuse",       "Harbinger"),

        // ══ CLERIC ═══════════════════════════════════════════════════════════
        // Warden (Healer)
        ("healing current",          "Warden"),
        ("courant guérisseur",       "Warden"),
        ("renewing pod",             "Warden"),
        ("cocon régénérateur",       "Warden"),
        ("ripple",                   "Warden"),
        ("ride",                     "Warden"),
        ("lifewarding beacon",       "Warden"),
        ("balise du gardien de vie", "Warden"),
        ("life and death concord",   "Warden"),
        ("concorde vie et mort",     "Warden"),
        ("orbs of the stream",       "Warden"),
        ("aerial boon",              "Warden"),
        ("bienfait aérien",          "Warden"),
        ("icy burst",                "Warden"),   // Warden also uses Icy Burst

        // Inquisitor
        ("bolt of retribution",      "Inquisitor"),
        ("carreau de rétribution",   "Inquisitor"),
        ("sanction",                 "Inquisitor"),
        ("recantation",              "Inquisitor"),
        ("seal of pain",             "Inquisitor"),
        ("sceau de douleur",         "Inquisitor"),

        // Druid
        ("fae mimicry",              "Druid"),
        ("mimétisme des fées",       "Druid"),
        ("natural harmony",          "Druid"),
        ("harmonie naturelle",       "Druid"),
        ("lebensanstieg",            "Druid"),

        // Shaman
        ("massive blow",             "Shaman"),
        ("coup massif",              "Shaman"),
        ("jolt",                     "Shaman"),
        ("enhanced burst",           "Shaman"),

        // Cabalist
        ("bound fate",               "Cabalist"),
        ("destin enchaîné",          "Cabalist"),
        ("clinging spirit",          "Cabalist"),
        ("esprit persistant",        "Cabalist"),
        ("symbol of corruption",     "Cabalist"),
        ("symbole de corruption",    "Cabalist"),

        // Oracle (Support)
        ("glacial insignia",         "Oracle"),
        ("symbole glacial",          "Oracle"),
        ("wasting insignia",         "Oracle"),
        ("shared excess",            "Oracle"),
        ("excès partagé",            "Oracle"),

        // Defiler (Healer)
        ("siphon vitality",          "Defiler"),
        ("siphon de vitalité",       "Defiler"),
        ("dark water",               "Defiler"),
        ("miasma",                   "Defiler"),
        ("scourge",                  "Defiler"),
        ("fléau",                    "Defiler"),
        ("miserly affliction",       "Defiler"),

        // Sentinel (Healer)
        ("healing invocation",       "Sentinel"),
        ("invocation curative",      "Sentinel"),
        ("divine call",              "Sentinel"),

        // Purifier (Healer)
        ("flame of life",            "Purifier"),
        ("flamme de vie",            "Purifier"),
        ("aggressive renewal",       "Purifier"),

        // Justicar (Tank)
        ("hammer of duty",           "Justicar"),
        ("marteau du devoir",        "Justicar"),
        ("mien of leadership",       "Justicar"),
        ("mine de souverain",        "Justicar"),

        // ══ PRIMALIST ════════════════════════════════════════════════════════
        // Berserker (DPS)
        ("primal savagery",          "Berserker"),
        ("sauvagerie primitive",     "Berserker"),
        ("call of savagery",         "Berserker"),
        ("appel de la sauvagerie",   "Berserker"),
        ("berserker's fury",         "Berserker"),
        ("fureur du berserker",      "Berserker"),
        ("titan's fury",             "Berserker"),
        ("fureur titanesque",        "Berserker"),
        ("predatory instincts",      "Berserker"),
        ("instincts prédateurs",     "Berserker"),
        ("rending slash",            "Berserker"),
        ("entaille déchirante",      "Berserker"),
        ("berserker's vitality",     "Berserker"),
        ("vitalité du berserker",    "Berserker"),

        // Typhoon (DPS)
        ("delayed fate",             "Typhoon"),
        ("destin en sursis",         "Typhoon"),
        ("thunderous kick",          "Typhoon"),
        ("coup foudroyant",          "Typhoon"),

        // Titan (Tank)
        ("crystalline smash",        "Titan"),
        ("fracassement cristallin",  "Titan"),
        ("earthquake",               "Titan"),
        ("tremblement de terre",     "Titan"),
        ("font of retaliation",      "Titan"),
        ("fontis de rétribution",    "Titan"),
        ("primal bonds",             "Titan"),
        ("liens primordiaux",        "Titan"),

        // Mystic (Support)
        ("wild storms",              "Mystic"),
        ("tempêtes sauvages",        "Mystic"),
        ("air lash",                 "Mystic"),
        ("fouet d'air",              "Mystic"),
        ("tailwind",                 "Mystic"),
        ("vent arrière",             "Mystic"),
        ("imbue with life",          "Mystic"),

        // Vulcanist
        ("eruption",                 "Vulcanist"),
        ("éruption",                 "Vulcanist"),

        // Dervish
        ("living storm",             "Dervish"),

        // Font spells → indiquent un Primalist (Berserker/support selon contexte)
        ("font of wrath",            "Berserker"),
        ("fontis de courroux",       "Berserker"),
        ("font of bloodlust",        "Berserker"),
        ("fontis de soif de sang",   "Berserker"),
        ("font of savagery",         "Berserker"),
        ("fontis de barbarie",       "Berserker"),
    ];
    entries.iter().map(|(n, s)| (norm(n), *s)).collect()
});

// ─────────────────────────────────────────────────────────────────────────────
// Codes d'action à observer pour la détection de spec
// ─────────────────────────────────────────────────────────────────────────────
const SPEC_ACTION_CODES: &[ActionCode] = &[
    ActionCode::NormalDamage, ActionCode::DotDamage, ActionCode::DamageCrit,
    ActionCode::Block,        ActionCode::SelfDamage,
    ActionCode::HealNonCrit,  ActionCode::HealCrit,
    ActionCode::Absorb,       ActionCode::AbsorbCrit,
    ActionCode::BuffGain,     ActionCode::DebuffAfflicted,
];

// ─────────────────────────────────────────────────────────────────────────────
// Inférence
// ─────────────────────────────────────────────────────────────────────────────
pub fn infer_player_specs(
    events: &[CombatEvent],
    start : u32,
    end   : u32,
) -> HashMap<String, String> {
    // votes[player][spec] = count
    let mut votes: HashMap<String, HashMap<String, u32>> = HashMap::new();

    for ev in events {
        if ev.ts_sec < start || ev.ts_sec > end          { continue; }
        if !SPEC_ACTION_CODES.contains(&ev.code)          { continue; }
        if ev.src.is_empty() || ev.ability_name.is_empty(){ continue; }

        let key = norm(&ev.ability_name);
        if let Some(&spec) = ABILITY_TO_SPEC.get(&key) {
            *votes.entry(ev.src.clone())
                  .or_default()
                  .entry(spec.to_string())
                  .or_insert(0) += 1;
        }
    }

    // Résolution : spec avec le plus de votes gagne
    votes.into_iter().map(|(player, counts)| {
        let spec = counts.into_iter()
            .max_by_key(|(_, c)| *c)
            .map(|(s, _)| s)
            .unwrap_or_else(|| DEFAULT_SPEC.to_string());
        (player, spec)
    }).collect()
}
