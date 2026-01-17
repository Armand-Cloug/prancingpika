#!/usr/bin/env python3
from __future__ import annotations

import os
import sys

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_SCRIPT_DIR)

# Ensure "parser.*" imports work when launched as a module or as a script
if sys.path:
    p0 = os.path.abspath(sys.path[0])
    if p0 == os.path.abspath(_SCRIPT_DIR):
        sys.path.pop(0)

if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

import argparse
import hashlib
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Dict, Iterable, List, Tuple
from urllib.parse import urlparse, unquote

from parser.analyzer import read_events, extract_kills
from parser.types import Event, Fight, Phase

try:
    from parser.player_class import infer_player_classes, DEFAULT_CLASS  # type: ignore
except Exception:
    infer_player_classes = None  # type: ignore
    DEFAULT_CLASS = "Unknown"


# -----------------------------
# ENV / DB helpers
# -----------------------------
def load_dotenv(dotenv_path: Path) -> None:
    if not dotenv_path.exists():
        return
    for raw in dotenv_path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export ") :].strip()
        if "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip().strip("'").strip('"')
        os.environ.setdefault(k, v)


@dataclass(frozen=True)
class DbConfig:
    host: str
    port: int
    user: str
    password: str
    database: str


def parse_database_url(url: str) -> DbConfig:
    u = urlparse(url)
    if u.scheme not in ("mysql", "mysql2"):
        raise ValueError("DATABASE_URL doit commencer par mysql://")

    host = u.hostname or "127.0.0.1"
    port = int(u.port or 3306)
    user = unquote(u.username or "")
    password = unquote(u.password or "")
    database = (u.path or "").lstrip("/")

    if not user or not database:
        raise ValueError("DATABASE_URL doit contenir user et database")

    return DbConfig(host=host, port=port, user=user, password=password, database=database)


def db_config_from_env() -> DbConfig:
    db_url = os.getenv("DATABASE_URL", "").strip()
    if db_url:
        return parse_database_url(db_url)

    host = os.getenv("DB_HOST") or os.getenv("MYSQL_HOST") or "127.0.0.1"
    port_s = os.getenv("DB_PORT") or os.getenv("MYSQL_PORT") or "3306"
    user = os.getenv("DB_USER") or os.getenv("MYSQL_USER") or ""
    password = os.getenv("DB_PASSWORD") or os.getenv("MYSQL_PASSWORD") or ""
    name = os.getenv("DB_NAME") or os.getenv("MYSQL_DATABASE") or ""

    if not user or not name:
        raise ValueError("Conf DB introuvable: mets DATABASE_URL ou DB_* / MYSQL_*")

    return DbConfig(host=host, port=int(port_s), user=user, password=password, database=name)


def connect_mysql(cfg: DbConfig):
    # Prefer PyMySQL if present, else mysql-connector
    try:
        import pymysql  # type: ignore

        return pymysql.connect(
            host=cfg.host,
            port=cfg.port,
            user=cfg.user,
            password=cfg.password,
            database=cfg.database,
            charset="utf8mb4",
            autocommit=False,
        )
    except ImportError:
        pass

    import mysql.connector  # type: ignore

    return mysql.connector.connect(
        host=cfg.host,
        port=cfg.port,
        user=cfg.user,
        password=cfg.password,
        database=cfg.database,
        autocommit=False,
    )


def fetch_one(cur, sql: str, params: Tuple):
    cur.execute(sql, params)
    return cur.fetchone()


# -----------------------------
# DB "ensure" helpers
# -----------------------------
def ensure_boss(cur, name: str) -> int:
    row = fetch_one(cur, "SELECT id FROM bosses WHERE name=%s", (name,))
    if row:
        return int(row[0])
    cur.execute("INSERT INTO bosses (name) VALUES (%s)", (name,))
    return int(cur.lastrowid)


def ensure_group(cur, roster_names: List[str], label: str | None = None) -> int:
    roster_sorted = sorted(roster_names, key=lambda s: s.casefold())
    roster_blob = "|".join(roster_sorted).encode("utf-8", errors="replace")
    roster_hash = hashlib.sha1(roster_blob).hexdigest()
    roster_size = len(roster_sorted)

    row = fetch_one(cur, "SELECT id FROM `groups` WHERE rosterHash=%s", (roster_hash,))
    if row:
        return int(row[0])

    cur.execute(
        "INSERT INTO `groups` (rosterHash, rosterSize, label) VALUES (%s, %s, %s)",
        (roster_hash, roster_size, label),
    )
    return int(cur.lastrowid)


def ensure_player(cur, name: str, player_class: str | None) -> int:
    row = fetch_one(cur, "SELECT id, `class` FROM players WHERE name=%s", (name,))
    if row:
        pid = int(row[0])
        existing = row[1]
        if player_class and (existing is None or str(existing).strip() == "" or str(existing) == DEFAULT_CLASS):
            cur.execute("UPDATE players SET `class`=%s WHERE id=%s", (player_class, pid))
        return pid

    cur.execute("INSERT INTO players (name, `class`) VALUES (%s, %s)", (name, player_class))
    return int(cur.lastrowid)


def run_exists(cur, boss_id: int, group_id: int, started_at: datetime, ended_at: datetime) -> int | None:
    row = fetch_one(
        cur,
        "SELECT id FROM runs WHERE bossId=%s AND groupId=%s AND startedAt=%s AND endedAt=%s",
        (boss_id, group_id, started_at, ended_at),
    )
    return int(row[0]) if row else None


# -----------------------------
# Stats helpers
# -----------------------------
DAMAGE_CODES = {3, 4, 23, 29}
HEAL_CODES = {5, 28}


def datetime_from_sec(base: date, sec: int) -> datetime:
    return datetime.combine(base, time(0, 0, 0)) + timedelta(seconds=sec)


def duration_between_secs(start_sec: int, end_sec: int) -> int:
    if end_sec >= start_sec:
        return end_sec - start_sec
    return (86400 - start_sec) + end_sec


def sum_damage(events: Iterable[Event], start_sec: int, end_sec: int, boss_filter: str | None) -> Dict[str, int]:
    out: Dict[str, int] = {}
    boss_low = boss_filter.lower() if boss_filter else None

    for ev in events:
        if ev.ts_sec < start_sec or ev.ts_sec > end_sec:
            continue
        if ev.code in DAMAGE_CODES and ev.src_kind == "P" and ev.dst_kind == "N" and ev.src:
            if boss_low is not None and boss_low not in (ev.dst or "").lower():
                continue
            out[ev.src] = out.get(ev.src, 0) + max(0, int(ev.amount))
    return out


def sum_heal(events: Iterable[Event], start_sec: int, end_sec: int) -> Dict[str, int]:
    out: Dict[str, int] = {}
    for ev in events:
        if ev.ts_sec < start_sec or ev.ts_sec > end_sec:
            continue
        if ev.code in HEAL_CODES and ev.src_kind == "P" and ev.src:
            out[ev.src] = out.get(ev.src, 0) + max(0, int(ev.amount))
    return out


# -----------------------------
# Segments builder
# -----------------------------
@dataclass(frozen=True)
class RunSegment:
    boss_name: str
    start_sec: int
    end_sec: int
    boss_filter: str | None
    duration_total_s: int
    boss_duration_s: int | None


def _norm(s: str) -> str:
    return " ".join((s or "").strip().casefold().split())


def build_segments(fight: Fight) -> List[RunSegment]:
    """
    Règle générale:
      - Un segment = un "run" écrit en DB
      - On peut créer des segments par phase (ex: Isiel: Vengeur + Isiel)
    """
    total_dur = max(1, duration_between_secs(fight.start_sec, fight.end_sec))
    enc = _norm(fight.encounter)
    phases = fight.phases or []

    # Titan X: on stocke un run unique "Titan X"
    # On garde durationTotal = total du combat, et bossDuration = durée de la phase boss si trouvée.
    if enc == _norm("Titan X") and phases:
        boss_phase = next((p for p in phases if _norm(p.name) == _norm("Boss")), None) or phases[0]
        boss_dur = max(1, duration_between_secs(boss_phase.start_sec, boss_phase.end_sec))
        boss_name = (boss_phase.boss_name or fight.encounter or "Titan X")
        return [
            RunSegment(
                boss_name=boss_name,
                start_sec=fight.start_sec,
                end_sec=fight.end_sec,
                boss_filter=boss_name,          # ✅ boss-only par défaut
                duration_total_s=total_dur,
                boss_duration_s=boss_dur,
            )
        ]

    # Commandant Isiel: 2 segments (Vengeur phase + Isiel phase)
    if enc == _norm("Commandant Isiel") and phases:
        def is_phase(p: Phase, key: str) -> bool:
            pn = _norm(p.name)
            kk = _norm(key)
            return pn == kk or kk in pn

        vengeur = next((p for p in phases if is_phase(p, "Vengeur")), None)
        isiel = next((p for p in phases if is_phase(p, "Isiel")), None)

        segs: List[RunSegment] = []

        if vengeur:
            v_dur = max(1, duration_between_secs(vengeur.start_sec, vengeur.end_sec))
            v_name = (vengeur.boss_name or vengeur.name or "Vengeur")
            segs.append(
                RunSegment(
                    boss_name=v_name,
                    start_sec=vengeur.start_sec,
                    end_sec=vengeur.end_sec,
                    boss_filter=v_name,          # ✅ boss-only
                    duration_total_s=v_dur,
                    boss_duration_s=None,
                )
            )

        # Segment Isiel = run "Commandant Isiel" :
        # - bornes = combat total (pour l'unicité / visibilité)
        # - mais boss_duration_s = durée de la phase Isiel => utilisée pour les DPS/HPS
        is_name = (isiel.boss_name or isiel.name or fight.encounter or "Commandant Isiel") if isiel else (fight.encounter or "Commandant Isiel")
        is_dur = max(1, duration_between_secs(isiel.start_sec, isiel.end_sec)) if isiel else None

        segs.append(
            RunSegment(
                boss_name=is_name,
                start_sec=fight.start_sec,
                end_sec=fight.end_sec,
                boss_filter=is_name,              # ✅ IMPORTANT: sinon tu comptes les adds / autre
                duration_total_s=total_dur,
                boss_duration_s=is_dur,
            )
        )

        return segs

    # Par défaut: 1 segment, boss-only (filtre = encounter)
    return [
        RunSegment(
            boss_name=fight.encounter,
            start_sec=fight.start_sec,
            end_sec=fight.end_sec,
            boss_filter=fight.encounter,  # ✅ boss-only par défaut
            duration_total_s=total_dur,
            boss_duration_s=None,
        )
    ]


# -----------------------------
# Main import
# -----------------------------
def import_log_file(
    conn,
    log_path: Path,
    base_date: date,
    guild_id: int,
    uploader_id: int,
    dry_run: bool = False,
    group_label: str | None = None,
) -> None:
    with log_path.open("r", encoding="utf-8", errors="replace") as f:
        events = read_events(f)

    fights = extract_kills(events)
    if not fights:
        print("Aucun kill détecté, rien à importer.")
        return

    classes: Dict[str, str] = infer_player_classes(events) if infer_player_classes is not None else {}

    cur = conn.cursor()
    inserted, skipped = 0, 0
    seg_expected = 0

    for fight in fights:
        # roster = union(degats_total, heals_total)
        dmg_all = sum_damage(fight.events, fight.start_sec, fight.end_sec, None)
        heal_all = sum_heal(fight.events, fight.start_sec, fight.end_sec)
        roster = sorted(set(dmg_all.keys()) | set(heal_all.keys()), key=lambda s: s.casefold())
        group_id = ensure_group(cur, roster, label=group_label)

        segments = build_segments(fight)
        seg_expected += len(segments)

        for seg in segments:
            boss_id = ensure_boss(cur, seg.boss_name)

            started_at = datetime_from_sec(base_date, seg.start_sec)
            ended_at = datetime_from_sec(base_date, seg.end_sec)
            if ended_at < started_at:
                ended_at += timedelta(days=1)

            if run_exists(cur, boss_id, group_id, started_at, ended_at) is not None:
                skipped += 1
                continue

            # -----------------------------
            # Fenêtre de stats:
            # - par défaut = segment complet
            # - si boss_duration_s existe => on calcule sur la fenêtre boss (fin - boss_duration)
            # -----------------------------
            stats_start = seg.start_sec
            stats_end = seg.end_sec
            duration_s = int(max(1, seg.duration_total_s))

            if seg.boss_duration_s:
                duration_s = int(max(1, seg.boss_duration_s))
                # stats_end = fin du combat (ou fin de segment)
                stats_end = seg.end_sec
                # stats_start = stats_end - duration_s
                stats_start = max(seg.start_sec, seg.end_sec - duration_s)

            dmg_seg = sum_damage(fight.events, stats_start, stats_end, seg.boss_filter)
            heal_seg = sum_heal(fight.events, stats_start, stats_end)

            total_damage = int(sum(dmg_seg.values()))
            total_healing = int(sum(heal_seg.values()))
            dps_group = float(total_damage) / float(duration_s)
            hps_group = float(total_healing) / float(duration_s)

            if dry_run:
                print(
                    f"[DRY] boss='{seg.boss_name}' "
                    f"seg=[{started_at}->{ended_at}] durTotal={int(seg.duration_total_s)} "
                    f"stats=[{stats_start}->{stats_end}] durStats={duration_s} "
                    f"bossDur={seg.boss_duration_s} bossFilter={seg.boss_filter!r} roster={len(roster)} "
                    f"DMG={total_damage} DPS={dps_group:.1f}"
                )
                continue

            try:
                player_ids: Dict[str, int] = {}
                for p in roster:
                    p_class = classes.get(p, DEFAULT_CLASS)
                    player_ids[p] = ensure_player(cur, p, p_class)

                cur.execute(
                    """
                    INSERT INTO runs
                      (bossId, groupId, guildId, uploaderId,
                       startedAt, endedAt,
                       durationTotalS, bossDurationS,
                       totalDamage, totalHealing,
                       dpsGroup, hpsGroup, logFile)
                    VALUES
                      (%s, %s, %s, %s,
                       %s, %s,
                       %s, %s,
                       %s, %s,
                       %s, %s, %s)
                    """,
                    (
                        boss_id,
                        group_id,
                        int(guild_id),
                        int(uploader_id),
                        started_at,
                        ended_at,
                        int(seg.duration_total_s),
                        seg.boss_duration_s,
                        total_damage,
                        total_healing,
                        dps_group,
                        hps_group,
                        log_path.name,
                    ),
                )
                run_id = int(cur.lastrowid)

                for p in roster:
                    d = int(dmg_seg.get(p, 0))
                    h = int(heal_seg.get(p, 0))
                    dps = float(d) / float(duration_s)
                    hps = float(h) / float(duration_s)
                    cur.execute(
                        """
                        INSERT INTO run_players
                          (runId, playerId, damage, healing, dps, hps)
                        VALUES
                          (%s, %s, %s, %s, %s, %s)
                        """,
                        (run_id, player_ids[p], d, h, dps, hps),
                    )

                conn.commit()
                inserted += 1
            except Exception as e:
                conn.rollback()
                # Donne un maximum de contexte pour debug
                print("❌ Import failed for segment:", file=sys.stderr)
                print(
                    f"  boss={seg.boss_name!r} startedAt={started_at} endedAt={ended_at}\n"
                    f"  seg.start_sec={seg.start_sec} seg.end_sec={seg.end_sec}\n"
                    f"  seg.durationTotalS={seg.duration_total_s} seg.bossDurationS={seg.boss_duration_s}\n"
                    f"  stats_start={stats_start} stats_end={stats_end} duration_s={duration_s}\n"
                    f"  boss_filter={seg.boss_filter!r} logFile={log_path.name}\n"
                    f"  totals: damage={total_damage} healing={total_healing}\n"
                    f"  error: {type(e).__name__}: {e}",
                    file=sys.stderr,
                )
                raise

    cur.close()
    if dry_run:
        print(f"[DRY] Terminé. fights détectés={len(fights)} segments attendus={seg_expected}")
    else:
        print(f"Import terminé. runs insérées={inserted}, runs ignorées(déjà présentes)={skipped}.")


def main() -> int:
    ap = argparse.ArgumentParser(description="Import Rift logs -> MySQL (schema Prisma).")
    ap.add_argument("logfile", help="Chemin vers le fichier de log Rift")
    ap.add_argument("--env-file", default=".env", help="Chemin du .env")
    ap.add_argument("--date", default="", help="Date du log YYYY-MM-DD (sinon: aujourd'hui)")
    ap.add_argument("--group-label", default=None, help="Label optionnel pour le roster")
    ap.add_argument("--dry-run", action="store_true", help="Ne rien écrire en DB, affiche ce qui serait importé")
    ap.add_argument("--guild-id", required=True, type=int, help="guildId (BigInt Prisma)")
    ap.add_argument("--uploader-id", required=True, type=int, help="uploaderId (WebAccount.id BigInt)")

    args = ap.parse_args()

    load_dotenv(Path(args.env_file).expanduser())
    cfg = db_config_from_env()
    base = datetime.strptime(args.date, "%Y-%m-%d").date() if args.date else date.today()

    conn = connect_mysql(cfg)
    try:
        import_log_file(
            conn=conn,
            log_path=Path(args.logfile),
            base_date=base,
            guild_id=args.guild_id,
            uploader_id=args.uploader_id,
            dry_run=args.dry_run,
            group_label=args.group_label,
        )
    finally:
        conn.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
