from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, Optional, Tuple

from ..boss_match import match_boss_name
from ..types import Event, Fight, Phase


# ---- Codes (selon ton mapping) ----
_DAMAGE_NORMAL = {3, 4, 14, 29}
_DAMAGE_CRIT = {23}

_HEAL_NORMAL = {5}
_HEAL_CRIT = {28}


def norm(s: str) -> str:
    return (s or "").strip().casefold()


def is_damage_event(e: Event) -> bool:
    return e.code in _DAMAGE_NORMAL or e.code in _DAMAGE_CRIT


def is_heal_event(e: Event) -> bool:
    return e.code in _HEAL_NORMAL or e.code in _HEAL_CRIT


def is_crit(e: Event) -> bool:
    return e.code in _DAMAGE_CRIT or e.code in _HEAL_CRIT


def event_in_window(e: Event, start_sec: int, end_sec: int) -> bool:
    return start_sec <= e.ts_sec <= end_sec


@dataclass
class AbilityStats:
    name: str
    total: int = 0
    hits: int = 0
    crit_hits: int = 0
    min_hit: int = 0
    max_hit: int = 0

    def add(self, amount: int, crit: bool) -> None:
        if self.hits == 0:
            self.min_hit = amount
            self.max_hit = amount
        else:
            self.min_hit = min(self.min_hit, amount)
            self.max_hit = max(self.max_hit, amount)

        self.total += amount
        self.hits += 1
        if crit:
            self.crit_hits += 1

    @property
    def avg(self) -> float:
        return self.total / self.hits if self.hits else 0.0

    @property
    def crit_rate(self) -> float:
        return (self.crit_hits / self.hits * 100.0) if self.hits else 0.0


@dataclass(frozen=True)
class AbilityLine:
    name: str
    total: int
    hits: int
    crit_rate: float
    min_hit: int
    max_hit: int
    avg_hit: float
    rate: float  # DPS ou HPS
    pct: float   # contribution %


@dataclass(frozen=True)
class AbilityBreakdown:
    encounter: str
    player: str
    window_label: str
    duration_s: int

    damage_total: int
    damage_rate: float
    damage_lines: Tuple[AbilityLine, ...]

    heal_total: int = 0
    heal_rate: float = 0.0
    heal_lines: Tuple[AbilityLine, ...] = ()


def phase_matches_boss(phase: Phase, boss_key: str) -> bool:
    if getattr(phase, "boss_name", None):
        if match_boss_name(phase.boss_name) == boss_key:
            return True
        if norm(phase.boss_name) == norm(boss_key):
            return True

    if match_boss_name(phase.name) == boss_key:
        return True

    return False


def pick_boss_window(fight: Fight) -> Optional[Tuple[int, int, str]]:
    """
    Retourne (start_sec, end_sec, phase_name) pour la phase correspondant au boss principal.
    Si plusieurs candidates, prend la plus longue.
    """
    boss_key = fight.encounter
    candidates: list[Tuple[int, int, str]] = []

    for ph in fight.phases:
        if phase_matches_boss(ph, boss_key):
            candidates.append((ph.start_sec, ph.end_sec, ph.name))

    if not candidates:
        return None

    return max(candidates, key=lambda t: (t[1] - t[0], t[1]))


def collect_by_ability(
    fight: Fight,
    player: str,
    kind: str,
    boss_only: bool,
    win_start: int,
    win_end: int,
) -> Dict[str, AbilityStats]:
    stats: Dict[str, AbilityStats] = {}
    pkey = norm(player)
    boss_key = fight.encounter

    for e in fight.events:
        if not event_in_window(e, win_start, win_end):
            continue
        if norm(e.src) != pkey:
            continue

        if kind == "damage":
            if not is_damage_event(e):
                continue
            if boss_only:
                if match_boss_name(e.dst) != boss_key:
                    continue

        elif kind == "heal":
            if not is_heal_event(e):
                continue
        else:
            continue

        if e.amount <= 0:
            continue

        ability = e.ability or "Unknown"
        s = stats.get(ability)
        if s is None:
            s = AbilityStats(name=ability)
            stats[ability] = s

        s.add(e.amount, is_crit(e))

    return stats


def to_lines(stats: Iterable[AbilityStats], duration_s: int, total_player: int) -> Tuple[AbilityLine, ...]:
    lines: list[AbilityLine] = []
    for s in stats:
        rate = (s.total / duration_s) if duration_s > 0 else 0.0
        pct = (s.total / total_player * 100.0) if total_player > 0 else 0.0
        lines.append(
            AbilityLine(
                name=s.name,
                total=s.total,
                hits=s.hits,
                crit_rate=s.crit_rate,
                min_hit=s.min_hit,
                max_hit=s.max_hit,
                avg_hit=s.avg,
                rate=rate,
                pct=pct,
            )
        )

    lines.sort(key=lambda x: x.total, reverse=True)
    return tuple(lines)


def build_player_breakdowns(
    fights: list[Fight],
    player: str,
    encounter_filter: Optional[str] = None,
    boss_only: bool = True,
    include_heal: bool = False,
) -> Tuple[AbilityBreakdown, ...]:
    ffilter = norm(encounter_filter) if encounter_filter else None
    out: list[AbilityBreakdown] = []

    for f in fights:
        if ffilter and ffilter not in norm(f.encounter):
            continue

        win_start = f.start_sec
        win_end = f.end_sec
        win_label = "Total"

        if boss_only:
            boss_win = pick_boss_window(f)
            if boss_win is not None:
                win_start, win_end, phase_name = boss_win
                win_label = f"Phase boss: {phase_name}"

        duration_s = max(0, int(win_end - win_start))
        if duration_s <= 0:
            continue

        dmg_stats = collect_by_ability(
            f, player, kind="damage", boss_only=boss_only, win_start=win_start, win_end=win_end
        )
        if not dmg_stats:
            continue

        dmg_total = sum(s.total for s in dmg_stats.values())
        dmg_rate = dmg_total / duration_s if duration_s > 0 else 0.0
        dmg_lines = to_lines(dmg_stats.values(), duration_s, dmg_total)

        heal_total = 0
        heal_rate = 0.0
        heal_lines: Tuple[AbilityLine, ...] = ()

        if include_heal:
            heal_stats = collect_by_ability(
                f, player, kind="heal", boss_only=False, win_start=win_start, win_end=win_end
            )
            if heal_stats:
                heal_total = sum(s.total for s in heal_stats.values())
                heal_rate = heal_total / duration_s if duration_s > 0 else 0.0
                heal_lines = to_lines(heal_stats.values(), duration_s, heal_total)

        out.append(
            AbilityBreakdown(
                encounter=f.encounter,
                player=player,
                window_label=win_label,
                duration_s=duration_s,
                damage_total=dmg_total,
                damage_rate=dmg_rate,
                damage_lines=dmg_lines,
                heal_total=heal_total,
                heal_rate=heal_rate,
                heal_lines=heal_lines,
            )
        )

    return tuple(out)
