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
RB =    spell("Explosion de Faille", "Rift Burst")
IB =    spell("Explosion polaire", "Icy Burst")
SD =    spell("Maladie de l'âme", "Soul Sickness")
ST =    spell("Gardez la tête haute !", "Stand Tall!")
JT =    spell("Secousse", "Jolt")
PR =    spell("Réaction Positive", "Positive Reaction")
LINK =  spell("Frères d'armes", "Brothers in Arms")
BSO =   spell("Chant de guerre", "Battlesong")
WW =    spell("Voie du vent", "Way of the Wind")
CP =    spell("Impulsion chargée", "Charged Pulsex")
AQD =   spell("Une mort rapide", "A Quick Death")
VS =    spell("Courant viral", "Viral Stream")
W_TAUNT = spell("Interférence", "Étincelle", 	"Interfere", "Spark")