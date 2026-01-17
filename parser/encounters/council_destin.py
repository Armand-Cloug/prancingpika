from __future__ import annotations

from typing import Optional

from parser.types import Fight, Phase

COUNCIL_MEMBERS = [
    "Countessa Danazhal",
    "Marquise Boldoch",
    "Comte Pluezhal",
]

# Codes vus dans tes logs :
# 3 = dégâts, 23 = dégâts critiques, 4 parfois aussi (selon sources)
DAMAGE_CODES = {3, 4, 23}


def _death_of(ev, name: str) -> bool:
    # On considère "mort" si l'entité qui meurt correspond exactement au boss.
    # (Le code 12 + "est mort" ou un "a tué" côté analyzer : ici on n'a que ev.src/ev.dst/ev.raw)
    raw = (ev.raw or "").lower()
    if "est mort" in raw and (ev.src or "") == name:
        return True
    if (" a tué " in raw or " a tue " in raw) and (ev.dst or "") == name:
        return True
    return False


def _first_damage_ts(fight: Fight, boss_name: str) -> Optional[int]:
    ts = None
    for ev in fight.events:
        if ev.code in DAMAGE_CODES and ev.amount > 0 and ev.dst == boss_name:
            if ts is None or ev.ts_sec < ts:
                ts = ev.ts_sec
    return ts


def _death_ts(fight: Fight, boss_name: str) -> Optional[int]:
    # On prend la première mort rencontrée dans le combat pour ce boss
    for ev in fight.events:
        if _death_of(ev, boss_name):
            return ev.ts_sec
    return None


def build_phases_council_destin(fight: Fight) -> list[Phase]:
    """
    Produit 4 durées/segments :
      - Total : start combat -> mort du 3e boss
      - 3 phases : (premier dégât sur boss X) -> (mort boss X)
    """
    per_boss: list[tuple[str, int, int]] = []

    for name in COUNCIL_MEMBERS:
        start = _first_damage_ts(fight, name)
        end = _death_ts(fight, name)

        if start is None:
            continue

        # Si jamais la mort n'est pas vue (log incomplet), on fallback sur last hit
        if end is None:
            last = start
            for ev in fight.events:
                if ev.code in DAMAGE_CODES and ev.amount > 0 and ev.dst == name:
                    if ev.ts_sec > last:
                        last = ev.ts_sec
            end = last

        # sécurité
        if end < start:
            end = start

        per_boss.append((name, start, end))

    # Si on n'a rien, fallback simple
    if not per_boss:
        return [
            Phase(
                name="Concile (Total)",
                start_sec=fight.start_sec,
                end_sec=fight.end_sec,
                boss_name=fight.encounter,
            )
        ]

    # Fin globale = max des fins des boss trouvés
    total_end = max(e for _, _, e in per_boss)

    phases: list[Phase] = [
        Phase(
            name="Concile (Total)",
            start_sec=fight.start_sec,
            end_sec=total_end,
            boss_name=fight.encounter,
        )
    ]

    # Phases individuelles, triées par apparition
    per_boss.sort(key=lambda x: x[1])
    for name, start, end in per_boss:
        phases.append(
            Phase(
                name=name,
                start_sec=start,
                end_sec=end,
                boss_name=name,
            )
        )

    return phases
