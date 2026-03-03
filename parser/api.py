# api.py
import os
import subprocess
import logging
import traceback
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from parser.format_log import convert_file as format_log_file
from parser.translate import translate_log_file

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
log = logging.getLogger("parser-api")

app = FastAPI()

WORKDIR = Path(os.getenv("PARSER_WORKDIR", "/workspace")).resolve()
COMBAT_DIR = Path(os.getenv("COMBATLOG_DIR", str(WORKDIR / "combat.log"))).resolve()

ENV_FILE_RAW = os.getenv("PARSER_ENV_FILE", "").strip()
ENV_FILE = Path(ENV_FILE_RAW).resolve() if ENV_FILE_RAW else None

PYTHON_BIN = os.getenv("PARSER_PYTHON", "python3")
MAX_TIMEOUT_S = int(os.getenv("PARSER_TIMEOUT_S", "600"))


class ParseReq(BaseModel):
    fileName: str
    guildId: str
    uploaderAccountId: str
    date: Optional[str] = Field(default=None, description="YYYY-MM-DD; si absent => date serveur")


@app.get("/health")
def health():
    return {
        "ok": True,
        "workdir": str(WORKDIR),
        "combat_dir": str(COMBAT_DIR),
        "env_file": str(ENV_FILE) if ENV_FILE else None,
        "database_url_present": bool(os.getenv("DATABASE_URL")),
        "timeout_s": MAX_TIMEOUT_S,
    }


def _safe_log_path(file_name: str) -> tuple[str, Path]:
    cleaned = (file_name or "").replace("/", "").replace("\\", "")
    if not cleaned.lower().endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt allowed")

    p = (COMBAT_DIR / cleaned).resolve()

    if COMBAT_DIR not in p.parents:
        raise HTTPException(status_code=400, detail="Invalid file path")

    if not p.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {p}")

    return cleaned, p


def _parse_int(name: str, v: str) -> int:
    try:
        return int(v)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {name}: {v}")


def _parse_date(v: Optional[str]) -> str:
    if not v:
        return datetime.now().date().isoformat()
    try:
        datetime.strptime(v, "%Y-%m-%d")
        return v
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format (expected YYYY-MM-DD)")


@app.post("/parse")
def parse(req: ParseReq):
    try:
        file_name, file_path = _safe_log_path(req.fileName)
        guild_id = _parse_int("guildId", req.guildId)
        uploader_id = _parse_int("uploaderAccountId", req.uploaderAccountId)
        date_str = _parse_date(req.date)

        if not WORKDIR.exists():
            raise HTTPException(status_code=500, detail=f"WORKDIR does not exist: {WORKDIR}")

        if not os.getenv("DATABASE_URL"):
            raise HTTPException(
                status_code=500,
                detail="DATABASE_URL is missing in environment (Option A requires it).",
            )

        # 1) Normaliser le format de log (format détaillé -> format classique)
        formatted_path = format_log_file(file_path)

        # 2) Traduction EN -> FR avant parsing (sur le fichier formaté)
        translated_path = translate_log_file(formatted_path)

        logfile_arg = str(translated_path)

        cmd = [
            PYTHON_BIN,
            "-m",
            "parser.import_runs",
            logfile_arg,
            "--date",
            date_str,
            "--guild-id",
            str(guild_id),
            "--uploader-id",
            str(uploader_id),
        ]

        env_file_used = None
        if ENV_FILE is not None:
            if not ENV_FILE.exists():
                raise HTTPException(status_code=500, detail=f"PARSER_ENV_FILE set but file not found: {ENV_FILE}")
            cmd += ["--env-file", str(ENV_FILE)]
            env_file_used = str(ENV_FILE)

        log.info("Running import_runs: %s", " ".join(cmd))

        p = subprocess.run(
            cmd,
            cwd=str(WORKDIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=MAX_TIMEOUT_S,
        )

        stdout_tail = (p.stdout or "")[-12000:]
        stderr_tail = (p.stderr or "")[-12000:]

        return {
            "ok": p.returncode == 0,
            "code": p.returncode,
            "workdir": str(WORKDIR),
            "combat_dir": str(COMBAT_DIR),
            "fileName": file_name,
            "formatted_logfile": str(formatted_path),
            "translated_logfile": str(translated_path),
            "logfile": logfile_arg,
            "env_file_used": env_file_used,
            "import": {"guildId": guild_id, "uploaderId": uploader_id, "date": date_str},
            "stdout_tail": stdout_tail,
            "stderr_tail": stderr_tail,
        }

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail=f"Parser timeout after {MAX_TIMEOUT_S}s")

    except HTTPException:
        raise

    except Exception as e:
        tb = traceback.format_exc()[-12000:]
        log.exception("Unhandled error in /parse: %s", e)
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "trace_tail": tb,
                "workdir": str(WORKDIR),
                "combat_dir": str(COMBAT_DIR),
                "env_file": str(ENV_FILE) if ENV_FILE else None,
                "database_url_present": bool(os.getenv("DATABASE_URL")),
            },
        )