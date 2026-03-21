// src/lib/rift-role-map.ts
import { inferRole, type Role } from "@/lib/role";

export function normalizeRoleLabel(v: string | null | undefined): string {
  const s = (v ?? "").trim();
  return s.length ? s.slice(0, 32) : "unknown";
}

export function mapRiftRoleToCategory(
  dbRole: string | null | undefined
): Role | null {
  if (!dbRole) return null;
  const key = dbRole.trim().toLowerCase();

  // Generic roles output by Rust parser
  if (key === "dps")                    return "dps";
  if (key === "heal" || key === "healer") return "heal";
  if (key === "tank")                   return "tank";
  if (key === "support")                return "support";

  // Spec → role mapping (all specs from player_role.rs)
  const MAP: Record<string, Role> = {
    // DPS — Rogue
    "slothfire":    "dps",
    "bofors":       "dps",
    "bbq":          "dps",
    "spitfire":     "dps",
    "marksman":     "dps",
    "nightblade":   "dps",
    // DPS — Warrior
    "riftblade-rv": "dps",
    "riftblade-tp": "dps",
    "tempest":      "dps",
    "reaver":       "dps",
    "warlord":      "dps",
    "onebutton":    "dps",
    // DPS — Prima
    "hotpot":       "dps",
    "ez-range":     "dps",
    "vulcalord":    "dps",
    "pseudodps":    "dps",
    "pseudorange":  "dps",
    // DPS — Mage
    "machingun":    "dps",
    "pyromancer":   "dps",
    "harbinger":    "dps",
    "warlock":      "dps",
    // DPS — Cleric
    "frooty":       "dps",
    "shamann":      "dps",
    "inquisitor":   "dps",
    // Tank
    "liberator tank":  "tank",
    "tankdps":         "tank",
    "tank":            "tank",
    "pseudotankheal":  "tank",
    "pseudotank":      "tank",
    "tankheal":        "tank",
    "healtank":        "tank",
    "defitank":        "tank",
    "bofotank":        "tank",
    // Support
    "tactbard":        "support",
    "metachont":       "support",
    "chlorochont":     "support",
    "linkchanter":     "support",
    // Heal
    "liberator":    "heal",
    "primahealer":  "heal",
    "elemchloro":   "heal",
    "wardocle":     "heal",
    "defiheal":     "heal",
  };

  return MAP[key] ?? null;
}

export function roleCategoryFromDbOrInfer(
  dbRole: string | null | undefined,
  dps: number,
  hps: number
): Role {
  return mapRiftRoleToCategory(dbRole) ?? inferRole(dps, hps);
}
