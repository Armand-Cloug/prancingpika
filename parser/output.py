# parser/output.py
from __future__ import annotations

from collections import defaultdict
from typing import Iterable

from parser.player_class import DEFAULT_CLASS
from parser.types import Fight, Phase


def _fmt_duration(seconds: int) -> str:
    if seconds < 0:
        seconds = 0
    m = seconds // 60
    s = seconds % 60
    return f"{m}:{s:02d}"


def _sum_damage(events: Iterable, start: int, end: int, boss_filter: str | None) -> dict[str, int]:
    dmg = defaultdict(int)
    boss_low = boss_filter.lower() if boss_filter else None

    for ev in events:
        if ev.ts_sec < start or ev.ts_sec > end:
            continue
        # dégâts: source joueur -> cible NPC
        if ev.code in (3, 4, 23, 29) and ev.src_kind == "P" and ev.dst_kind == "N":
            if boss_low is not None and boss_low not in ev.dst.lower():
                continue
            dmg[ev.src] += max(0, ev.amount)

    return dict(dmg)


def _sum_heal(events: Iterable, start: int, end: int) -> dict[str, int]:
    heal = defaultdict(int)
    for ev in events:
        if ev.ts_sec < start or ev.ts_sec > end:
            continue
        # soins: source joueur (peu importe la cible)
        if ev.code in (5, 28) and ev.src_kind == "P":
            heal[ev.src] += max(0, ev.amount)
    return dict(heal)


def _render_table(
    events,
    start: int,
    end: int,
    boss_name: str,
    player_classes: dict[str, str] | None,
):
    dur = max(1, end - start)
    dmg = _sum_damage(events, start, end, boss_name)
    heal = _sum_heal(events, start, end)

    players = sorted(set(dmg.keys()) | set(heal.keys()))
    rows = []
    for p in players:
        d = dmg.get(p, 0)
        h = heal.get(p, 0)
        cls = (player_classes or {}).get(p, DEFAULT_CLASS)
        rows.append((p, cls, d, d / dur, h, h / dur))

    # tri par dégâts décroissants
    rows.sort(key=lambda x: x[2], reverse=True)

    NAME_W = 40
    CLASS_W = 12

    lines = []
    lines.append("-" * 110)
    lines.append(
        f"{'Joueur':{NAME_W}} {'Classe':{CLASS_W}} {'Dégâts':>12} {'DPS':>10} {'Soins':>12} {'HPS':>10}"
    )
    lines.append("-" * 110)
    for p, cls, d, dps, h, hps in rows:
        lines.append(f"{p:{NAME_W}} {cls:{CLASS_W}} {d:12d} {dps:10.1f} {h:12d} {hps:10.1f}")
    lines.append("-" * 110)
    return "\n".join(lines), sum(dmg.values()), sum(heal.values()), dur


def render_fight(fight: Fight, player_classes: dict[str, str] | None = None) -> str:
    """Rendu texte d'un fight.

    player_classes : mapping joueur->classe calculé globalement (sur tout le fichier).
    Si None, les classes sont considérées inconnues (affichage DEFAULT_CLASS).
    """

    total_dur = max(1, fight.end_sec - fight.start_sec)

    # Total = tout ce qui est dans la fenêtre Combat Begin -> Kill (sans filtre boss)
    total_dmg = sum(_sum_damage(fight.events, fight.start_sec, fight.end_sec, boss_filter=None).values())
    total_heal = sum(_sum_heal(fight.events, fight.start_sec, fight.end_sec).values())
    total_dps = total_dmg / total_dur
    total_hps = total_heal / total_dur

    out = []
    out.append("=" * 90)
    out.append(f"Kill #{fight.kill_index} | Encounter: {fight.encounter}")
    out.append(f"Total | Début: {fight.start_ts}  Fin: {fight.end_ts}  Durée: {_fmt_duration(total_dur)}")
    out.append(f"Total | DPS groupe: {total_dps:.1f}  (dégâts: {total_dmg})")
    out.append(f"Total | HPS groupe: {total_hps:.1f}  (soins:  {total_heal})")

    # Affichage phases:
    # - Titan X : 1 phase "Boss" visible
    # - Isiel   : 2 phases visibles (Vengeur + Isiel)
    # - Boss commun : on peut ne rien afficher (ou afficher Boss=Total). Ici: rien.
    is_special = fight.encounter in ("Titan X", "Commandant Isiel")
    if is_special and fight.phases:
        out.append("-" * 90)
        for ph in fight.phases:
            ph_dur = max(1, ph.end_sec - ph.start_sec)
            ph_dmg = sum(_sum_damage(fight.events, ph.start_sec, ph.end_sec, ph.boss_name).values())
            ph_dps = ph_dmg / ph_dur
            out.append(
                f"Phase: {ph.name} | Durée: {_fmt_duration(ph_dur)} | DPS groupe: {ph_dps:.1f} | Dégâts: {ph_dmg}"
            )
        out.append("-" * 90)

        # Titan X: un seul tableau (Boss only)
        if fight.encounter == "Titan X":
            boss_phase = next((p for p in fight.phases if p.name.lower() == "boss"), fight.phases[0])
            table, _, _, _ = _render_table(
                fight.events,
                boss_phase.start_sec,
                boss_phase.end_sec,
                boss_phase.boss_name or "Titan X",
                player_classes,
            )
            out.append(table)
            out.append("=" * 90)
            return "\n".join(out)

        # Isiel: 2 tableaux (Vengeur puis Isiel)
        if fight.encounter == "Commandant Isiel":
            for ph in fight.phases:
                table, _, _, _ = _render_table(
                    fight.events,
                    ph.start_sec,
                    ph.end_sec,
                    ph.boss_name or ph.name,
                    player_classes,
                )
                out.append(table)
            out.append("=" * 90)
            return "\n".join(out)

    # Boss “commun”: tableau boss = total (dégâts filtrés sur le boss de l'encounter)
    table, boss_dmg, boss_heal, boss_dur = _render_table(
        fight.events,
        fight.start_sec,
        fight.end_sec,
        fight.encounter,
        player_classes,
    )
    out.append(table)
    out.append("=" * 90)
    return "\n".join(out)
