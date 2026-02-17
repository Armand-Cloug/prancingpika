# parser/spell/rogue.py
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

# SPELL = spell("Alias FR", "Alias EN", ...)
RFS =   spell("Tir instantané", "Rapid Fire Shot")
CS =    spell("Tir calculé", "Calculated Shot")
DS =    spell("Frappe crépusculaire", "Dusk Strike")
VIR =   spell("Poison virulent", "Virulent Poison")
EB =    spell("Trait empyréen", "Empyrean Bolt")
TF =    spell("Force crépusculaire", "Twilight Force")
AF =    spell("Attaque de factionnaire", "Sentry Battery")
CAD =   spell("Cadence")
BS =    spell("Frappe brûlante", "Blazing Strike")
AP =    spell("Accord de puissance", "Power Chord")
R_TAUNT = spell("Instigation", "Instigate")