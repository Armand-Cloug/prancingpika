# parser/spell/mage.py
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
GS =      spell("Salve de Granite",                    "xxx")
EF =      spell("Forces élémentaires légendaires",     "xxx")
LS =      spell("Tempête vivante",                     "xxx")
VS =      spell("Taillade vorpale",                    "xxx")
SL =      spell("Souillure",                           "xxx")
CB =      spell("Explosion de cendres",                "xxx")
FST =     spell("Tempête de feu",                      "xxx")
SI =      spell("Spores infâmes",                      "xxx")
M_TAUNT = spell("Vent mordant",                      "xxx")