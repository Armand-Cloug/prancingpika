# parser/event_reader.py
from __future__ import annotations

import re
from typing import Iterable, Optional

from .types import Event

# - certaines lignes sont "20:50:18 Combat Begin" (pas de ':')
# - d'autres sont "20:09:37: ( ... ) ..."
TS_RE = re.compile(r"^(?P<ts>\d{2}:\d{2}:\d{2})(?::)?\s*(?P<rest>.*)$")


def _ts_to_sec(ts: str) -> int:
    h, m, s = ts.split(":")
    return int(h) * 3600 + int(m) * 60 + int(s)


def _kind_from_token(tok: str) -> str:
    tok = tok.strip()
    if tok.startswith("T=P"):
        return "P"
    if tok.startswith("T=N"):
        return "N"
    return "X"


def _parse_parenthesized_tuple(rest: str) -> Optional[tuple[list[str], str]]:
    rest = rest.strip()
    if not rest.startswith("("):
        return None
    close = rest.find(")")
    if close == -1:
        return None

    inside = rest[1:close]
    msg = rest[close + 1 :].strip()
    fields = [x.strip() for x in inside.split(",")]
    return fields, msg

def _normalize_name(name: str) -> str:
    """
    Rift logs can contain names like 'Ghreanay@Brutwacht'.
    We keep only the character name part ('Ghreanay').
    """
    name = (name or "").strip()
    if not name:
        return ""
    if "@" in name:
        # keep left side only
        name = name.split("@", 1)[0].strip()
    return name

def read_events(lines: Iterable[str]) -> list[Event]:
    events: list[Event] = []

    for line in lines:
        line = line.rstrip("\n")
        if not line.strip():
            continue

        m = TS_RE.match(line)
        if not m:
            continue

        ts = m.group("ts")
        ts_sec = _ts_to_sec(ts)
        rest = m.group("rest").strip()

        # Marker Combat Begin
        if rest == "Combat Begin":
            events.append(
                Event(
                    ts_str=ts,
                    ts_sec=ts_sec,
                    code=0,
                    src_kind="X",
                    dst_kind="X",
                    src="",
                    dst="",
                    amount=0,
                    ability="Combat Begin",
                    raw="Combat Begin",
                )
            )
            continue

        parsed = _parse_parenthesized_tuple(rest)
        if not parsed:
            continue

        fields, msg = parsed
        if len(fields) < 10:
            continue

        try:
            code = int(fields[0])
        except ValueError:
            continue

        src_kind = _kind_from_token(fields[1])
        dst_kind = _kind_from_token(fields[2])

        src = _normalize_name(fields[5])
        dst = _normalize_name(fields[6])

        try:
            amount = int(fields[7])
        except ValueError:
            amount = 0

        ability = fields[9].strip()

        events.append(
            Event(
                ts_str=ts,
                ts_sec=ts_sec,
                code=code,
                src_kind=src_kind,
                dst_kind=dst_kind,
                src=src,
                dst=dst,
                amount=amount,
                ability=ability,
                raw=msg,
            )
        )

    return events
