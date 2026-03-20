// src/event_reader.rs
//
// Parsing des lignes de log Rift.
// Philosophie PT :
//   - Une seule couche de normalisation multilingue EN ENTRÉE
//   - Tout le reste du code ne voit plus jamais de texte multilingue
//   - ability_id (field[8]) est la clé canonique d'un sort, ability_name est juste un label

use crate::types::{ActionCode, CharKind, CombatEvent, DamageType, LogFormat};

// ─────────────────────────────────────────────────────────────────────────────
// Normalisation des spéciaux (ProcessSpecial de PT)
// Traduit FR/DE/EN → constantes EN majuscules
// ─────────────────────────────────────────────────────────────────────────────
fn normalize_specials(raw: &str) -> String {
    raw.to_lowercase()
        // Absorption
        .replace("absorbiert",     "ABSORBED")
        .replace("absorbed",       "ABSORBED")
        .replace("absorbé",        "ABSORBED")
        // Blocage
        .replace("geblockt",       "BLOCKED")
        .replace("blocked",        "BLOCKED")
        .replace("bloqué",         "BLOCKED")
        // Sursoins
        .replace("überheilen",     "OVERHEAL")
        .replace("overheal",       "OVERHEAL")
        .replace("excès de soins", "OVERHEAL")
        // Interception
        .replace("abgefangen",     "INTERCEPTED")
        .replace("intercepted",    "INTERCEPTED")
        .replace("intercepté",     "INTERCEPTED")
        // Trop-plein (overkill)
        .replace("zu viel des guten", "OVERKILL")
        .replace("overkill",          "OVERKILL")
        .replace("surpuissance",      "OVERKILL")
        // Ignoré
        .replace("ignoriert",      "IGNORED")
        .replace("ignored",        "IGNORED")
        .replace("ignoré",         "IGNORED")
        // Dévié
        .replace("deflected",      "DEFLECTED")
        .replace("abgelenkt",      "DEFLECTED")
        .replace("dévié",          "DEFLECTED")
}

/// Parse les paires (valeur, type) depuis le texte entre parenthèses du message.
/// Ex: "12000 ABSORBED 500 BLOCKED" → absorbed=12000, blocked=500
fn parse_specials_from_msg(msg: &str) -> SpecialAmounts {
    let mut out = SpecialAmounts::default();

    // Cherche les parenthèses dans le message (après le tuple principal)
    let start = match msg.find('(') {
        Some(i) => i + 1,
        None    => return out,
    };
    let end = match msg.find(')') {
        Some(i) => i,
        None    => return out,
    };
    if end <= start { return out; }

    let inner   = &msg[start..end];
    let normed  = normalize_specials(inner);
    let parts: Vec<&str> = normed.split_whitespace().collect();

    let mut i = 0usize;
    while i + 1 < parts.len() {
        if let Ok(val) = parts[i].parse::<i64>() {
            match parts[i + 1] {
                "ABSORBED"    => out.absorbed    = val,
                "BLOCKED"     => out.blocked     = val,
                "OVERHEAL"    => out.overheal    = val,
                "INTERCEPTED" => out.intercepted = val,
                "OVERKILL"    => out.overkill    = val,
                "IGNORED"     => out.ignored     = val,
                "DEFLECTED"   => out.deflected   = val,
                _             => {}
            }
            i += 2;
        } else {
            i += 1;
        }
    }
    out
}

#[derive(Default, Debug)]
struct SpecialAmounts {
    absorbed    : i64,
    blocked     : i64,
    overheal    : i64,
    intercepted : i64,
    overkill    : i64,
    ignored     : i64,
    deflected   : i64,
}

// ─────────────────────────────────────────────────────────────────────────────
// Détection du type de dégât élémentaire (ProcessAbilityDamageType de PT)
// Normalise FR/DE/EN → DamageType canonique
// ─────────────────────────────────────────────────────────────────────────────
fn detect_damage_type(msg: &str) -> Option<DamageType> {
    let upper = msg.to_uppercase();
    // Chaque condition couvre EN / DE / FR
    if upper.contains("PHYSICAL DAMAGE")
        || upper.contains("PHYSISCH-SCHADEN")
        || upper.contains("DÉGÂTS DE PHYSIQUES")
        || upper.contains("DEGATS DE PHYSIQUES")
    {
        return Some(DamageType::Physical);
    }
    if upper.contains("AIR DAMAGE")
        || upper.contains("LUFT-SCHADEN")
        || upper.contains("DÉGÂTS DE AIR")
        || upper.contains("DEGATS DE AIR")
    {
        return Some(DamageType::Air);
    }
    if upper.contains("WATER DAMAGE")
        || upper.contains("WASSER-SCHADEN")
        || upper.contains("DÉGÂTS DE EAU")
        || upper.contains("DEGATS DE EAU")
    {
        return Some(DamageType::Water);
    }
    if upper.contains("EARTH DAMAGE")
        || upper.contains("ERDE-SCHADEN")
        || upper.contains("DÉGÂTS DE TERRE")
        || upper.contains("DEGATS DE TERRE")
    {
        return Some(DamageType::Earth);
    }
    if upper.contains("FIRE DAMAGE")
        || upper.contains("FEUER-SCHADEN")
        || upper.contains("DÉGÂTS DE FEU")
        || upper.contains("DEGATS DE FEU")
    {
        return Some(DamageType::Fire);
    }
    if upper.contains("LIFE DAMAGE")
        || upper.contains("LEBEN-SCHADEN")
        || upper.contains("DÉGÂTS DE VIE")
        || upper.contains("DEGATS DE VIE")
    {
        return Some(DamageType::Life);
    }
    if upper.contains("DEATH DAMAGE")
        || upper.contains("TOD-SCHADEN")
        || upper.contains("DÉGÂTS DE MORT")
        || upper.contains("DEGATS DE MORT")
    {
        return Some(DamageType::Death);
    }
    if upper.contains("ETHEREAL DAMAGE")
        || upper.contains("ÄTHERISCH-SCHADEN")
        || upper.contains("DÉGÂTS DE ÉTHÉRÉ")
        || upper.contains("DEGATS DE ETHERE")
    {
        return Some(DamageType::Ethereal);
    }
    None
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalisation des noms de personnages
// Supprime le suffixe @serveur (ex: "Cloug@Brutwacht" → "Cloug")
// ─────────────────────────────────────────────────────────────────────────────
pub fn normalize_name(name: &str) -> String {
    let n = name.trim();
    if let Some(at) = n.find('@') {
        n[..at].trim().to_string()
    } else {
        n.to_string()
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Extraction de l'ID depuis un token Rift
// Token = "T=P#R=C#169025725536183234"  →  "169025725536183234"
// ─────────────────────────────────────────────────────────────────────────────
fn extract_id_from_token(token: &str) -> String {
    // L'ID est après le dernier '#'
    token.trim()
        .rsplit('#')
        .next()
        .unwrap_or("")
        .trim()
        .to_string()
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversion timestamp
// ─────────────────────────────────────────────────────────────────────────────
fn hms_to_sec(h: u32, m: u32, s: u32) -> u32 {
    h * 3600 + m * 60 + s
}

fn parse_standard_ts(ts: &str) -> Option<(u32, u32)> {
    // "HH:MM:SS"
    let parts: Vec<&str> = ts.splitn(3, ':').collect();
    if parts.len() != 3 { return None; }
    let h = parts[0].parse::<u32>().ok()?;
    let m = parts[1].parse::<u32>().ok()?;
    let s = parts[2].parse::<u32>().ok()?;
    Some((hms_to_sec(h, m, s), 0))
}

fn parse_expanded_ts(line: &str) -> Option<(String, u32, u32, usize)> {
    // "MM/DD/YYYY HH:MM:SS:ms:"
    // Longueur min attendue : 24 ou 23 caractères
    if line.len() < 22 { return None; }
    let month  = line[0..2].parse::<u32>().ok()?;
    let day    = line[3..5].parse::<u32>().ok()?;
    let _year  = line[6..10].parse::<u32>().ok()?;
    let hour   = line[11..13].parse::<u32>().ok()?;
    let min    = line[14..16].parse::<u32>().ok()?;
    let sec    = line[17..19].parse::<u32>().ok()?;
    // Millisecondes : peut être 2 ou 3 chiffres
    let ms_raw = &line[20..23];
    let (ms, date_len) = if ms_raw.contains(':') {
        (line[20..22].parse::<u32>().ok()?, 23usize)
    } else {
        (ms_raw.parse::<u32>().ok()?, 24usize)
    };
    let ts_str = format!("{:02}:{:02}:{:02}", hour, min, sec);
    let _ = month; // utilisé pour validation implicite
    let _ = day;
    Some((ts_str, hms_to_sec(hour, min, sec), ms, date_len))
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation de ligne (CanParseLine de PT)
// ─────────────────────────────────────────────────────────────────────────────
pub fn can_parse_line(line: &str) -> bool {
    if line.len() <= 22 { return false; }
    if !line.contains('(') || !line.contains(')') { return false; }

    // Parenthèses équilibrées
    let open  = line.chars().filter(|&c| c == '(').count();
    let close = line.chars().filter(|&c| c == ')').count();
    if open != close { return false; }

    // Exactement 8 '#' (structure des IDs de personnages)
    if line.chars().filter(|&c| c == '#').count() != 8 { return false; }

    true
}

// ─────────────────────────────────────────────────────────────────────────────
// Détection du format à partir de la première ligne parseable
// ─────────────────────────────────────────────────────────────────────────────
pub fn detect_format(line: &str) -> LogFormat {
    if line.len() > 8 {
        // Standard  : "HH:MM:SS"  → ':' en pos 2 et 5
        if line.as_bytes().get(2) == Some(&b':') && line.as_bytes().get(5) == Some(&b':') {
            return LogFormat::Standard;
        }
        // Expanded  : "MM/DD/YYYY" → '/' en pos 2 et 5
        if line.as_bytes().get(2) == Some(&b'/') && line.as_bytes().get(5) == Some(&b'/') {
            return LogFormat::Expanded;
        }
    }
    LogFormat::Unknown
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsing d'une ligne (ProcessLine de PT)
// ─────────────────────────────────────────────────────────────────────────────
pub fn process_line(line: &str, format: LogFormat) -> Option<CombatEvent> {
    // 1. Extraire le timestamp et le reste de la ligne
    let (ts_str, ts_sec, ts_ms, rest) = match format {
        LogFormat::Standard => {
            if line.len() < 10 { return None; }
            let ts = &line[0..8];
            let (sec, ms) = parse_standard_ts(ts)?;
            let rest = line[9..].trim().to_string();
            (ts.to_string(), sec, ms, rest)
        }
        LogFormat::Expanded => {
            let (ts_str, sec, ms, date_len) = parse_expanded_ts(line)?;
            let rest = line[date_len..].trim_start_matches(':').trim().to_string();
            (ts_str, sec, ms, rest)
        }
        LogFormat::Unknown => return None,
    };

    // 2. Cas spécial "Combat Begin" / "Combat End"
    if rest == "Combat Begin" {
        return Some(CombatEvent {
            ts_str,
            ts_sec,
            ts_ms,
            code: ActionCode::Unknown,
            code_raw: 0,
            src_kind: CharKind::Unknown,
            src_id: String::new(),
            src: String::new(),
            dst_kind: CharKind::Unknown,
            dst_id: String::new(),
            dst: String::new(),
            amount: 0,
            ability_id: 0,
            ability_name: "Combat Begin".to_string(),
            absorbed: 0, blocked: 0, overkill: 0, overheal: 0,
            intercepted: 0, ignored: 0, deflected: 0,
            damage_type: None,
            raw: "Combat Begin".to_string(),
        });
    }
    if rest == "Combat End" {
        return Some(CombatEvent {
            ts_str,
            ts_sec,
            ts_ms,
            code: ActionCode::Unknown,
            code_raw: 0,
            src_kind: CharKind::Unknown,
            src_id: String::new(),
            src: String::new(),
            dst_kind: CharKind::Unknown,
            dst_id: String::new(),
            dst: String::new(),
            amount: 0,
            ability_id: 0,
            ability_name: "Combat End".to_string(),
            absorbed: 0, blocked: 0, overkill: 0, overheal: 0,
            intercepted: 0, ignored: 0, deflected: 0,
            damage_type: None,
            raw: "Combat End".to_string(),
        });
    }

    // 3. Extraire le tuple entre parenthèses
    let open_pos  = rest.find('(')?;
    let close_pos = rest.find(')')?;
    if close_pos <= open_pos { return None; }

    let tuple_str = &rest[open_pos + 1..close_pos];
    let msg       = rest[close_pos + 1..].trim().to_string();

    // 4. Parser les champs du tuple (séparés par virgule)
    let fields: Vec<&str> = tuple_str.split(',').map(str::trim).collect();
    if fields.len() < 10 { return None; }

    // field[0] : code action
    let code_raw = fields[0].parse::<u32>().ok()?;
    let code = ActionCode::from_u32(code_raw);

    // field[1] = src token, field[2] = dst token
    let src_kind = CharKind::from_token(fields[1]);
    let dst_kind = CharKind::from_token(fields[2]);
    let src_id   = extract_id_from_token(fields[1]);
    let dst_id   = extract_id_from_token(fields[2]);

    // field[5] = nom source, field[6] = nom cible
    let src = normalize_name(fields[5]);
    let dst = normalize_name(fields[6]);

    // field[7] = montant principal
    let amount = fields[7].parse::<i64>().unwrap_or(0);

    // field[8] = ability_id (clé canonique, langue-neutre)
    let ability_id = fields[8].parse::<i64>().unwrap_or(0);

    // field[9] = ability_name (label d'affichage seulement)
    let ability_name = fields[9].trim().to_string();

    // 5. Parser les spéciaux depuis le message (normalisés FR/DE/EN → EN)
    let specials = parse_specials_from_msg(&msg);

    // 6. Détecter le type de dégât élémentaire (pour les codes dégâts uniquement)
    let damage_type = if matches!(
        code,
        ActionCode::NormalDamage | ActionCode::DotDamage | ActionCode::DamageCrit | ActionCode::Block
    ) {
        detect_damage_type(&msg)
    } else {
        None
    };

    // 7. Construire l'événement
    let ev = CombatEvent {
        ts_str,
        ts_sec,
        ts_ms,
        code,
        code_raw,
        src_kind,
        src_id,
        src,
        dst_kind,
        dst_id,
        dst,
        amount,
        ability_id,
        ability_name,
        absorbed    : specials.absorbed,
        blocked     : specials.blocked,
        overkill    : specials.overkill,
        overheal    : specials.overheal,
        intercepted : specials.intercepted,
        ignored     : specials.ignored,
        deflected   : specials.deflected,
        damage_type,
        raw         : msg,
    };

    // 8. Ignorer les lignes où overkill == total_damage (PT : IgnoreThisEvent)
    if ev.is_death() && ev.overkill == ev.total_damage() {
        // On garde l'event mais on peut le marquer — ici on retourne None
        // pour être cohérent avec PT qui ignore ces lignes
        if ev.overkill > 0 && ev.amount == 0 {
            return None;
        }
    }

    Some(ev)
}

// ─────────────────────────────────────────────────────────────────────────────
// Lecture complète d'un fichier de log
// ─────────────────────────────────────────────────────────────────────────────
pub fn read_events(content: &str) -> Vec<CombatEvent> {
    let mut events = Vec::new();
    let mut format = LogFormat::Unknown;

    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() { continue; }

        // Détection du format sur la première ligne exploitable
        if format == LogFormat::Unknown {
            format = detect_format(line);
            if format == LogFormat::Unknown { continue; }
        }

        // Détection des marqueurs Combat Begin / Combat End
        // ends_with = robuste quelle que soit la précision ms (2 ou 3 chiffres)
        // Corrige le bug de position hardcodée (marqueur à pos 24, pas 25)
        let is_marker = line.ends_with("Combat Begin")
            || line.ends_with("Combat End");

        if !is_marker && !can_parse_line(line) {
            continue;
        }

        if let Some(ev) = process_line(line, format) {
            events.push(ev);
        }
    }

    events
}
