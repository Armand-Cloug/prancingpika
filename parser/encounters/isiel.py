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


def _find_vengeur_end(fight: Fight) -> int | None:
    v_low = VENGEUR_NAME.lower()
    for ev in fight.events:
        txt = f"{ev.raw} {ev.src} {ev.dst} {ev.ability}".lower()
        if v_low not in txt:
            continue
        for p in VENGEUR_END_PATTERNS:
            if p.search(txt):
                return ev.ts_sec
    return None


def build_phases_isiel(fight: Fight) -> list[Phase]:
    """
    Total = Combat Begin -> Kill Isiel
    Phase 1 (Vengeur) : Combat Begin -> (marker 60%/invuln OU premier event Isiel)
    Phase 2 (Isiel)   : spawn Isiel -> Kill Isiel
    """
    start = fight.start_sec
    end = fight.end_sec

    # 1) fin Vengeur
    v_end = _find_vengeur_end(fight)

    # 2) spawn Isiel
    isiel_first = _find_first_involving(fight, ISIEL_NAME, start)

    if v_end is None and isiel_first is not None:
        v_end = isiel_first

    # fallback si on ne trouve rien: 1:10 après Combat Begin (spec connue)
    if v_end is None:
        v_end = min(start + 70, end)

    # start Isiel: le premier event Isiel si dispo, sinon v_end
    isiel_start = isiel_first if isiel_first is not None else v_end
    if isiel_start < start:
        isiel_start = start
    if isiel_start > end:
        isiel_start = end

    if v_end < start:
        v_end = start
    if v_end > end:
        v_end = end

    # phases
    phases = [
        Phase(
            name="Vengeur",
            start_sec=start,
            end_sec=v_end,
            boss_name=VENGEUR_NAME,
        ),
        Phase(
            name="Isiel",
            start_sec=isiel_start,
            end_sec=end,
            boss_name=ISIEL_NAME,
        ),
    ]

    return phases