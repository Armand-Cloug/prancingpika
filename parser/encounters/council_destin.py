from __future__ import annotations

"""Council of Fate special handling.

Goals:
- Start time: keep the normal fight start (combat begin detected by the generic extractor).
- End time: end when the *third* Council member dies (no Combat End event for this encounter).
- DPS / damage must be computable over the correct window (including adds / souls).

This module is called by bosses.build_phases_for_fight(...) when
fight.encounter == "Le Concile du Destin".

This file mutates the Fight object (it is not frozen) to fix the window used by
downstream computations (import_runs).
"""

from dataclasses import replace
from typing import Dict, Iterable, List, Optional

from parser.types import Fight, Phase, Event


# Council members (3 bosses)
COUNCIL_MEMBERS: List[str] = [
    "Countessa Danazhal",
    "Marquise Boldoch",
    "Comte Pluezhal",
]

# Mini-bosses: "Âme de <X>" (kept here to help matching / debugging)
COUNCIL_SOULS: List[str] = [
    "Âme de Danazhal",
    "Âme de Boldoch",
    "Âme de Pluezhal",
    # sometimes logs lose accents depending on source/export
    "Ame de Danazhal",
    "Ame de Boldoch",
    "Ame de Pluezhal",
]

# Damage codes observed in your Rift combat logs
DAMAGE_CODES = {3, 4, 23, 29}

# Death markers observed in Rift combat logs
# - 11: kill line ("A a tué B")
# - 12: "X est mort" line
DEATH_CODES = {11, 12}


def _norm(s: str) -> str:
    return " ".join((s or "").strip().casefold().split())


def _contains_name(hay: str, needle: str) -> bool:
    h = _norm(hay)
    n = _norm(needle)
    return bool(n) and (n == h or n in h)


def _is_death_event(ev: Event) -> bool:
    # Be permissive: Council logs can use either code 11 or 12.
    if ev.code not in DEATH_CODES:
        return False
    raw = (ev.raw or "").casefold()
    return ("est mort" in raw) or (" a tué " in raw) or (" a tue " in raw)


def _sec_to_ts(sec: int) -> str:
    sec = max(0, int(sec))
    h = sec // 3600
    m = (sec % 3600) // 60
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:02d}"


def _death_ts_for_name(events: Iterable[Event], name: str) -> Optional[int]:
    """Return first timestamp (sec) where `name` is detected as dead."""
    for ev in events:
        if not _is_death_event(ev):
            continue

        # In most logs, the dead entity is in ev.src/ev.dst. Be permissive.
        if _contains_name(ev.src or "", name) or _contains_name(ev.dst or "", name):
            return ev.ts_sec

        # Sometimes the name is only present in raw.
        if _contains_name(ev.raw or "", name):
            return ev.ts_sec

    return None


def _first_damage_ts_to(events: Iterable[Event], target_name: str) -> Optional[int]:
    """Earliest time where a player deals damage to target_name."""
    best: Optional[int] = None
    for ev in events:
        if ev.code not in DAMAGE_CODES:
            continue
        if ev.amount <= 0:
            continue
        if ev.src_kind != "P" or ev.dst_kind != "N":
            continue
        if not _contains_name(ev.dst or "", target_name):
            continue
        if best is None or ev.ts_sec < best:
            best = ev.ts_sec
    return best


def _council_end_sec(fight: Fight) -> Optional[int]:
    """End = moment the 3rd council member dies."""
    deaths: Dict[str, int] = {}
    for name in COUNCIL_MEMBERS:
        ts = _death_ts_for_name(fight.events, name)
        if ts is not None:
            deaths[name] = ts

    if len(deaths) == len(COUNCIL_MEMBERS):
        return max(deaths.values())

    return None


def _shrink_fight_to_end(fight: Fight, end_sec: int) -> None:
    """Mutate Fight to use an earlier end (and trim events)."""
    if end_sec <= 0:
        return
    if end_sec >= fight.end_sec:
        return

    fight.end_sec = end_sec
    fight.end_ts = _sec_to_ts(end_sec)
    fight.events = [ev for ev in fight.events if ev.ts_sec <= end_sec]


def _tag_damage_targets_for_total_table(fight: Fight) -> None:
    """Ensure the default output table (filtered by fight.encounter) shows Council damage.

    output.py's default rendering for "common" bosses filters damage by
    `boss_filter in ev.dst`. For the Council encounter, ev.dst contains the
    actual NPC name (Danazhal/Boldoch/Pluezhal/souls/adds) and will never
    contain "Le Concile du Destin".

    We *only* tag player->NPC damage lines by appending the encounter name to
    the target string. This keeps the rest of the pipeline intact, while making
    the Council fight table display total damage on all mobs.
    """

    enc = (fight.encounter or "").strip()
    if not enc:
        return

    enc_cf = enc.casefold()
    new_events: list[Event] = []
    changed = False

    for ev in fight.events:
        if ev.code in DAMAGE_CODES and ev.src_kind == "P" and ev.dst_kind == "N" and ev.dst:
            if enc_cf not in ev.dst.casefold():
                new_events.append(replace(ev, dst=f"{ev.dst} [{enc}]"))
                changed = True
                continue
        new_events.append(ev)

    if changed:
        fight.events = new_events


def build_phases_council_destin(fight: Fight) -> List[Phase]:
    """Build phases for 'Le Concile du Destin' and fix fight window."""

    end_sec = _council_end_sec(fight)
    if end_sec is not None:
        _shrink_fight_to_end(fight, end_sec)

    # Make sure the default output table shows damage (see docstring).
    _tag_damage_targets_for_total_table(fight)

    phases: List[Phase] = [
        Phase(
            name="Concile (Total)",
            start_sec=fight.start_sec,
            end_sec=fight.end_sec,
            boss_name=fight.encounter,
        )
    ]

    # Optional: per-council-member phases (useful if later you want to display them)
    per_boss: List[tuple[str, int, int]] = []
    for name in COUNCIL_MEMBERS:
        start = _first_damage_ts_to(fight.events, name)
        end = _death_ts_for_name(fight.events, name)

        if start is None:
            continue

        if end is None:
            last = start
            for ev in fight.events:
                if ev.code in DAMAGE_CODES and ev.amount > 0 and ev.src_kind == "P" and ev.dst_kind == "N":
                    if _contains_name(ev.dst or "", name) and ev.ts_sec > last:
                        last = ev.ts_sec
            end = last

        if end < start:
            end = start

        per_boss.append((name, start, end))

    per_boss.sort(key=lambda x: x[1])
    for name, start, end in per_boss:
        phases.append(
            Phase(
                name=name,
                start_sec=start,
                end_sec=end,
                boss_name=name,
            )
        )

    return phases
