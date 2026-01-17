import os
import subprocess
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

WORKDIR = os.getenv("PARSER_WORKDIR", "/workspace")
COMBAT_DIR = os.getenv("COMBATLOG_DIR", os.path.join(WORKDIR, "combat.log"))

class ParseReq(BaseModel):
    fileName: str
    guildId: str | None = None
    uploaderAccountId: str | None = None

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/parse")
def parse(req: ParseReq):
    # basic path safety
    file_name = req.fileName.replace("/", "").replace("\\", "")
    if not file_name.lower().endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt allowed")

    file_path = os.path.join(COMBAT_DIR, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found in combat.log")

    # Command expected (relative path inside WORKDIR)
    rel = os.path.join("combat.log", file_name)

    try:
        p = subprocess.run(
            ["python3", "parser/main.py", rel],
            cwd=WORKDIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300,  # 5 min
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Parser timeout")

    return {
        "ok": p.returncode == 0,
        "code": p.returncode,
        "stdout_tail": p.stdout[-4000:],
        "stderr_tail": p.stderr[-4000:],
        "file": rel,
        "meta": {
            "guildId": req.guildId,
            "uploaderAccountId": req.uploaderAccountId,
        },
    }
