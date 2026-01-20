# parser/encounters/isiel.py
from __future__ import annotations

import re
from parser.types import Fight, Phase


VENGEUR_NAME = "Vengeur"
ISIEL_NAME = "Commandant Isiel"


# Fin de phase Vengeur: on cherche un marker texte (60% / invuln / etc.)
VENGEUR_END_PATTERNS = [
    re.compile(r"\b60\s*%\b", re.IGNORECASE),
    re.compile(r"invuln", re.IGNORECASE),
    re.compile(r"devient\s+invuln", re.IGNORECASE),
    re.compile(r"passe\s+à\s+60", re.IGNORECASE),
]


def _find_first_involving(fight: Fight, name: str, start_sec: int) -> int | None:
    name_low = name.lower()
    for ev in fight.events:
        if ev.ts_sec < start_sec:
            continue
        if name_low in ev.src.lower() or name_low in ev.dst.lower() or name_low in ev.raw.lower():
            return ev.ts_sec
    return None


def _find_vengeur_end(fight: Fight, stop_sec: int | None = None) -> int | None:
    for ev in fight.events:
        if stop_sec is not None and ev.ts_sec >= stop_sec:
            break
        txt = f"{ev.raw} {ev.src} {ev.dst} {ev.ability}".lower()
        for p in VENGEUR_END_PATTERNS:
            if p.search(txt):
                return ev.ts_sec
    return None

def build_phases_isiel(fight: Fight) -> list[Phase]:
    start = fight.start_sec
    end = fight.end_sec

    # spawn Isiel
    isiel_first = _find_first_involving(fight, ISIEL_NAME, start)

    # fin Vengeur: marker 60%/invuln, mais uniquement avant le spawn Isiel si on l'a
    v_end = _find_vengeur_end(fight, stop_sec=isiel_first)

    # si pas trouvé, fallback: premier event Isiel, sinon 70s
    if v_end is None and isiel_first is not None:
        v_end = isiel_first
    if v_end is None:
        v_end = min(start + 70, end)

    # IMPORTANT: Isiel commence à v_end pour inclure le délai de spawn
    isiel_start = v_end

    # clamp
    if v_end < start:
        v_end = start
    if v_end > end:
        v_end = end
    if isiel_start < start:
        isiel_start = start
    if isiel_start > end:
        isiel_start = end

    phases = [
        Phase(name="Vengeur", start_sec=start, end_sec=v_end, boss_name=VENGEUR_NAME),
        Phase(name="Isiel", start_sec=isiel_start, end_sec=end, boss_name=ISIEL_NAME),
    ]
    return phases

