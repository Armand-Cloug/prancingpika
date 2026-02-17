# parser/translate.py
from __future__ import annotations

import argparse
from pathlib import Path

# Remplacements simples EN -> FR (normalisation avant parsing)
_REPLACEMENTS: tuple[tuple[str, str], ...] = (
    # BOS
    ("Vindicator", "Vengeur"),
    ("Commander Isiel", "Commandant Isiel"),
    ("TitanX", "Titan X"),

    # IROTP
    ("General Silgen", "Général Silgen"),
    ("High Priest Arakhurn", "Grand-Prêtre Arakhurn"),

    # Council (noms EN -> FR)
    ("Marchioness Boldoch", "Marquise Boldoch"),
    ("Count Pluezhal", "Comte Pluezhal"),
    ("Danazhal's soul", "Âme de Danazhal"),
    ("Danazhal's Soul", "Âme de Danazhal"),
    ("Boldoch's soul", "Âme de Boldoch"),
    ("Boldoch's Soul", "Âme de Boldoch"),
    ("Pleuzhal's soul", "Âme de Pluezhal"),
    ("Pleuzhal's Soul", "Âme de Pluezhal"),
)


def translate_log_file(src_path: Path) -> Path:
    """
    Applique des remplacements de chaînes dans un fichier de log.

    - Écrit un fichier à côté de l'original avec suffixe ".translated"
      (ex: BOS.txt -> BOS.translated.txt)
    - Si aucun changement, renvoie src_path (ne crée pas de fichier)
    """
    src_path = Path(src_path)

    if not src_path.exists() or not src_path.is_file():
        raise FileNotFoundError(str(src_path))

    dst_path = src_path.with_name(src_path.stem + ".translated" + src_path.suffix)

    changed = False
    with src_path.open("r", encoding="utf-8", errors="replace") as r, dst_path.open(
        "w", encoding="utf-8", newline=""
    ) as w:
        for line in r:
            new_line = line
            for old, new in _REPLACEMENTS:
                if old in new_line:
                    new_line = new_line.replace(old, new)
            if new_line != line:
                changed = True
            w.write(new_line)

    if not changed:
        try:
            dst_path.unlink(missing_ok=True)
        except TypeError:
            if dst_path.exists():
                dst_path.unlink()
        return src_path

    return dst_path


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="python -m parser.translate")
    p.add_argument("path", help="Chemin vers le fichier log à traduire (ex: combat.log/BOS.txt)")
    args = p.parse_args(argv)

    src = Path(args.path)
    out = translate_log_file(src)

    if out == src:
        print(f"No changes needed: {src}")
    else:
        print(f"Translated file written: {out}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
