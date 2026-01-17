# parser/main.py
from __future__ import annotations

import sys
from pathlib import Path

from .analyzer import read_events, extract_kills
from .output import render_fight
from .player_class import infer_player_classes


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: python3 -m parser.main <logfile>")
        return 2

    log_path = Path(argv[1])
    if not log_path.exists():
        print(f"Fichier introuvable: {log_path}")
        return 2

    with log_path.open("r", encoding="utf-8", errors="replace") as f:
        events = read_events(f)

    # ✅ Calcul des classes sur tout le fichier (et non sur la fenêtre du boss)
    # Ça capte les buffs posés avant pull / hors encounter.
    player_classes = infer_player_classes(events)

    fights = extract_kills(events)
    if not fights:
        print("Aucun kill de boss trouvé (vérifie parser/bosses.py).")
        return 0

    for fight in fights:
        print(render_fight(fight, player_classes=player_classes))

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
