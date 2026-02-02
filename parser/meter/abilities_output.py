from __future__ import annotations

from typing import Iterable

from .abilities_calc import AbilityBreakdown, AbilityLine


def fmt_int(n: int) -> str:
    return str(int(n))


def fmt_float(x: float) -> str:
    # 1 décimale, sans séparateurs de milliers
    return f"{x:.1f}"


def fmt_mmss(duration_s: int) -> str:
    m = duration_s // 60
    s = duration_s % 60
    return f"{m}:{s:02d}"


def render_table(lines: Iterable[AbilityLine], rate_label: str) -> str:
    rows = []
    for ln in lines:
        rows.append(
            (
                ln.name,
                fmt_int(ln.total),
                fmt_float(ln.rate),
                f"{ln.pct:.1f}",
                str(ln.hits),
                f"{ln.crit_rate:.1f}",
                fmt_int(ln.min_hit),
                fmt_int(ln.max_hit),
                fmt_float(ln.avg_hit),
            )
        )

    headers = ("Compétence", "Total", rate_label, "%", "Hits", "Crit%", "Min", "Max", "Moy")
    cols = list(zip(*([headers] + rows))) if rows else [headers]
    widths = [max(len(str(v)) for v in col) for col in cols] if rows else [len(h) for h in headers]

    def fmt_line(values):
        return "  ".join(str(v).ljust(w) for v, w in zip(values, widths))

    sep = "-" * (sum(widths) + 2 * (len(widths) - 1))

    out = [fmt_line(headers), sep]
    for r in rows:
        out.append(fmt_line(r))
    return "\n".join(out)


def render_breakdowns_terminal(breakdowns: Iterable[AbilityBreakdown]) -> str:
    BIG = "=" * 90
    out: list[str] = []
    any_found = False

    for b in breakdowns:
        any_found = True
        out.append(BIG)
        out.append(
            f"Encounter: {b.encounter} | Joueur: {b.player} | {b.window_label} | Durée: {fmt_mmss(b.duration_s)}"
        )
        out.append(f"Dégâts joueur: {fmt_int(b.damage_total)} | DPS: {fmt_float(b.damage_rate)}")
        out.append("")
        out.append(render_table(b.damage_lines, rate_label="DPS"))
        out.append("")

        if b.heal_lines:
            out.append(f"Soins joueur: {fmt_int(b.heal_total)} | HPS: {fmt_float(b.heal_rate)}")
            out.append("")
            out.append(render_table(b.heal_lines, rate_label="HPS"))
            out.append("")

    if not any_found:
        return "Aucune donnée."

    out.append(BIG)
    return "\n".join(out)
