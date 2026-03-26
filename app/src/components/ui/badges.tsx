// src/components/ui/badges.tsx
// Shared badge components used across all leaderboard and table views.
import type { Role } from "@/lib/role";

type Calling = "cleric" | "primalist" | "warrior" | "rogue" | "mage" | null;

export function normClass(v?: string | null): Calling {
  if (!v) return null;
  const s = v.trim().toLowerCase();
  if (s.startsWith("cler")) return "cleric";
  if (s.startsWith("pri") || s.includes("prima")) return "primalist";
  if (s.startsWith("war")) return "warrior";
  if (s.startsWith("rog")) return "rogue";
  if (s.startsWith("mag")) return "mage";
  return null;
}

export function classTintClass(playerClass?: string | null): string {
  const c = normClass(playerClass);
  switch (c) {
    case "cleric":     return "class-cleric     ring-1";
    case "primalist":  return "class-primalist  ring-1";
    case "warrior":    return "class-warrior    ring-1";
    case "rogue":      return "class-rogue      ring-1";
    case "mage":       return "class-mage       ring-1";
    default:           return "bg-white/5       ring-1 ring-white/10";
  }
}

export function RolePill({ role, label, spec, size = "md" }: {
  role: Role;
  label?: string;
  spec?: string | null;
  size?: "sm" | "md";
}) {
  const cls: Record<Role, string> = {
    dps:     "pill pill-dps",
    heal:    "pill pill-heal",
    tank:    "pill pill-tank",
    support: "pill pill-support",
  };
  const display = spec || label || role;
  return (
    <span
      className={`${cls[role]} ${size === "sm" ? "text-[10px] px-1.5" : ""}`}
      title={spec ? `${spec} (${role})` : `Role: ${role}`}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{display}</span>
    </span>
  );
}

export function SpecBadge({ spec }: { spec?: string | null }) {
  if (!spec || spec === "-") return null;
  return (
    <span className="spec-badge" title={`Spec: ${spec}`}>
      {spec}
    </span>
  );
}

export function ClassPill({ playerClass, player }: {
  playerClass?: string | null;
  player: string;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-1.5 ring-1 truncate whitespace-nowrap text-[12px] font-medium text-zinc-100 ${classTintClass(playerClass)}`}
      title={player}
    >
      {player}
    </div>
  );
}
