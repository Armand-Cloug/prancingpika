# parser/spell/prima.py
from __future__ import annotations

from dataclasses import dataclass
from typing import FrozenSet

def norm(s: str) -> str:
    return " ".join(s.strip().split()).casefold()

@dataclass(frozen=True)
class Spell:
    key: str                 # identifiant canonique interne
    aliases: FrozenSet[str]  # FR/EN/variantes

def spell(key: str, *aliases: str) -> Spell:
    return Spell(key=key, aliases=frozenset(norm(a) for a in aliases))

# Une ligne = un sort, autant d’alias que tu veux
TW =      spell("Vents arrière", "Tailwind")
SS =      spell("Frappe faucheuse", "Scything Strike")
FB =      spell("Explosion de furie", "Fury Blast")
SCA =     spell("Brûleur", "Scald")
US =      spell("Fragments des bas-fonds", "Underworld Shards")
SSH =     spell("Voile animique", "Soul Shroud")
APD =     spell("Avatar primitif : Drake", "Primal Avatar: Drake")
CA =      spell("Coupe-Air", "Air Cutter")
P_TAUNT = spell("Tape d'essence", "Essence Tap")