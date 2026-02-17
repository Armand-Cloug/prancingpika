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
NR =      spell("Réprimande de Nysyr", "Nysyr's Rebuke")
ICB =     spell("Coup glacé", "Icy Blow")
FES =     spell("Frappe fervente", "Fervent Strike")
HOF =     spell("Marteau de la foi", "Hammer of Faith")
IDD =     spell("Insigne de dilapidation", "Wasting Insignia")
IDS =     spell("Innondation de soins", "Healing Flood")
RE =      spell("Rage explosive", "Explosive Rage")
AM =      spell("Affliction miséreuse", "Miserly Affliction")

C_TAUNT = spell("Provocation", "Provoke")  