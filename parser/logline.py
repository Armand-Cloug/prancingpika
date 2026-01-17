# parser/logline.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class LogEvent:
    ts: int  # seconds since 00:00:00
    raw_ts: str  # "HH:MM:SS"
    kind: str  # "combat_begin" or "event"
    code: Optional[int] = None

    # Parsed tuple fields (when kind == "event")
    t_src: Optional[str] = None
    t_tgt: Optional[str] = None
    source: Optional[str] = None
    target: Optional[str] = None
    amount: int = 0
    spell_id: Optional[int] = None
    spell_name: Optional[str] = None

    text: str = ""  # human-readable message (after ") ")


def parse_hms_to_seconds(hms: str) -> int:
    # hms is "HH:MM:SS"
    h = int(hms[0:2])
    m = int(hms[3:5])
    s = int(hms[6:8])
    return h * 3600 + m * 60 + s
