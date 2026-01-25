// src/lib/rift-role-map.ts
import { inferRole, type Role } from "@/lib/role";

export function normalizeRoleLabel(v: string | null | undefined) {
  const s = (v ?? "").trim();
  return s.length ? s.slice(0, 32) : "unknown";
}

/**
 * Map Rift-specific roles (DB) -> generic category used by UI colors.
 * Keys MUST be normalized (lowercase).
 */
export function mapRiftRoleToCategory(dbRole: string | null | undefined): Role | null {
  if (!dbRole) return null;

  const key = dbRole.trim().toLowerCase();

  // If your parser already outputs generic roles, support them:
  if (key === "dps") return "dps";
  if (key === "heal" || key === "healer") return "heal";
  if (key === "tank") return "tank";
  if (key === "support") return "support";

  const MAP: Record<string, Role> = {
    // DPS
    "slothfire": "dps",
    "bofors": "dps",
    "bbq": "dps",
    "bofotank": "dps",
    "spitfire": "dps",
    "marksman": "dps",
    "nightblade": "dps",
    "riftblade-rv": "dps",
    "riftblade-tp": "dps",
    "tempest": "dps",
    "reaver": "dps",
    "warlord": "dps",
    "onebutton": "dps",
    "hotpot": "dps",
    "ez-range": "dps",
    "vulcalord": "dps",
    "machingun": "dps",
    "pyromancer": "dps",
    "harbinger": "dps",
    "warlock": "dps",
    "shamann": "dps",
    "inquisitor": "dps",

    // TANK
    "liberator tank": "tank",
    "tankdps": "tank",
    "tank": "tank",
    "pseudotankheal": "tank",
    "pseudotank": "tank",
    "tankheal": "tank",
    "healtank": "tank",
    "defitank": "tank",

    // SUPPORT
    "tactbard": "support",
    "pseudodps": "support",
    "pseudorange": "support",
    "metachont": "support",
    "chlorochont": "support",
    "defiheal": "support",
    "frooty": "support",

    // HEAL
    "liberator": "heal",
    "linkchanter": "heal",
    "primahealer": "heal",
    "elemchloro": "heal",
    "wardocle": "heal",
  };

  return MAP[key] ?? null;
}

/**
 * Final choice for UI color category:
 * - if DB role is mapped => use it
 * - else fallback to inferRole(dps,hps) (prevents "all red" when roles are unknown)
 */
export function roleCategoryFromDbOrInfer(dbRole: string | null | undefined, dps: number, hps: number): Role {
  return mapRiftRoleToCategory(dbRole) ?? inferRole(dps, hps);
}