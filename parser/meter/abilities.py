from __future__ import annotations

from typing import Optional

from ..types import Fight
from .abilities_calc import build_player_breakdowns
from .abilities_output import render_breakdowns_terminal


def render_player_abilities(
    fights: list[Fight],
    player: str,
    encounter_filter: Optional[str] = None,
    boss_only: bool = True,
    include_heal: bool = False,
) -> str:
    breakdowns = build_player_breakdowns(
        fights=fights,
        player=player,
        encounter_filter=encounter_filter,
        boss_only=boss_only,
        include_heal=include_heal,
    )
    return render_breakdowns_terminal(breakdowns)
