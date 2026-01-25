from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

from . import mage, cleric, war, rogue, prima

_MODULES = (mage, cleric, war, rogue, prima)

def collect_uppercase_vars(mods: Iterable[Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for m in mods:
        for name, val in vars(m).items():
            if name.isupper():          
                out[name] = val
    return out

SPELLS = collect_uppercase_vars(_MODULES)

def norm(s: str) -> str:
    return " ".join(s.strip().split()).casefold()

_ALIAS_TO_CANON: dict[str, str] = {}

for var_name, obj in SPELLS.items():
    if hasattr(obj, "aliases"):
        # inclure aussi obj.key si tu veux
        if hasattr(obj, "key"):
            _ALIAS_TO_CANON[norm(str(getattr(obj, "key")))] = var_name
        for a in getattr(obj, "aliases"):
            _ALIAS_TO_CANON[norm(str(a))] = var_name
    else:
        _ALIAS_TO_CANON[norm(str(obj))] = var_name

def to_spell_key(ability: str) -> str | None:
    return _ALIAS_TO_CANON.get(norm(ability))
