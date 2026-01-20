# parser/encounters/isiel.py
from __future__ import annotations

import re
from parser.types import Fight, Phase

VENGEUR_NAME = "Vengeur"
ISIEL_NAME = "Commandant Isiel"

# dégâts joueur -> NPC
DMG_CODES = (3, 4, 23, 29)

# Fin de phase Vengeur: markers texte (60% / invuln / etc.)
VENGEUR_END_PATTERNS = [
    re.compile(r"\b60\s*%\b", re.IGNORECASE),
    re.compile(r"\binvuln", re.IGNORECASE),
    re.compile(r"devient\s+invuln", re.IGNORECASE),
    re.compile(r"passe\s+à\s+60", re.IGNORECASE),
    # variantes selon logs/locale
    re.compile(r"immun", re.IGNORECASE),
    re.compile(r"invinc", re.IGNORECASE),
]


def _txt(ev) -> str:
    return f"{ev.raw} {ev.src} {ev.dst} {getattr(ev, 'ability', '')}".lower()


def _find_first_player_damage_to(fight: Fight, names: list[str], start_sec: int) -> int | None:
    """Premier timestamp où un joueur inflige des dégâts à un NPC dont le nom matche `names`."""
    names_low = [n.lower() for n in names]
    for ev in fight.events:
        if ev.ts_sec < start_sec:
            continue
        if ev.code not in DMG_CODES:
            continue
        if ev.amount <= 0:
            continue
        if ev.src_kind != "P" or ev.dst_kind != "N":
            continue
        dst_low = (ev.dst or "").lower()
        if any(n in dst_low for n in names_low):
            return ev.ts_sec
    return None


def _find_last_player_damage_to_before(fight: Fight, name: str, before_sec: int) -> int | None:
    """Dernier timestamp < before_sec où un joueur inflige des dégâts au NPC `name`."""
    name_low = name.lower()
    last: int | None = None
    for ev in fight.events:
        if ev.ts_sec >= before_sec:
            break
        if ev.code not in DMG_CODES:
            continue
        if ev.amount <= 0:
            continue
        if ev.src_kind != "P" or ev.dst_kind != "N":
            continue
        if name_low in (ev.dst or "").lower():
            last = ev.ts_sec
    return last


def _find_vengeur_end_marker(fight: Fight, start_sec: int, stop_sec: int | None) -> int | None:
    """
    Cherche le marker "60%/invuln" dans le texte.
    On NE force PAS la présence du mot 'Vengeur' car selon les logs le marker peut être ailleurs.
    """
    for ev in fight.events:
        if ev.ts_sec < start_sec:
            continue
        if stop_sec is not None and ev.ts_sec >= stop_sec:
            break
        t = _txt(ev)
        for p in VENGEUR_END_PATTERNS:
            if p.search(t):
                return ev.ts_sec
    return None


def build_phases_isiel(fight: Fight) -> list[Phase]:
    """
    Objectif:
    - Phase Vengeur : Combat Begin -> passage 60% (ou meilleur proxy)
    - Phase Isiel   : DOIT inclure le délai de spawn après le 60%
      => on démarre Isiel à v_end (fin Vengeur), pas au premier event Isiel.
    """

    start = fight.start_sec
    end = fight.end_sec

    # 1) On détecte quand Isiel devient réellement "tapable" : premier dégât joueur->Isiel
    isiel_first_dmg = _find_first_player_damage_to(fight, [ISIEL_NAME, "Isiel"], start)

    # 2) Fin Vengeur = en priorité marker 60%/invuln (si trouvé)
    v_end = _find_vengeur_end_marker(fight, start_sec=start, stop_sec=isiel_first_dmg)

    # 3) Si marker introuvable: meilleur proxy = dernier dégât joueur->Vengeur avant le 1er dégât sur Isiel
    if v_end is None and isiel_first_dmg is not None:
        v_last_dmg = _find_last_player_damage_to_before(fight, VENGEUR_NAME, isiel_first_dmg)
        if v_last_dmg is not None:
            v_end = v_last_dmg

    # 4) Fallbacks (on garde ton comportement historique)
    if v_end is None and isiel_first_dmg is not None:
        v_end = isiel_first_dmg
    if v_end is None:
        v_end = min(start + 70, end)

    # clamp
    if v_end < start:
        v_end = start
    if v_end > end:
        v_end = end

    # IMPORTANT: Isiel commence à v_end pour inclure le délai de spawn (même si aucun event ne log ce délai)
    isiel_start = v_end

    # clamp
    if isiel_start < start:
        isiel_start = start
    if isiel_start > end:
        isiel_start = end

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
