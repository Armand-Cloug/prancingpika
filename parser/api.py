import os
import subprocess
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()

WORKDIR = Path(os.getenv("PARSER_WORKDIR", "/workspace")).resolve()
COMBAT_DIR = Path(os.getenv("COMBATLOG_DIR", str(WORKDIR / "combat.log"))).resolve()

# Optionnel : uniquement si tu fournis un fichier env dans le conteneur
ENV_FILE_RAW = os.getenv("PARSER_ENV_FILE", "").strip()
ENV_FILE = Path(ENV_FILE_RAW).resolve() if ENV_FILE_RAW else None

PYTHON_BIN = os.getenv("PARSER_PYTHON", "python3")
MAX_TIMEOUT_S = int(os.getenv("PARSER_TIMEOUT_S", "600"))


class ParseReq(BaseModel):
    fileName: str
    guildId: str | None = None
    uploaderAccountId: str | None = None
    date: str | None = Field(default=None, description="YYYY-MM-DD, sinon date du serveur")
    dryRun: bool | None = False


@app.get("/health")
def health():
    return {
        "ok": True,
        "workdir": str(WORKDIR),
        "combat_dir": str(COMBAT_DIR),
        "env_file": str(ENV_FILE) if ENV_FILE else None,
        "timeout_s": MAX_TIMEOUT_S,
    }


def _safe_log_path(file_name: str) -> tuple[str, Path]:
    cleaned = (file_name or "").replace("/", "").replace("\\", "")
    if not cleaned.lower().endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt allowed")

    p = (COMBAT_DIR / cleaned).resolve()
    if COMBAT_DIR not in p.parents and p != COMBAT_DIR:
        raise HTTPException(status_code=400, detail="Invalid file path")

    if not p.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {p}")

    return cleaned, p


def _parse_int_str(name: str, v: str | None) -> int:
    if not v:
        raise HTTPException(status_code=400, detail=f"Missing {name}")
    try:
        return int(v)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {name}")


def _parse_date_str(v: str | None) -> str:
    if not v:
        return datetime.now().date().isoformat()
    try:
        datetime.strptime(v, "%Y-%m-%d")
        return v
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format (expected YYYY-MM-DD)")


def _stat_path(p: Path) -> dict:
    try:
        st = p.stat()
        return {
            "exists": True,
            "size": st.st_size,
            "mode": oct(st.st_mode),
            "uid": st.st_uid,
            "gid": st.st_gid,
        }
    except FileNotFoundError:
        return {"exists": False}
    except Exception as e:
        return {"exists": True, "stat_error": str(e)}


@app.post("/parse")
def parse(req: ParseReq):
    file_name, file_path = _safe_log_path(req.fileName)

    guild_id = _parse_int_str("guildId", req.guildId)
    uploader_id = _parse_int_str("uploaderAccountId", req.uploaderAccountId)
    date_str = _parse_date_str(req.date)

    if not WORKDIR.exists():
        raise HTTPException(status_code=500, detail=f"WORKDIR does not exist: {WORKDIR}")

    cmd = [
        PYTHON_BIN, "-m", "parser.import_runs",
        str(file_path),                 # IMPORTANT: path absolu (volume OK)
        "--date", date_str,
        "--guild-id", str(guild_id),
        "--uploader-id", str(uploader_id),
    ]

    if req.dryRun:
        cmd.append("--dry-run")

    # --env-file optionnel
    if ENV_FILE is not None:
        if not ENV_FILE.exists():
            raise HTTPException(status_code=500, detail=f"PARSER_ENV_FILE set but missing: {ENV_FILE}")
        cmd += ["--env-file", str(ENV_FILE)]

    debug = {
        "cwd": str(WORKDIR),
        "cmd": cmd,
        "combat_dir": str(COMBAT_DIR),
        "file_name": file_name,
        "file_path": str(file_path),
        "file_stat": _stat_path(file_path),
        "workdir_stat": _stat_path(WORKDIR),
        "combatdir_stat": _stat_path(COMBAT_DIR),
        "env_file": str(ENV_FILE) if ENV_FILE else None,
        "env": {
            # on expose juste ce qui sert au diag
            "DATABASE_URL_set": bool(os.getenv("DATABASE_URL")),
            "PARSER_WORKDIR": os.getenv("PARSER_WORKDIR"),
            "COMBATLOG_DIR": os.getenv("COMBATLOG_DIR"),
            "PARSER_ENV_FILE": os.getenv("PARSER_ENV_FILE"),
            "PARSER_TIMEOUT_S": os.getenv("PARSER_TIMEOUT_S"),
        },
        "proc": {"uid": os.getuid(), "gid": os.getgid()},
    }

    try:
        p = subprocess.run(
            cmd,
            cwd=str(WORKDIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=MAX_TIMEOUT_S,
            env=os.environ.copy(),  # IMPORTANT: garde DATABASE_URL docker
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail={"error": "Parser timeout", "debug": debug})

    payload = {
        "ok": p.returncode == 0,
        "code": p.returncode,
        "stdout_tail": (p.stdout or "")[-12000:],
        "stderr_tail": (p.stderr or "")[-12000:],
        "import": {
            "guildId": guild_id,
            "uploaderId": uploader_id,
            "date": date_str,
            "dryRun": bool(req.dryRun),
        },
        "debug": debug,
    }

    # Si tu préfères TOUJOURS 200, remplace ce bloc par: return payload
    if p.returncode != 0:
        raise HTTPException(status_code=422, detail=payload)

    return payload
