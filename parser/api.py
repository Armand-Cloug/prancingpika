import os
import subprocess
from datetime import date as date_cls, datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()

WORKDIR = Path(os.getenv("PARSER_WORKDIR", "/workspace")).resolve()
COMBAT_DIR = Path(os.getenv("COMBATLOG_DIR", str(WORKDIR / "combat.log"))).resolve()

# .env qui contient DATABASE_URL (ou DB_* / MYSQL_*)
ENV_FILE = Path(os.getenv("PARSER_ENV_FILE", str(WORKDIR / "parser" / ".env"))).resolve()

# python executable (si besoin)
PYTHON_BIN = os.getenv("PARSER_PYTHON", "python3")

MAX_TIMEOUT_S = int(os.getenv("PARSER_TIMEOUT_S", "600"))  # 10 min par défaut


class ParseReq(BaseModel):
    fileName: str
    guildId: str | None = None
    uploaderAccountId: str | None = None
    # Recommandé : la date réelle du log (YYYY-MM-DD)
    date: str | None = Field(default=None, description="YYYY-MM-DD, sinon date du serveur")


@app.get("/health")
def health():
    return {
        "ok": True,
        "workdir": str(WORKDIR),
        "combat_dir": str(COMBAT_DIR),
        "env_file": str(ENV_FILE),
    }


def _safe_log_path(file_name: str) -> tuple[str, Path]:
    # Interdit les chemins (basic)
    cleaned = file_name.replace("/", "").replace("\\", "")
    if not cleaned.lower().endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt allowed")

    p = (COMBAT_DIR / cleaned).resolve()
    # Empêche traversal : le fichier doit rester dans COMBAT_DIR
    if COMBAT_DIR not in p.parents and p != COMBAT_DIR:
        raise HTTPException(status_code=400, detail="Invalid file path")

    if not p.exists():
        raise HTTPException(status_code=404, detail="File not found in combat.log")

    return cleaned, p


def _parse_int_str(name: str, v: str | None) -> int:
    if not v:
        raise HTTPException(status_code=400, detail=f"Missing {name}")
    try:
        # BigInt côté Prisma, int côté python CLI c'est OK
        return int(v)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {name}")


def _parse_date_str(v: str | None) -> str:
    if not v:
        return datetime.now().date().isoformat()
    try:
        # valide YYYY-MM-DD
        datetime.strptime(v, "%Y-%m-%d")
        return v
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format (expected YYYY-MM-DD)")


@app.post("/parse")
def parse(req: ParseReq):
    file_name, file_path = _safe_log_path(req.fileName)

    guild_id = _parse_int_str("guildId", req.guildId)
    uploader_id = _parse_int_str("uploaderAccountId", req.uploaderAccountId)
    date_str = _parse_date_str(req.date)

    # On passe un chemin relatif identique à ce que ton Node renvoie
    rel = str(Path("combat.log") / file_name)

    # Vérifications utiles
    if not WORKDIR.exists():
        raise HTTPException(status_code=500, detail="WORKDIR does not exist")
    if not ENV_FILE.exists():
        raise HTTPException(status_code=500, detail=f"ENV file not found: {ENV_FILE}")

    cmd = [
        PYTHON_BIN, "-m", "parser.import_runs",
        rel,
        "--env-file", str(ENV_FILE),
        "--date", date_str,
        "--guild-id", str(guild_id),
        "--uploader-id", str(uploader_id),
    ]

    try:
        p = subprocess.run(
            cmd,
            cwd=str(WORKDIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=MAX_TIMEOUT_S,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Parser timeout")

    return {
        "ok": p.returncode == 0,
        "code": p.returncode,
        "stdout_tail": p.stdout[-6000:],
        "stderr_tail": p.stderr[-6000:],
        "file": rel,
        "import": {
            "guildId": guild_id,
            "uploaderId": uploader_id,
            "date": date_str,
        },
    }
