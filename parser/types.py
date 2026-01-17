# parser/types.py
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass(frozen=True)
class Event:
    ts_str: str                 # "20:50:22"
    ts_sec: int                 # secondes depuis minuit
    code: int                   # ex: 3,5,6,11,23...
    src_kind: str               # "P" / "N" / "X"
    dst_kind: str               # "P" / "N" / "X"
    src: str
    dst: str
    amount: int
    ability: str
    raw: str                    # texte après la parenthèse


@dataclass(frozen=True)
class Phase:
    name: str
    start_sec: int
    end_sec: int
    boss_name: Optional[str] = None  # si on veut filtrer les dégâts sur ce boss


@dataclass
class Fight:
    encounter: str
    kill_index: int
    start_sec: int              # Combat Begin
    end_sec: int                # timestamp du kill
    start_ts: str
    end_ts: str
    events: list[Event] = field(default_factory=list)
    phases: list[Phase] = field(default_factory=list)
