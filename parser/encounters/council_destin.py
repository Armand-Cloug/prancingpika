from __future__ import annotations

import re
from typing import Optional, Dict, List

from parser.types import Fight, Phase, Event

COUNCIL_KEY = "Le Concile du Destin"

COUNCIL_MEMBERS: List[str] = [
    "Countessa Danazhal",
    "Marquise Boldoch",
    "Comte Pluezhal",
]

# Mini-boss / "âmes" (variantes accent / sans accent)
COUNCIL_SOULS: List[str] = [
    "Âme de Danazhal",
    "Âme de Boldoch",
    "Âme de Pluezhal",
    "Ame de Danazhal",
    "Ame de Boldoch",
    "Ame de Pluezhal",
]

# Codes vus
DAMAGE_CODES = {3, 4, 23, 29}
KILL_CODES = {11, 12}  # selon logs: "a tué", "est mort", etc.

_KILL_RE = re.compile(r"\ba tu[eé]\b", re.IGNORECASE)
_DEATH_RE = re.compile(r"\best mort", re.IGNORECASE)


def _norm(s: str) -> str:
    return " ".join((s or "").strip().casefold().split())


def _extract_dead_name(raw: str) -> Optional[str]:
    """
    Extrait la cible morte depuis une phrase du type:
      - "... a tué X."
    """
    if not raw:
        return None
    m = _KILL_RE.search(raw)
    if not m:
        return None
    # Tout ce qui suit "a tué"
    parts = _KILL_RE.split(raw, maxsplit=1)
    if len(parts) != 2:
        return None
    dead = parts[1].strip()
    dead = dead.strip(" .!?:;\"'()[]{}")
    return dead or None


def _member_death_ts(fight: Fight) -> Dict[str, int]:
    """
    Retourne {member_name: ts_sec} pour les membres dont on a trouvé la mort.
    On essaie plusieurs heuristiques car les logs peuvent varier.
    """
    wanted = {_norm(n): n for n in COUNCIL_MEMBERS}
    out: Dict[str, int] = {}

    for ev in fight.events:
        if ev.code not in KILL_CODES:
            continue

        raw = ev.raw or ""

        # Cas 1: "... a tué X"
        dead = _extract_dead_name(raw)
        if dead:
            dn = _norm(dead)
            if dn in wanted and dn not in out:
                out[dn] = ev.ts_sec
                continue

        # Cas 2: "X est mort" (souvent ev.src == X, mais on check raw + src)
        if _DEATH_RE.search(raw):
            srcn = _norm(ev.src or "")
            if srcn in wanted and srcn not in out:
                out[srcn] = ev.ts_sec
                continue

        # Cas 3 (fallback): parfois la victime est en ev.dst
        dstn = _norm(ev.dst or "")
        if dstn in wanted and dstn not in out and (_KILL_RE.search(raw) or _DEATH_RE.search(raw)):
            out[dstn] = ev.ts_sec

    # Re-map norm->original key
    return {wanted[k]: v for k, v in out.items()}


def _first_combat_damage_ts(fight: Fight) -> Optional[int]:
    """
    Timestamp du premier dégâts du fight sur une entité "Council-like".
    Sert surtout à avoir une phase propre si besoin.
    """
    targets = set(map(_norm, COUNCIL_MEMBERS + COUNCIL_SOULS))
    ts: Optional[int] = None
    for ev in fight.events:
        if ev.code in DAMAGE_CODES and ev.amount > 0:
            if _norm(ev.dst or "") in targets:
                ts = ev.ts_sec if ts is None else min(ts, ev.ts_sec)
    return ts


def _tag_all_npc_targets_for_filter(fight: Fight) -> None:
    """
    IMPORTANT:
    Ton système actuel filtre les dégâts via "boss_filter in ev.dst".
    Pour le Council, les cibles sont multiples (boss/âmes/adds).
    Donc on "tag" tous les dst NPC du fight pour qu'ils contiennent COUNCIL_KEY,
    ce qui permet au filtre (COUNCIL_KEY) de matcher et de sommer tous les mobs.
    """
    tagged: List[Event] = []
    for ev in fight.events:
        dst = ev.dst or ""
        # On tag uniquement les cibles NPC (dst_kind == "N") avec un nom
        if ev.dst_kind == "N" and dst and COUNCIL_KEY.lower() not in dst.lower():
            dst = f"{COUNCIL_KEY}::{dst}"

        # Event est frozen -> on reconstruit
        tagged.append(
            Event(
                ts_str=ev.ts_str,
                ts_sec=ev.ts_sec,
                code=ev.code,
                src_kind=ev.src_kind,
                dst_kind=ev.dst_kind,
                src=ev.src,
                dst=dst,
                amount=ev.amount,
                ability=ev.ability,
                raw=ev.raw,
            )
        )

    fight.events = tagged


def build_phases_council_destin(fight: Fight) -> list[Phase]:
    """
    Objectif:
      - Début = fight.start_sec (combat begin standard)
      - Fin = mort du 3e membre (pas de Combat End)
      - DPS = sur tous les mobs (boss + âmes + adds)
    """

    # 1) Tag des cibles pour que le filtre "Le Concile du Destin" inclue TOUT
    _tag_all_npc_targets_for_filter(fight)

    # 2) Fin = mort du 3e boss (max des morts détectées)
    deaths = _member_death_ts(fight)
    if len(deaths) >= 1:
        end_sec = max(deaths.values())
    else:
        # Fallback: si on n'a aucune mort détectée, on garde l'end actuel
        end_sec = fight.end_sec

    # 3) Optionnel: si tu veux être plus strict, tu peux forcer le start au 1er dégâts council
    #    (ça évite un combat begin trop tôt sur certains logs)
    first_hit = _first_combat_damage_ts(fight)
    start_sec = fight.start_sec
    if first_hit is not None and first_hit >= fight.start_sec:
        # si combat begin est OK, on ne touche pas; sinon tu peux choisir first_hit
        start_sec = fight.start_sec

    # 4) On force le fight à finir exactement au 3e mort (utile pour ton output et DB)
    fight.end_sec = end_sec

    # Une seule phase "Boss" (tu peux en ajouter d'autres si tu veux du détail)
    return [
        Phase(
            name="Boss",
            start_sec=start_sec,
            end_sec=end_sec,
            boss_name=COUNCIL_KEY,
        )
    ]
