# parser/spell/cleric.py
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
NR =      spell("Réprimande de Nysyr",     "xxx")
ICB =     spell("Coup glacé",              "xxx")
FES =     spell("Frappe fervente",         "xxx")
HOF =     spell("Marteau de la foi",       "xxx")
IDD =     spell("Insigne de dilapidation", "xxx")
IDS =     spell("Innondation de soins",    "xxx")
RE =      spell("Rage explosive",              "xxx")
AM =      spell("Affliction miséreuse",         "xxx")

C_TAUNT = spell("Provocation",             "xxx")  