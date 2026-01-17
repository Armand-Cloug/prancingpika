# parser/encounters/titan_x.py
from __future__ import annotations

from parser.types import Fight, Phase


def build_phases_titan_x(fight: Fight) -> list[Phase]:
    """
    Total = Combat Begin -> Kill Titan X
    BossOnly = first event impliquant Titan X -> Kill Titan X
    """
    boss_name = "Titan X"

    boss_start = None
    for ev in fight.events:
        # un event "impliquant" Titan X (src ou dst) suffit à marquer le pop/engage
        if boss_name.lower() in ev.src.lower() or boss_name.lower() in ev.dst.lower():
            boss_start = ev.ts_sec
            break

    if boss_start is None:
        boss_start = fight.start_sec

    # On retourne 1 phase "Boss" (visible), mais total se calcule via fight.start_sec
    return [
        Phase(
            name="Boss",
            start_sec=boss_start,
            end_sec=fight.end_sec,
            boss_name=boss_name,
        )
    ]
