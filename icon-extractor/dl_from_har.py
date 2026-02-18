#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import argparse
import json
import os
import re
import time
from pathlib import Path
from urllib.parse import urlparse, unquote

import requests

ICON_RX = re.compile(r"magelocdn\.com/images/rift/icons/(?P<size>\d+)/(?P<name>[^/?#]+)\.(?:png|jpg|jpeg|gif|webp)", re.I)

def uniq(seq):
    seen = set()
    out = []
    for x in seq:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out

def safe_name(url: str) -> str:
    p = urlparse(url)
    name = Path(unquote(p.path)).name
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name)
    return name or "download"

def normalize_size(url: str, size: int) -> str:
    # Remplace /icons/<size>/ par /icons/<wanted>/
    return re.sub(r"(/images/rift/icons/)\d+(/)", rf"\g<1>{size}\2", url)

def download(session: requests.Session, url: str, out_dir: Path, overwrite: bool, timeout: float, retries: int) -> bool:
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / safe_name(url)
    if target.exists() and not overwrite:
        return True

    last_err = None
    for attempt in range(1, retries + 1):
        try:
            with session.get(url, stream=True, timeout=timeout) as r:
                r.raise_for_status()
                tmp = target.with_suffix(target.suffix + ".part")
                with open(tmp, "wb") as f:
                    for chunk in r.iter_content(1024 * 128):
                        if chunk:
                            f.write(chunk)
                os.replace(tmp, target)
            return True
        except Exception as e:
            last_err = e
            time.sleep(min(2.0 * attempt, 5.0))

    print(f"[WARN] failed: {url} ({last_err})")
    return False

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--har", required=True, help="HAR file exported from the browser")
    ap.add_argument("--out", default="icons32", help="Output directory")
    ap.add_argument("--size", type=int, default=32, help="Normalize icon size (default 32)")
    ap.add_argument("--sleep", type=float, default=0.05, help="Delay between downloads")
    ap.add_argument("--timeout", type=float, default=20.0)
    ap.add_argument("--retries", type=int, default=3)
    ap.add_argument("--overwrite", action="store_true")
    args = ap.parse_args()

    har_path = Path(args.har)
    data = json.loads(har_path.read_text(encoding="utf-8", errors="ignore"))

    entries = data.get("log", {}).get("entries", [])
    urls = []
    for e in entries:
        req = e.get("request", {})
        url = req.get("url")
        if not url:
            continue
        if ICON_RX.search(url):
            urls.append(url)

    urls = uniq([normalize_size(u, args.size) for u in urls])
    if not urls:
        print("No icon URLs found in HAR.")
        return 2

    print(f"Found {len(urls)} icon URLs. Downloading to {Path(args.out).resolve()}")

    session = requests.Session()
    session.headers.update({"User-Agent": "har-icons-downloader/1.0"})

    ok = 0
    for i, url in enumerate(urls, 1):
        if download(session, url, Path(args.out), args.overwrite, args.timeout, args.retries):
            ok += 1
        if args.sleep:
            time.sleep(args.sleep)
        if i % 200 == 0 or i == len(urls):
            print(f"{i}/{len(urls)} (ok={ok})")

    print(f"Done: {ok}/{len(urls)}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
