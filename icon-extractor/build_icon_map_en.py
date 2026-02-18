#!/usr/bin/env python3
import re
import json
import asyncio
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

BASE = "https://rift.magelo.com"
START = f"{BASE}/en/abilities.jspa"

ABILITY_ICONS_TS = Path("build-ability-icons.ts")  # adapte si besoin
OUT_JSON = Path("icon_to_en.json")
OUT_MISSING = Path("missing_icon_keys_en.txt")

# /en/abilities/2/Saigneur-des-Failles
SOUL_LINK_RE = re.compile(r"^/en/abilities/\d+/.+")
# /en/ability/1692245236/Aiguille-d-ombre
ABILITY_HREF_RE = re.compile(r"^/en/ability/\d+/")

ICON_KEY_RE = re.compile(r"/images/rift/icons/\d+/([^./?]+)\.(png|jpg|jpeg|webp)", re.IGNORECASE)

CONCURRENCY = 6  # ajuste selon ta machine / prudence
TIMEOUT_MS = 30000


def load_keys_from_ts(path: Path) -> set[str]:
    src = path.read_text(encoding="utf-8")
    return set(re.findall(r'key:\s*"([^"]+)"', src))


def extract_soul_links(html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    out = set()
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        if SOUL_LINK_RE.match(href):
            out.add(urljoin(BASE, href))
    return sorted(out)


def extract_pairs_from_rendered_soul(html: str) -> list[tuple[str, str]]:
    """
    Cible le format que tu montres :
    <tr>
      <td> ... style="background-image:url(.../icons/.../<icon>.jpg)" </td>
      <td><a href="/en/ability/...">Nom EN</a></td>
      ...
    </tr>
    """
    soup = BeautifulSoup(html, "html.parser")
    pairs: list[tuple[str, str]] = []

    # le tableau a souvent class="related" (comme sur ton screen)
    for tr in soup.select("table.related tbody tr"):
        a = tr.select_one('td:nth-of-type(2) a[href^="/en/ability/"]')
        if not a:
            # fallback si l'ordre change
            a = tr.select_one('a[href^="/en/ability/"]')
        if not a:
            continue

        name_en = a.get_text(" ", strip=True)
        if not name_en:
            continue

        # l'icône est dans le 1er td, dans un div avec style background-image
        icon_td = tr.select_one("td:nth-of-type(1)")
        if not icon_td:
            continue

        style_tags = icon_td.select("[style]")
        icon_key = None
        for tag in style_tags:
            style = tag.get("style", "")
            if "/images/rift/icons/" in style:
                m = ICON_KEY_RE.search(style)
                if m:
                    icon_key = m.group(1)
                    break

        if icon_key:
            pairs.append((icon_key, name_en))

    return pairs


async def get_page_content(page, url: str) -> str:
    await page.goto(url, wait_until="domcontentloaded", timeout=TIMEOUT_MS)
    # Important : attendre que le tableau soit réellement présent
    # (si Magelo injecte la table en JS, c'est ici que ça change tout)
    try:
        await page.wait_for_selector("table.related tbody tr", timeout=TIMEOUT_MS)
    except Exception:
        # fallback : parfois la table a un autre wrapper, on continue quand même
        pass
    return await page.content()


async def main():
    keys = load_keys_from_ts(ABILITY_ICONS_TS)
    print(f"Keys dans TS: {len(keys)}")

    icon_to_en: dict[str, list[str]] = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(locale="en-US")
        page = await context.new_page()

        # 1) Récupère la liste des âmes (page rendue)
        root_html = await get_page_content(page, START)
        soul_urls = extract_soul_links(root_html)
        print(f"Soul pages trouvées: {len(soul_urls)}")

        sem = asyncio.Semaphore(CONCURRENCY)

        async def process_soul(url: str):
            async with sem:
                p2 = await context.new_page()
                try:
                    html = await get_page_content(p2, url)
                    pairs = extract_pairs_from_rendered_soul(html)
                    if not pairs:
                        print(f"[NOPAIRS] {url}")
                        return
                    print(f"[PAIRS] {url} -> {len(pairs)} (ex: {pairs[0][0]} => {pairs[0][1]})")
                    for icon_key, name_en in pairs:
                        if icon_key not in keys:
                            continue
                        lst = icon_to_en.setdefault(icon_key, [])
                        if name_en not in lst:
                            lst.append(name_en)
                finally:
                    await p2.close()

        await asyncio.gather(*(process_soul(u) for u in soul_urls))

        await browser.close()

    OUT_JSON.write_text(json.dumps(icon_to_en, ensure_ascii=False, indent=2), encoding="utf-8")
    missing = sorted(k for k in keys if k not in icon_to_en)
    OUT_MISSING.write_text("\n".join(missing), encoding="utf-8")

    print("\n--- Résumé ---")
    print(f"icon_keys matchées: {len(icon_to_en)}")
    print(f"Missing: {len(missing)} -> {OUT_MISSING}")
    print(f"OK: {OUT_JSON}")


if __name__ == "__main__":
    asyncio.run(main())
