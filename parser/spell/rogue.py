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
RFS =   spell("Tir instantané",         "xxx")
CS =    spell("Tir calculé",             "xxx")
DS =    spell("Frappe crépusculaire",    "xxx")
VIR =   spell("Poison virulent",         "xxx")
EB =    spell("Trait empyréen",          "xxx")
TF =    spell("Force crépusculaire",     "xxx")
AF =    spell("Attaque de factionnaire", "xxx")
R_TAUNT = spell("Instigation",             "xxx")
CAD =   spell("Cadence",                 "xxx")
BS =    spell("Frappe brûlante",         "xxx")
AP =    spell("Accord de puissance",       "xxx")