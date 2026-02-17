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
GS =      spell("Salve de Granite", "Granite Salvo")
EF =      spell("Forces élémentaires légendaires", "Legendary Elemental Forces")
LS =      spell("Tempête vivante", "Living Storm")
VS =      spell("Taillade vorpale", "Vorpal Slash")
SL =      spell("Souillure", "Defile")
CB =      spell("Explosion de cendres", "Cinder Burst")
FST =     spell("Tempête de feu", "Fire Storm")
SI =      spell("Spores infâmes", "Vile Spores")
M_TAUNT = spell("Vent mordant", "Biting Wind")