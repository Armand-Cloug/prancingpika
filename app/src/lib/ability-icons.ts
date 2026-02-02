// src/lib/ability-icons.ts

export type AbilityIconRule = {
  key: string;
  aliases: string[];
};


export const ABILITY_ICON_RULES: AbilityIconRule[] = [
  { key: "rfs", aliases: ["Tir instantané", "Rapid Fire Shot"] },
];

export function normalizeAbilityName(s: string) {
  return (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[’'"]/g, "")
    .replace(/[^a-z0-9\s\-:]/g, "");
}

export function getAbilityIconKey(
  abilityName: string,
  rules: AbilityIconRule[] = ABILITY_ICON_RULES
): string | null {
  const target = normalizeAbilityName(abilityName);
  for (const rule of rules) {
    for (const a of rule.aliases) {
      if (normalizeAbilityName(a) === target) return rule.key;
    }
  }
  return null;
}

export function getAbilityIconUrl(key: string): string | null {
  const k = (key ?? "").trim();
  if (!k) return null;
  return `/abilities/${k}.png`;
}
