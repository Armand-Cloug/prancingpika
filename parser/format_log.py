# parser/format_log.py
from __future__ import annotations

import re
import sys
from pathlib import Path

# Detailed format examples:
#   02/13/2026 19:55:09:557: ( ... ) ...
#   01/11/2026 20:41:16:823 Combat Begin
#
# Goal: output "classic" format:
#   19:55:09 ( ... ) ...
#   20:41:16 Combat Begin
#
# Notes:
# - We DO NOT keep ":" after the HH:MM:SS.
# - Lines already in classic HH:MM:SS ... are kept as-is.
# - Unknown lines are kept as-is.

DETAILED_TS_RE = re.compile(
    r"^(?P<date>\d{2}/\d{2}/\d{4})\s+"
    r"(?P<hms>\d{2}:\d{2}:\d{2})"
    r":(?P<ms>\d{3})"
    r"(?P<after_ms>:\s*)?"
    r"(?P<rest>.*)$"
)

CLASSIC_TS_RE = re.compile(r"^(?P<hms>\d{2}:\d{2}:\d{2})\s+.*$")


def _output_path_for(src: Path) -> Path:
    # "nomdebase"_converted.txt in the same directory, preserving extension.
    return src.with_name(f"{src.stem}_converted{src.suffix}")


def convert_line(line: str) -> str:
    s = line.rstrip("\n")

    # Already classic -> keep as-is
    if CLASSIC_TS_RE.match(s):
        return s + "\n"

    # Detailed -> classic
    m = DETAILED_TS_RE.match(s)
    if m:
        hms = m.group("hms")
        rest = (m.group("rest") or "").lstrip()

        # Important: do NOT add ":" after time.
        # If the rest begins with ":" (edge cases), remove it.
        if rest.startswith(":"):
            rest = rest.lstrip(":").lstrip()

        if rest:
            return f"{hms} {rest}\n"
        return f"{hms}\n"

    # Unknown -> keep
    return s + "\n"


def convert_file(src_path: Path) -> Path:
    if not src_path.exists():
        raise FileNotFoundError(f"Input file not found: {src_path}")

    dst_path = _output_path_for(src_path)

    with src_path.open("r", encoding="utf-8", errors="replace") as r, dst_path.open(
        "w", encoding="utf-8", errors="replace", newline="\n"
    ) as w:
        for line in r:
            w.write(convert_line(line))

    return dst_path


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print("Usage: python3 -m parser.format_log <path/to/log.txt>", file=sys.stderr)
        return 2

    src = Path(argv[0])
    try:
        dst = convert_file(src)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    # print output path
    print(str(dst))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
