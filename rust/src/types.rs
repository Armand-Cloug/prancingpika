// src/types.rs
//
// Tous les types partagés du parser.
// Philosophie PT : les champs numériques d'abord, le texte uniquement pour l'affichage.

// ─────────────────────────────────────────────
// Action codes (identiques à ActionType de PT)
// ─────────────────────────────────────────────
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u32)]
pub enum ActionCode {
    Unknown          = 0,
    CastStart        = 1,
    Interrupted      = 2,
    NormalDamage     = 3,   // dégâts normaux non-crit
    DotDamage        = 4,   // dégâts DoT non-crit
    HealNonCrit      = 5,
    BuffGain         = 6,
    BuffFade         = 7,
    DebuffAfflicted  = 8,
    DebuffDissipated = 9,
    Miss             = 10,
    TargetSlain      = 11,  // "a tué" / "has slain"
    Died             = 12,  // "est mort" / "has died"
    SelfDamage       = 14,
    Dodge            = 15,
    Parry            = 16,
    Resist           = 19,
    DamageCrit       = 23,
    Immune           = 26,
    ResourceGain     = 27,
    HealCrit         = 28,
    Block            = 29,
    Absorb           = 32,
    AbsorbCrit       = 33,
}

impl ActionCode {
    pub fn from_u32(v: u32) -> Self {
        match v {
            1  => Self::CastStart,
            2  => Self::Interrupted,
            3  => Self::NormalDamage,
            4  => Self::DotDamage,
            5  => Self::HealNonCrit,
            6  => Self::BuffGain,
            7  => Self::BuffFade,
            8  => Self::DebuffAfflicted,
            9  => Self::DebuffDissipated,
            10 => Self::Miss,
            11 => Self::TargetSlain,
            12 => Self::Died,
            14 => Self::SelfDamage,
            15 => Self::Dodge,
            16 => Self::Parry,
            19 => Self::Resist,
            23 => Self::DamageCrit,
            26 => Self::Immune,
            27 => Self::ResourceGain,
            28 => Self::HealCrit,
            29 => Self::Block,
            32 => Self::Absorb,
            33 => Self::AbsorbCrit,
            _  => Self::Unknown,
        }
    }

    /// Codes qui représentent des dégâts infligés (équivalent IsDamageType de PT)
    pub fn is_damage(self) -> bool {
        matches!(
            self,
            Self::NormalDamage
                | Self::DotDamage
                | Self::DamageCrit
                | Self::Block
                | Self::Miss
                | Self::Resist
                | Self::SelfDamage
                | Self::Dodge
        )
    }

    pub fn is_heal(self) -> bool {
        matches!(self, Self::HealNonCrit | Self::HealCrit)
    }

    pub fn is_absorb(self) -> bool {
        matches!(self, Self::Absorb | Self::AbsorbCrit)
    }

    pub fn is_crit(self) -> bool {
        matches!(self, Self::DamageCrit | Self::HealCrit | Self::AbsorbCrit)
    }
}

// ─────────────────────────────────────────────
// Type d'entité (CharacterType de PT)
// ─────────────────────────────────────────────
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum CharKind {
    Player,
    Npc,
    Pet,
    #[default]
    Unknown,
}

impl CharKind {
    /// Déduit depuis le préfixe T=P / T=N / T=X du token Rift
    pub fn from_token(token: &str) -> Self {
        let t = token.trim();
        if t.starts_with("T=P") {
            Self::Player
        } else if t.starts_with("T=N") {
            Self::Npc
        } else if t.starts_with("T=M") {
            Self::Pet
        } else {
            Self::Unknown
        }
    }
}

// ─────────────────────────────────────────────
// Type de dégât élémentaire (ProcessAbilityDamageType de PT)
// Toujours stocké en anglais, quelle que soit la langue du log
// ─────────────────────────────────────────────
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DamageType {
    Physical,
    Air,
    Water,
    Earth,
    Fire,
    Life,
    Death,
    Ethereal,
}

impl DamageType {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Physical => "Physical",
            Self::Air      => "Air",
            Self::Water    => "Water",
            Self::Earth    => "Earth",
            Self::Fire     => "Fire",
            Self::Life     => "Life",
            Self::Death    => "Death",
            Self::Ethereal => "Ethereal",
        }
    }
}

// ─────────────────────────────────────────────
// Format du fichier log
// ─────────────────────────────────────────────
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogFormat {
    Unknown,
    Standard,  // HH:MM:SS:
    Expanded,  // MM/DD/YYYY HH:MM:SS:ms:
}

// ─────────────────────────────────────────────
// Événement de combat parsé
// Équivalent de CombatEntry (PT) + Event (PrancingPika)
// ─────────────────────────────────────────────
#[derive(Debug, Clone)]
pub struct CombatEvent {
    // ── Timestamp ──────────────────────────────
    pub ts_str    : String,      // "20:14:33" (affichage)
    pub ts_sec    : u32,         // secondes depuis 00:00:00 (calculs)
    pub ts_ms     : u32,         // millisecondes (0 si format Standard)

    // ── Action ─────────────────────────────────
    pub code      : ActionCode,
    pub code_raw  : u32,         // valeur brute pour diagnostics

    // ── Source ─────────────────────────────────
    pub src_kind  : CharKind,
    pub src_id    : String,      // ID numérique Rift (ex: "169025725536183234")
    pub src       : String,      // nom normalisé (sans @serveur)

    // ── Cible ──────────────────────────────────
    pub dst_kind  : CharKind,
    pub dst_id    : String,
    pub dst       : String,

    // ── Montants (valeur principale) ───────────
    pub amount    : i64,

    // ── Sort ───────────────────────────────────
    pub ability_id   : i64,      // field[8] — clé canonique, langue-neutre
    pub ability_name : String,   // field[9] — label d'affichage seulement

    // ── Spéciaux (normalisés EN depuis FR/DE/EN) ─
    // TotalDamage = amount + absorbed + blocked + ignored  (PT formula, intercepted excluded)
    pub absorbed    : i64,
    pub blocked     : i64,
    pub overkill    : i64,
    pub overheal    : i64,
    pub intercepted : i64,
    pub ignored     : i64,
    pub deflected   : i64,

    // ── Type de dégât élémentaire ──────────────
    pub damage_type : Option<DamageType>,

    // ── Texte brut après ) ──────────────────────
    pub raw : String,
}

impl CombatEvent {
    /// TotalDamage selon la formule PT :
    /// amount + absorbed + blocked + ignored  (intercepted intentionnellement exclu)
    pub fn total_damage(&self) -> i64 {
        self.amount + self.absorbed + self.blocked + self.ignored
    }

    pub fn is_damage(&self) -> bool {
        // Inclut Dodge NPC→Player comme PT
        if self.src_kind == CharKind::Npc
            && (self.dst_kind == CharKind::Player || self.dst_kind == CharKind::Pet)
            && self.code == ActionCode::Dodge
        {
            return true;
        }
        self.code.is_damage()
    }

    pub fn is_heal(&self) -> bool {
        self.code.is_heal()
    }

    pub fn is_absorb(&self) -> bool {
        self.code.is_absorb()
    }

    /// Mort d'un joueur (overkill positif, attaque d'un NPC) — langue-neutre (PT)
    pub fn is_player_death_by_npc(&self) -> bool {
        self.src_kind == CharKind::Npc
            && self.dst_kind == CharKind::Player
            && self.overkill > 0
    }

    pub fn is_death(&self) -> bool {
        self.overkill > 0
    }

    /// Marqueurs Combat Begin / Combat End
    pub fn is_combat_begin(&self) -> bool {
        self.code_raw == 0 && self.ability_name == "Combat Begin"
    }

    pub fn is_combat_end(&self) -> bool {
        self.code_raw == 0 && self.ability_name == "Combat End"
    }
}

// ─────────────────────────────────────────────
// Phase de combat (Titan X, Isiel, Council…)
// ─────────────────────────────────────────────
#[derive(Debug, Clone)]
pub struct Phase {
    pub name      : String,
    pub start_sec : u32,
    pub end_sec   : u32,
    pub boss_name : Option<String>, // filtre dégâts sur ce boss dans cette phase
}

// ─────────────────────────────────────────────
// Fight = un kill de boss détecté
// ─────────────────────────────────────────────
#[derive(Debug, Clone)]
pub struct Fight {
    pub encounter  : String,     // nom canonique anglais du boss
    pub kill_index : u32,
    pub start_sec  : u32,
    pub end_sec    : u32,
    pub start_ts   : String,
    pub end_ts     : String,
    pub events     : Vec<CombatEvent>,
    pub phases     : Vec<Phase>,
}

impl Fight {
    pub fn duration_sec(&self) -> u32 {
        if self.end_sec >= self.start_sec {
            self.end_sec - self.start_sec
        } else {
            // rollover minuit
            (86400 - self.start_sec) + self.end_sec
        }
    }
}
