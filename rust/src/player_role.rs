// src/player_role.rs
//
// Détection de RÔLE (DPS / Healer / Tank / Support) et de SPEC (BBQ, SpitFire, …).
// Basé sur les spell definitions du parser Python (cleric/mage/prima/rogue/war.py + role.py).
// Philosophie : ability_name → spell_key → combo → (spec, role)

use std::collections::{HashMap, HashSet};
use once_cell::sync::Lazy;
use crate::types::{ActionCode, CombatEvent};

pub const DEFAULT_ROLE: &str = "Unknown";
pub const DEFAULT_SPEC: Option<&str> = None;

#[derive(Debug, Clone)]
pub struct RoleSpec {
    pub role: String,
    pub spec: Option<String>,
}

impl Default for RoleSpec {
    fn default() -> Self {
        Self { role: DEFAULT_ROLE.to_string(), spec: None }
    }
}

const ROLE_ACTION_CODES: &[ActionCode] = &[
    ActionCode::CastStart,
    ActionCode::NormalDamage, ActionCode::DotDamage,
    ActionCode::DamageCrit,  ActionCode::Block,
    ActionCode::HealNonCrit, ActionCode::HealCrit,
    ActionCode::BuffGain,    ActionCode::BuffFade,
    ActionCode::DebuffAfflicted,
    ActionCode::Absorb,      ActionCode::AbsorbCrit,
];

fn norm(s: &str) -> String { s.trim().to_lowercase() }

// ─────────────────────────────────────────────────────────────────────────────
// SPELL_KEYS : ability_name (FR + EN) → clé interne
// Source : rogue.py / war.py / prima.py / mage.py / cleric.py
// ─────────────────────────────────────────────────────────────────────────────
static SPELL_KEYS: Lazy<HashMap<String, &'static str>> = Lazy::new(|| {
    let entries: &[(&str, &str)] = &[

        // ── ROGUE (rogue.py) ──────────────────────────────────────────────────
        ("tir instantané",        "RFS"),   // Rapid Fire Shot
        ("rapid fire shot",       "RFS"),
        ("tir calculé",           "CS"),    // Calculated Shot
        ("calculated shot",       "CS"),
        ("frappe crépusculaire",  "DS"),    // Dusk Strike
        ("dusk strike",           "DS"),
        ("poison virulent",       "VIR"),   // Virulent Poison
        ("virulent poison",       "VIR"),
        ("trait empyréen",        "EB"),    // Empyrean Bolt
        ("empyrean bolt",         "EB"),
        ("force crépusculaire",   "TF"),    // Twilight Force
        ("twilight force",        "TF"),
        ("attaque de factionnaire","AF"),   // Sentry Battery
        ("sentry battery",        "AF"),
        ("cadence",               "CAD"),
        ("frappe brûlante",       "BS"),    // Blazing Strike
        ("blazing strike",        "BS"),
        ("accord de puissance",   "AP"),    // Power Chord
        ("power chord",           "AP"),
        ("instigation",           "R_TAUNT"),
        ("instigate",             "R_TAUNT"),

        // ── WARRIOR (war.py) ──────────────────────────────────────────────────
        ("explosion de faille",   "RB"),    // Rift Burst
        ("rift burst",            "RB"),
        ("explosion polaire",     "IB"),    // Icy Burst
        ("icy burst",             "IB"),
        ("maladie de l'âme",      "SD"),    // Soul Sickness
        ("soul sickness",         "SD"),
        ("gardez la tête haute !", "ST"),   // Stand Tall!
        ("stand tall!",           "ST"),
        ("secousse",              "JT"),    // Jolt
        ("jolt",                  "JT"),
        ("réaction positive",     "PR"),    // Positive Reaction
        ("positive reaction",     "PR"),
        ("frères d'armes",        "LINK"),  // Brothers in Arms
        ("brothers in arms",      "LINK"),
        ("chant de guerre",       "BSO"),   // Battlesong
        ("battlesong",            "BSO"),
        ("voie du vent",          "WW"),    // Way of the Wind
        ("way of the wind",       "WW"),
        ("impulsion chargée",     "CP"),    // Charged Pulse
        ("charged pulse",         "CP"),
        ("charged pulsex",        "CP"),    // typo dans war.py
        ("une mort rapide",       "AQD"),   // A Quick Death
        ("a quick death",         "AQD"),
        ("courant viral",         "WAR_VS"),// Viral Stream
        ("viral stream",          "WAR_VS"),
        ("interférence",          "W_TAUNT"),// Interfere
        ("interfere",             "W_TAUNT"),
        ("étincelle",             "W_TAUNT"),
        ("spark",                 "W_TAUNT"),

        // ── PRIMALIST (prima.py) ──────────────────────────────────────────────
        ("vents arrière",         "TW"),    // Tailwind
        ("tailwind",              "TW"),
        ("frappe faucheuse",      "SS"),    // Scything Strike
        ("scything strike",       "SS"),
        ("explosion de furie",    "FB"),    // Fury Blast
        ("fury blast",            "FB"),
        ("brûleur",               "SCA"),   // Scald
        ("scald",                 "SCA"),
        ("fragments des bas-fonds","US"),   // Underworld Shards
        ("underworld shards",     "US"),
        ("voile animique",        "SSH"),   // Soul Shroud
        ("soul shroud",           "SSH"),
        ("avatar primitif : drake","APD"),  // Primal Avatar: Drake
        ("primal avatar: drake",  "APD"),
        ("Infusion",  "APD"),
        ("coupe-air",             "CA"),    // Air Cutter
        ("air cutter",            "CA"),
        ("tape d'essence",        "P_TAUNT"),// Essence Tap
        ("essence tap",           "P_TAUNT"),

        // ── MAGE (mage.py) ────────────────────────────────────────────────────
        ("salve de granite",      "GS"),    // Granite Salvo
        ("granite salvo",         "GS"),
        ("Barrage de Terre",      "GS"),
        ("forces élémentaires légendaires", "EF"), // Legendary Elemental Forces
        ("legendary elemental forces",      "EF"),
        ("tempête vivante",       "LS"),    // Living Storm
        ("living storm",          "LS"),
        ("taillade vorpale",      "MAG_VS"),// Vorpal Slash (Harbinger)
        ("vorpal slash",          "MAG_VS"),
        ("souillure",             "SL"),    // Defile (Warlock)
        ("defile",                "SL"),
        ("explosion de cendres",  "CB"),    // Cinder Burst
        ("cinder burst",          "CB"),
        ("tempête de feu légendaire",        "FST"),   // Fire Storm
        ("Legendary fire storm",            "FST"),
        ("spores infâmes",        "SI"),    // Vile Spores
        ("vile spores",           "SI"),
        ("vent mordant",          "M_TAUNT"),// Biting Wind (Arbiter tank taunt)
        ("biting wind",           "M_TAUNT"),

        // ── CLERIC (cleric.py) ────────────────────────────────────────────────
        ("réprimande de nysyr",   "NR"),    // Nysyr's Rebuke
        ("nysyr's rebuke",        "NR"),
        ("coup glacé",            "ICB"),   // Icy Blow
        ("icy blow",              "ICB"),
        ("frappe fervente",       "FES"),   // Fervent Strike
        ("fervent strike",        "FES"),
        ("marteau de la foi",     "HOF"),   // Hammer of Faith
        ("hammer of faith",       "HOF"),
        ("insigne de dilapidation","IDD"),  // Wasting Insignia
        ("wasting insignia",      "IDD"),
        ("innondation de soins",  "IDS"),   // Healing Flood
        ("healing flood",         "IDS"),
        ("rage explosive",        "RE"),    // Explosive Rage
        ("explosive rage",        "RE"),
        ("affliction miséreuse",  "AM"),    // Miserly Affliction
        ("miserly affliction",    "AM"),
        ("provocation",           "C_TAUNT"),// Provoke
        ("provoke",               "C_TAUNT"),
    ];
    entries.iter().map(|(n, k)| (norm(n), *k)).collect()
});

// ─────────────────────────────────────────────────────────────────────────────
// SPECS : (spec_name, role_category, [required_keys])
// Source : role.py
// ─────────────────────────────────────────────────────────────────────────────
pub struct SpecDef {
    name  : &'static str,
    role  : &'static str,
    keys  : &'static [&'static str],
}

const fn spec(name: &'static str, role: &'static str, keys: &'static [&'static str]) -> SpecDef {
    SpecDef { name, role, keys }
}

// Ordre = priorité de détection (plus spécifique d'abord)
static SPECS: &[SpecDef] = &[

    // ── ROGUE ────────────────────────────────────────────────────────────────
    spec("SlothFire",  "DPS",     &["RFS", "CS", "DS", "TF"]),
    spec("Bofors",     "DPS",     &["RFS", "CS", "DS", "VIR"]),
    spec("BBQ",        "DPS",     &["RFS", "CS", "DS", "EB"]),
    spec("BofoTank",   "Tank",    &["RFS", "CS", "DS", "R_TAUNT"]),
    spec("Marksman",   "DPS",     &["RFS", "CS", "AF"]),
    spec("SpitFire",   "DPS",     &["RFS", "CS", "DS"]),
    spec("NightBlade", "DPS",     &["BS",  "DS"]),
    spec("TactBard",   "Support", &["CAD", "AP"]),

    // ── WARRIOR ───────────────────────────────────────────────────────────────
    spec("RiftBlade-RV",    "DPS",     &["RB", "IB", "SD"]),
    spec("RiftBlade-TP",    "DPS",     &["RB", "IB", "JT"]),
    spec("Liberator Tank",  "Tank",    &["ST", "PR", "W_TAUNT"]),
    spec("Tempest",         "DPS",     &["CP", "JT"]),
    spec("LinkChanter",     "Support", &["ST", "BSO"]),
    spec("Liberator",       "Healer",  &["ST", "PR"]),
    spec("Reaver",          "DPS",     &["WAR_VS", "SD"]),
    spec("Warlord",         "DPS",     &["AQD"]),
    spec("OneButton",       "DPS",     &["WW", "IB"]),

    // ── PRIMALIST ─────────────────────────────────────────────────────────────
    spec("HotPot",         "DPS",     &["SS", "FB", "SCA"]),
    spec("EZ-Range",       "DPS",     &["SS", "FB", "APD"]),
    spec("VulcaLord",      "DPS",     &["SS", "FB", "US"]),
    spec("TankDPS",        "Tank",    &["SS", "FB", "P_TAUNT"]),
    spec("PseudoDPS",      "DPS",     &["SS", "FB", "TW"]),
    spec("PseudoTankHeal", "Tank",    &["TW", "P_TAUNT", "SSH"]),
    spec("PseudoTank",     "Tank",    &["TW", "P_TAUNT"]),
    spec("PrimaHeal",      "Healer",  &["SSH"]),
    spec("PseudoRange",    "DPS",     &["CA"]),

    // ── MAGE ──────────────────────────────────────────────────────────────────
    spec("TankHeal",        "Tank",    &["M_TAUNT", "LS"]),
    spec("HealTank",        "Tank",    &["M_TAUNT", "EF"]),
    spec("ElemChloroChont", "Support", &["SI", "EF"]),
    spec("MetaChont",       "Support", &["GS", "EF"]),
    spec("ChloroChont",     "Support", &["GS", "LS"]),
    spec("ElemChloro",      "Healer",  &["EF", "LS"]),
    spec("Chloro",          "Healer",  &["SI", "LS"]),
    spec("MachinGun",       "DPS",     &["EF", "FST"]),
    spec("Pyromancer",      "DPS",     &["FST", "CB"]),
    spec("Harbinger",       "DPS",     &["MAG_VS"]),
    spec("Warlock",         "DPS",     &["SL"]),

    // ── CLERIC ────────────────────────────────────────────────────────────────
    spec("DefiTank",    "Tank",    &["AM", "IDD", "C_TAUNT"]),
    spec("Frooty",      "DPS",     &["AM", "RE",  "FES"]),
    spec("DefiHeal",    "Healer",  &["AM", "IDD"]),
    spec("Wardocle",    "Healer",  &["IDD", "IDS"]),
    spec("Shamann",     "DPS",     &["ICB", "FES"]),
    spec("Inquisitor",  "DPS",     &["NR",  "FES"]),

    // ── COMMUN (taunts purs) ─────────────────────────────────────────────────
    spec("Tank",        "Tank",    &["R_TAUNT"]),
    spec("Tank",        "Tank",    &["W_TAUNT"]),
    spec("Tank",        "Tank",    &["P_TAUNT"]),
    spec("Tank",        "Tank",    &["M_TAUNT"]),
    spec("Tank",        "Tank",    &["C_TAUNT"]),
];

// ─────────────────────────────────────────────────────────────────────────────
// Collecte des spell_keys vus par joueur dans la fenêtre
// ─────────────────────────────────────────────────────────────────────────────
fn spells_used(
    events: &[CombatEvent],
    start : u32,
    end   : u32,
) -> HashMap<String, HashSet<&'static str>> {
    let mut out: HashMap<String, HashSet<&'static str>> = HashMap::new();
    for ev in events {
        if ev.ts_sec < start || ev.ts_sec > end { continue; }
        if !ROLE_ACTION_CODES.contains(&ev.code)  { continue; }
        if ev.src.is_empty() || ev.ability_name.is_empty() { continue; }
        if let Some(k) = SPELL_KEYS.get(&norm(&ev.ability_name)).copied() {
            out.entry(ev.src.clone()).or_default().insert(k);
        }
    }
    out
}

// ─────────────────────────────────────────────────────────────────────────────
// Choisir la spec la plus précise (combo le plus long qui match)
// ─────────────────────────────────────────────────────────────────────────────
pub fn choose_spec(seen: &HashSet<&'static str>) -> Option<&'static SpecDef> {
    if seen.is_empty() { return None; }

    let mut best: Option<(&SpecDef, usize)> = None;

    for spec_def in SPECS.iter() {
        let matches = spec_def.keys.iter().all(|k| seen.contains(k));
        if !matches { continue; }
        let len = spec_def.keys.len();
        let replace = match best {
            None          => true,
            Some((_, bl)) => len > bl,
        };
        if replace { best = Some((spec_def, len)); }
    }

    best.map(|(s, _)| s)
}

// ─────────────────────────────────────────────────────────────────────────────
// API publique
// ─────────────────────────────────────────────────────────────────────────────
pub fn infer_player_roles(
    events: &[CombatEvent],
    start : u32,
    end   : u32,
) -> HashMap<String, RoleSpec> {
    spells_used(events, start, end)
        .into_iter()
        .map(|(player, keys)| {
            let rs = match choose_spec(&keys) {
                Some(sd) => RoleSpec {
                    role: sd.role.to_string(),
                    spec: Some(sd.name.to_string()),
                },
                None => RoleSpec::default(),
            };
            (player, rs)
        })
        .collect()
}
