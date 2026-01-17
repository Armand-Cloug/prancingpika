# parser/boss_match.py
from __future__ import annotations

from typing import Optional

from .bosses import BOSS_DEFS
from .types import Event


def match_boss_name(entity_name: str) -> Optional[str]:
    if not entity_name:
        return None
    for boss_key, boss_def in BOSS_DEFS.items():
        if boss_def.matches(entity_name):
            return boss_key
    return None


def boss_involved(ev: Event, boss_key: str) -> bool:
    """
    True si un event prouve que le boss est encore actif après une mort pending.
    On ignore les marqueurs (code 0) et les morts (code 12) elles-mêmes.
    """
    boss_def = BOSS_DEFS.get(boss_key)
    if not boss_def:
        return False
    if ev.code in (0, 12):
        return False
    return boss_def.matches(ev.src) or boss_def.matches(ev.dst)
