# parser/main.py
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .analyzer import read_events
from .fight_extractor import extract_kills
from .output import render_fight
from .player_class import infer_player_classes


def _parse_abilities_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(prog="python3 -m parser.main abilities")
    p.add_argument("logfile", help="Chemin du fichier de log")
    p.add_argument("--player", "-p", required=True, help="Pseudo du joueur (insensible à la casse)")
    p.add_argument(
        "--encounter",
        "-e",
        default=None,
        help='Filtre encounter (nom partiel, ex: "Azranel")',
    )
    p.add_argument(
        "--all-targets",
        action="store_true",
        help="Inclure les dégâts sur tous les mobs (adds) dans la fenêtre du boss. Par défaut: boss only.",
    )
    p.add_argument(
        "--include-heal",
        action="store_true",
        help="Inclure aussi le breakdown des soins (codes 5/28)",
    )
    return p.parse_args(argv)


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage:")
        print("  python3 -m parser.main <logfile>")
        print("  python3 -m parser.main abilities <logfile> --player <pseudo> [--encounter X] [--all-targets] [--include-heal]")
        return 2

    # ---- Mode "abilities" ----
    if argv[1] == "abilities":
        args = _parse_abilities_args(argv[2:])

        log_path = Path(args.logfile)
        if not log_path.exists():
            print(f"Fichier introuvable: {log_path}")
            return 2

        with log_path.open("r", encoding="utf-8", errors="replace") as f:
            events = read_events(f)

        fights = extract_kills(events)
        if not fights:
            print("Aucun kill de boss trouvé (vérifie parser/bosses.py).")
            return 0

        from .meter.abilities import render_player_abilities

        print(
            render_player_abilities(
                fights=fights,
                player=args.player,
                encounter_filter=args.encounter,
                boss_only=(not args.all_targets),  # ✅ boss-only par défaut
                include_heal=args.include_heal,
            )
        )
        return 0

    # ---- Mode "summary" actuel ----
    log_path = Path(argv[1])
    if not log_path.exists():
        print(f"Fichier introuvable: {log_path}")
        return 2

    with log_path.open("r", encoding="utf-8", errors="replace") as f:
        events = read_events(f)

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
