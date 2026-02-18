#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import argparse
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin

import requests

BASE = "https://rift.magelo.com"
CDN  = "https://www.magelocdn.com"

# Soul links from your snippet
SOUL_LINK_RX = re.compile(r'href=["\'](/fr/abilities/\d+/[^"\']+)["\']', re.IGNORECASE)

# Extract icon refs even when they are inside JS strings (without https://)
# Matches:
#   https://www.magelocdn.com/images/rift/icons/32/purge.jpg?v=15410
#   /images/rift/icons/32/purge.jpg?v=15410
#   images/rift/icons/32/purge.jpg?v=15410
ICON_REF_RX = re.compile(
    r"(?:https?://(?:www\.)?magelocdn\.com/)?/?images/rift/icons/(?P<size>\d+)/(?P<slug>[A-Za-z0-9._-]+)\.jpg\?v=(?P<v>\d+)",
    re.IGNORECASE,
)

def uniq(seq):
    seen = set()
    out = []
    for x in seq:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out

def fetch(session: requests.Session, url: str, timeout: float) -> str:
    r = session.get(url, timeout=timeout)
    r.raise_for_status()
    return r.text

def extract_soul_urls(text: str) -> list[str]:
    urls = [urljoin(BASE, p) for p in SOUL_LINK_RX.findall(text)]
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("http") and "/fr/abilities/" in line:
            urls.append(line)
        elif line.startswith("/fr/abilities/"):
            urls.append(urljoin(BASE, line))
    return uniq(urls)

def build_icon_url(slug: str, size: int, v: str) -> str:
    return f"{CDN}/images/rift/icons/{size}/{slug}.jpg?v={v}"

def download(session: requests.Session, url: str, out_dir: Path, overwrite: bool, timeout: float) -> bool:
    out_dir.mkdir(parents=True, exist_ok=True)
    fname = url.rsplit("/", 1)[-1].split("?", 1)[0]
    path = out_dir / fname
    if path.exists() and not overwrite:
        return True
    with session.get(url, stream=True, timeout=timeout) as r:
        r.raise_for_status()
        tmp = path.with_suffix(path.suffix + ".part")
        with open(tmp, "wb") as f:
            for chunk in r.iter_content(1024 * 128):
                if chunk:
                    f.write(chunk)
        os.replace(tmp, path)
    return True

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--html-file", help="File containing your <li><a href=\"/fr/abilities/...\"> snippet.")
    ap.add_argument("--soul-file", help="File with one soul URL/path per line.")
    ap.add_argument("--stdin", action="store_true", help="Read input from stdin too.")
    ap.add_argument("--size", type=int, default=32, help="Download icon size (default 32).")
    ap.add_argument("--out", default="icons32")
    ap.add_argument("--sleep", type=float, default=0.15)
    ap.add_argument("--timeout", type=float, default=20.0)
    ap.add_argument("--overwrite", action="store_true")
    ap.add_argument("--max-souls", type=int, default=0)
    args = ap.parse_args()

    parts = []
    if args.html_file:
        parts.append(Path(args.html_file).read_text(encoding="utf-8", errors="ignore"))
    if args.soul_file:
        parts.append(Path(args.soul_file).read_text(encoding="utf-8", errors="ignore"))
    if args.stdin:
        parts.append(sys.stdin.read())
    seed_text = "\n".join(parts).strip()
    if not seed_text:
        print("No input. Provide --html-file or --soul-file or --stdin.", file=sys.stderr)
        return 2

    soul_urls = extract_soul_urls(seed_text)
    if args.max_souls and args.max_souls > 0:
        soul_urls = soul_urls[: args.max_souls]
    if not soul_urls:
        print("No soul URLs found in input.", file=sys.stderr)
        return 3

    session = requests.Session()
    session.headers.update({"User-Agent": "magelo-icons-dl/1.1"})

    slugs: set[str] = set()
    versions: list[str] = []

    print(f"[1] Fetch {len(soul_urls)} soul pages")
    for i, soul_url in enumerate(soul_urls, 1):
        print(f"  [1.{i}/{len(soul_urls)}] {soul_url}")
        try:
            html = fetch(session, soul_url, args.timeout)
        except Exception as e:
            print(f"  [WARN] fetch failed: {e}", file=sys.stderr)
            continue

        for m in ICON_REF_RX.finditer(html):
            slugs.add(m.group("slug"))
            versions.append(m.group("v"))

        time.sleep(args.sleep)

    if not slugs:
        print("No icon references found in soul pages. Try printing a small HTML sample to confirm.", file=sys.stderr)
        return 4

    # choose most common version found (fallback to latest by sort)
    v = sorted(versions)[-1] if versions else "15410"

    icon_urls = [build_icon_url(s, args.size, v) for s in sorted(slugs)]
    out_dir = Path(args.out)

    print(f"[2] Found {len(icon_urls)} unique icon slugs. Downloading size={args.size} v={v} -> {out_dir.resolve()}")
    ok = 0
    for i, url in enumerate(icon_urls, 1):
        try:
            if download(session, url, out_dir, args.overwrite, args.timeout):
                ok += 1
        except Exception as e:
            print(f"[WARN] download failed: {url} ({e})", file=sys.stderr)
        if args.sleep:
            time.sleep(args.sleep)
        if i % 200 == 0 or i == len(icon_urls):
            print(f"  [2] {i}/{len(icon_urls)} processed (ok={ok})")

    print(f"Done. Downloaded {ok}/{len(icon_urls)}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
