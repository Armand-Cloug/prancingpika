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
TW =      spell("Vents arrière",       "xxx")
SS =      spell("Frappe faucheuse",   "xxx")
FB =      spell("Explosion de furie", "xxx")
SCA =     spell("Brûleur",   "xxx")
US =      spell("Fragments des bas-fonds",    "xxx")
SSH =     spell("Voile animique",        "xxx")
APD =     spell("Avatar primitif : Drake", "xxx")
CA =      spell("Coupe-Air", "xxx")
P_TAUNT = spell("Tape d'essence",        "xxx")