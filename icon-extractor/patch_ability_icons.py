#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path

ENTRY_RE = re.compile(
    r"\{\s*key:\s*\"(?P<key>[^\"]+)\"\s*,\s*aliases:\s*\[(?P<aliases>.*?)\]\s*\}",
    re.DOTALL,
)
STRING_RE = re.compile(r"\"([^\"]*)\"")


def load_keys_from_ts(ts_text: str) -> set[str]:
    return set(re.findall(r'key:\s*"([^"]+)"', ts_text))


def patch_ts(ts_text: str, mapping: dict[str, list[str]]) -> tuple[str, dict]:
    total = 0
    updated = 0
    replaced_unknown = 0
    added_aliases_total = 0

    def repl(match: re.Match) -> str:
        nonlocal total, updated, replaced_unknown, added_aliases_total

        total += 1
        key = match.group("key")
        aliases_block = match.group("aliases")

        incoming = mapping.get(key)
        if not incoming:
            return match.group(0)

        # aliases existants (ordre conservé)
        existing_list = [m.group(1) for m in STRING_RE.finditer(aliases_block)]
        existing_list = [s for s in existing_list if s]
        existing_set = set(existing_list)

        # nettoie incoming, conserve ordre
        cleaned_incoming = []
        seen = set()
        for s in incoming:
            s = str(s).strip()
            if not s or s in seen:
                continue
            seen.add(s)
            cleaned_incoming.append(s)

        if not cleaned_incoming:
            return match.group(0)

        # Si uniquement Unknown, on remplace par incoming
        if existing_set == {"Unknown"} and len(existing_list) == 1:
            replaced_unknown += 1
            updated += 1
            new_aliases = ", ".join(json.dumps(s, ensure_ascii=False) for s in cleaned_incoming)
            return f'{{ key: "{key}", aliases: [{new_aliases}] }}'

        # Sinon: on AJOUTE sans supprimer (merge)
        add_count = 0
        for s in cleaned_incoming:
            if s not in existing_set:
                existing_list.append(s)
                existing_set.add(s)
                add_count += 1

        if add_count == 0:
            return match.group(0)

        added_aliases_total += add_count
        updated += 1
        new_aliases = ", ".join(json.dumps(s, ensure_ascii=False) for s in existing_list)
        return f'{{ key: "{key}", aliases: [{new_aliases}] }}'

    out = ENTRY_RE.sub(repl, ts_text)

    stats = {
        "entries_total": total,
        "entries_updated": updated,
        "unknown_replaced": replaced_unknown,
        "aliases_added_total": added_aliases_total,
        "unknown_left": len(re.findall(r'aliases:\s*\["Unknown"\]', out)),
    }
    return out, stats


def main():
    ap = argparse.ArgumentParser(description="Patch build-ability-icons.ts aliases from icon_to_*.json mapping")
    ap.add_argument("-t", "--ts", default="build-ability-icons.ts", help="Path to build-ability-icons.ts")
    ap.add_argument("-j", "--json", required=True, help="Path to mapping JSON (icon_key -> [aliases])")
    ap.add_argument("-o", "--out", default=None, help="Output TS path (default: overwrite input)")
    ap.add_argument("--no-backup", action="store_true", help="Disable .bak backup")
    args = ap.parse_args()

    ts_path = Path(args.ts)
    json_path = Path(args.json)
    out_path = Path(args.out) if args.out else ts_path

    if not ts_path.exists():
        raise SystemExit(f"Fichier introuvable: {ts_path}")
    if not json_path.exists():
        raise SystemExit(f"Fichier introuvable: {json_path}")

    ts_text = ts_path.read_text(encoding="utf-8")
    mapping = json.loads(json_path.read_text(encoding="utf-8"))

    if not isinstance(mapping, dict):
        raise SystemExit("JSON invalide: attendu un objet { icon_key: [aliases...] }")

    # backup
    if not args.no_backup and out_path == ts_path:
        bak = ts_path.with_suffix(ts_path.suffix + ".bak")
        bak.write_text(ts_text, encoding="utf-8")

    patched, stats = patch_ts(ts_text, mapping)
    out_path.write_text(patched, encoding="utf-8")

    # diagnostics: clés json non présentes dans TS
    ts_keys = load_keys_from_ts(ts_text)
    json_keys = set(mapping.keys())
    json_not_in_ts = sorted(json_keys - ts_keys)

    print("OK")
    print(f"TS input : {ts_path}")
    print(f"JSON map : {json_path}")
    print(f"TS output: {out_path}")
    print("--- Stats ---")
    print(f"Entrées traitées            : {stats['entries_total']}")
    print(f"Entrées modifiées           : {stats['entries_updated']}")
    print(f'Remplacements ["Unknown"]   : {stats["unknown_replaced"]}')
    print(f"Aliases ajoutés (total)     : {stats['aliases_added_total']}")
    print(f'Unknown restants            : {stats["unknown_left"]}')
    print(f"Clés JSON absentes du TS    : {len(json_not_in_ts)}")
    if len(json_not_in_ts) > 0:
        # affiche un petit échantillon
        print("Exemples clés JSON absentes :", ", ".join(json_not_in_ts[:15]))


if __name__ == "__main__":
    main()
