// src/player_role.rs
//
// Détection de rôle (DPS / Healer / Tank / Support / Unknown).
// Approche PrancingPika (meilleure que PT) :
//   1. Collecter tous les ability_names utilisés par le joueur dans la fenêtre
//   2. Les mapper vers des "spell keys" normalisés
//   3. Matcher les ensembles de keys contre ROLE_COMBOS (exact puis subset)
//   4. ROLE_PRIORITY pour les égalités

use std::collections::{HashMap, HashSet};
use once_cell::sync::Lazy;

use crate::types::{ActionCode, CombatEvent};

pub const DEFAULT_ROLE: &str = "Unknown";

/// Codes d'action observables pour la détection de rôle
const ROLE_ACTION_CODES: &[ActionCode] = &[
    ActionCode::CastStart,
    ActionCode::NormalDamage, ActionCode::DotDamage, ActionCode::DamageCrit, ActionCode::Block,
    ActionCode::HealNonCrit, ActionCode::HealCrit,
    ActionCode::BuffGain, ActionCode::BuffFade,
    ActionCode::DebuffAfflicted,
    ActionCode::Absorb, ActionCode::AbsorbCrit,
];

fn norm(s: &str) -> String {
    s.trim().to_lowercase()
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapping ability_name → spell_key
// ─────────────────────────────────────────────────────────────────────────────
// Convention : clé courte en MAJUSCULES = identifiant de spell pour les combos
static SPELL_KEYS: Lazy<HashMap<String, &'static str>> = Lazy::new(|| {
    let entries: &[(&str, &str)] = &[
        // ── Support Mage (Archon) ─────────────────────────────────────────
        ("granite salvo",           "ARCH_GRAN"),
        ("burning purpose",         "ARCH_BURN"),
        ("crumbling resistance",    "ARCH_CRUMB"),
        ("rock slide",              "ARCH_ROCK"),

        // ── Support Cleric (Oracle) ───────────────────────────────────────
        ("glacial insignia",        "ORAC_GLAC"),
        ("wasting insignia",        "ORAC_WAST"),
        ("shared excess",           "ORAC_SHAR"),
        ("excès partagé",           "ORAC_SHAR"),

        // ── Support Rogue (Bard) ──────────────────────────────────────────
        ("coda of wrath",           "BARD_CODA"),
        ("power chord",             "BARD_CHORD"),
        ("anthem of competence",    "BARD_ANT_COMP"),
        ("anthem of defiance",      "BARD_ANT_DEF"),
        ("verse of agony",          "BARD_VERSE"),

        // ── Support Primalist (Mystic) ────────────────────────────────────
        ("wild storms",             "MYST_WSTORM"),
        ("air lash",                "MYST_AIRLASH"),
        ("tailwind",                "MYST_TAIL"),

        // ── Healer Mage (Chloromancer) ────────────────────────────────────
        ("ruin",                    "CHLORO_RUIN"),
        ("lifegiving veil",         "CHLORO_VEIL"),
        ("voile vivifiant",         "CHLORO_VEIL"),
        ("aqueous blessing",        "CHLORO_AQUE"),
        ("bienfait aqueux",         "CHLORO_AQUE"),

        // ── Healer Warrior (Liberator) ────────────────────────────────────
        ("positive reaction",       "LIB_POS"),
        ("mass casualty response",  "LIB_MASS"),
        ("death's door",            "LIB_DOOR"),

        // ── Healer Cleric (Defiler) ───────────────────────────────────────
        ("siphon vitality",         "DEFI_SIPH"),
        ("dark water",              "DEFI_DARK"),

        // ── Tank Warrior (Void Knight) ────────────────────────────────────
        ("unstable reaction",       "VK_UNSTAB"),
        ("tempest",                 "VK_TEMP"),
        ("void",                    "VK_VOID"),
        ("néant",                   "VK_VOID"),

        // ── Tank Warrior (Paladin) ────────────────────────────────────────
        ("balance of power",        "PAL_BAL"),
        ("protector's fury",        "PAL_FURY"),
        ("hammer of faith",         "PAL_HAMMER"),

        // ── Tank Mage (Arbiter) ───────────────────────────────────────────
        ("counter shock",           "ARB_CSHOCK"),
        ("icy fury",                "ARB_ICY"),
        ("shattered reflection",    "ARB_SHATT"),

        // ── Tank Rogue (Riftstalker) ──────────────────────────────────────
        ("guarded steel",           "RS_GUARD"),
        ("planar splash",           "RS_SPLASH"),
        ("phantom blow",            "RS_PHANTOM"),

        // ── Tank Primalist (Titan) ────────────────────────────────────────
        ("crystalline smash",       "TITAN_CRYST"),

        // ── Tank Cleric (Justicar) ────────────────────────────────────────
        ("hammer of duty",          "JUST_HAMMER"),

        // ── DPS Rogue ─────────────────────────────────────────────────────
        ("rapid fire shot",         "MM_RFS"),
        ("hellfire blades",         "NB_HELL"),
        ("guardian phase",          "RIF_GPHASE"),
        ("mode gardien",            "RIF_GPHASE"),

        // ── DPS Warrior ───────────────────────────────────────────────────
        ("rising waterfall",        "PAR_RISE"),
        ("storm blade",             "WAR_STORM"),
        ("lame-tempête",            "WAR_STORM"),
        ("deep breaths",            "WAR_DEEP"),
        ("inspirations profondes",  "WAR_DEEP"),

        // ── DPS Cleric ────────────────────────────────────────────────────
        ("bolt of retribution",     "INQ_BOLT"),
        ("fae mimicry",             "DRU_FAE"),
        ("bound fate",              "CAB_BOUND"),
        ("massive blow",            "SHA_MASS"),
        ("cabalist",                "CAB_BOUND"),

        // ── DPS Mage ──────────────────────────────────────────────────────
        ("condemn",                 "NEC_COND"),
        ("atrophy",                 "WL_ATRO"),
        ("burning bright",          "PYR_BURN"),

        // ── DPS Primalist ─────────────────────────────────────────────────
        ("primal savagery",         "PRIM_SAV"),
        ("sauvagerie primitive",    "PRIM_SAV"),
        ("delayed fate",            "PRIM_DFATE"),
        ("destin en sursis",        "PRIM_DFATE"),
    ];
    entries.iter().map(|(n, k)| (norm(n), *k)).collect()
});

// ─────────────────────────────────────────────────────────────────────────────
// ROLE_COMBOS : combos de spell_keys → rôle
// Format : (rôle, [keys nécessaires])
// Priorité : combo plus long = plus spécifique → gagne
// ─────────────────────────────────────────────────────────────────────────────
static ROLE_COMBOS: Lazy<Vec<(&'static str, Vec<&'static str>)>> = Lazy::new(|| vec![
    // ── Support ──────────────────────────────────────────────────────────────
    ("Support", vec!["ARCH_GRAN", "ARCH_BURN"]),       // Archon
    ("Support", vec!["ORAC_GLAC", "ORAC_WAST"]),       // Oracle
    ("Support", vec!["BARD_CODA", "BARD_CHORD"]),      // Bard
    ("Support", vec!["MYST_WSTORM", "MYST_AIRLASH"]), // Mystic
    ("Support", vec!["ARCH_GRAN"]),
    ("Support", vec!["ORAC_GLAC"]),
    ("Support", vec!["BARD_CODA"]),
    ("Support", vec!["MYST_WSTORM"]),

    // ── Healer ───────────────────────────────────────────────────────────────
    ("Healer", vec!["CHLORO_RUIN", "CHLORO_VEIL"]),    // Chloro
    ("Healer", vec!["LIB_POS", "LIB_MASS"]),           // Liberator
    ("Healer", vec!["DEFI_SIPH", "DEFI_DARK"]),        // Defiler
    ("Healer", vec!["CHLORO_RUIN"]),
    ("Healer", vec!["LIB_POS"]),
    ("Healer", vec!["DEFI_SIPH"]),

    // ── Tank ─────────────────────────────────────────────────────────────────
    ("Tank", vec!["VK_UNSTAB", "VK_VOID"]),            // Void Knight
    ("Tank", vec!["PAL_BAL", "PAL_FURY"]),             // Paladin
    ("Tank", vec!["ARB_CSHOCK", "ARB_ICY"]),           // Arbiter
    ("Tank", vec!["RS_GUARD", "RS_SPLASH"]),           // Riftstalker
    ("Tank", vec!["TITAN_CRYST"]),                     // Titan
    ("Tank", vec!["JUST_HAMMER"]),                     // Justicar
    ("Tank", vec!["VK_UNSTAB"]),
    ("Tank", vec!["PAL_BAL"]),
    ("Tank", vec!["ARB_CSHOCK"]),
    ("Tank", vec!["RS_GUARD"]),

    // ── DPS ──────────────────────────────────────────────────────────────────
    ("DPS", vec!["MM_RFS"]),        // Marksman
    ("DPS", vec!["NB_HELL"]),       // Nightblade
    ("DPS", vec!["PAR_RISE"]),      // Paragon
    ("DPS", vec!["INQ_BOLT"]),      // Inquisitor
    ("DPS", vec!["DRU_FAE"]),       // Druid
    ("DPS", vec!["CAB_BOUND"]),     // Cabalist
    ("DPS", vec!["SHA_MASS"]),      // Shaman
    ("DPS", vec!["NEC_COND"]),      // Necromancer
    ("DPS", vec!["WL_ATRO"]),       // Warlock
    ("DPS", vec!["PRIM_SAV"]),      // Primalist DPS
    ("DPS", vec!["WAR_STORM"]),     // Warrior DPS
]);

// Priorité pour les égalités (DPS < Healer < Support < Tank)
const ROLE_PRIORITY: &[&str] = &["DPS", "Healer", "Support", "Tank"];

fn priority(role: &str) -> usize {
    ROLE_PRIORITY.iter().position(|r| *r == role).unwrap_or(99)
}

// ─────────────────────────────────────────────────────────────────────────────
// Collecte des spell_keys vus par chaque joueur dans la fenêtre
// ─────────────────────────────────────────────────────────────────────────────
fn spells_used(
    events   : &[CombatEvent],
    start    : u32,
    end      : u32,
) -> HashMap<String, HashSet<&'static str>> {
    let mut out: HashMap<String, HashSet<&'static str>> = HashMap::new();

    for ev in events {
        if ev.ts_sec < start || ev.ts_sec > end { continue; }
        if !ROLE_ACTION_CODES.contains(&ev.code) { continue; }
        if ev.src.is_empty() || ev.ability_name.is_empty() { continue; }

        let key_str = norm(&ev.ability_name);
        if let Some(spell_key) = SPELL_KEYS.get(&key_str).copied() {
            out.entry(ev.src.clone()).or_default().insert(spell_key);
        }
    }
    out
}

/// Choisit un rôle depuis un ensemble de spell_keys vus
pub fn choose_role(seen: &HashSet<&'static str>) -> &'static str {
    if seen.is_empty() { return DEFAULT_ROLE; }

    // Cherche le combo avec le plus de keys qui match (subset)
    // Parmi les candidats, le plus long et le plus prioritaire gagne
    let mut best: Option<(&'static str, usize)> = None; // (role, combo_len)

    for (role, combo) in ROLE_COMBOS.iter() {
        let combo_set: HashSet<&&str> = combo.iter().collect();
        let seen_ref: HashSet<&&str> = seen.iter().collect();
        if combo_set.is_subset(&seen_ref) {
            let len = combo.len();
            let replace = match best {
                None => true,
                Some((br, bl)) => {
                    len > bl || (len == bl && priority(role) > priority(br))
                }
            };
            if replace { best = Some((role, len)); }
        }
    }

    best.map(|(r, _)| r).unwrap_or(DEFAULT_ROLE)
}

// ─────────────────────────────────────────────────────────────────────────────
// API publique
// ─────────────────────────────────────────────────────────────────────────────
pub fn infer_player_roles(
    events : &[CombatEvent],
    start  : u32,
    end    : u32,
) -> HashMap<String, String> {
    let spells_map = spells_used(events, start, end);
    spells_map.into_iter()
        .map(|(player, keys)| (player, choose_role(&keys).to_string()))
        .collect()
}
