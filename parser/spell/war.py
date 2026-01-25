# parser/spell/war.py
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
RB =    spell("Explosion de Faille",    "xxx")
IB =    spell("Explosion polaire",      "xxx")
SD =    spell("Maladie de l'âme",       "xxx")
ST =    spell("Gardez la tête haute !", "xxx")
JT =    spell("Secousse",               "xxx")
PR =    spell("Réaction Positive",      "xxx")
LINK =  spell("Frères d'armes",         "xxx")
BSO =   spell("Chant de guerre",        "xxx")
WW =    spell("Voie du vent",           "xxx")
CP =    spell("Impulsion chargée",      "xxx")
AQD =   spell("Une mort rapide",        "xxx")
VS =    spell("Courant viral",          "xxx")
W_TAUNT = spell("Interférence",         "Étincelle")