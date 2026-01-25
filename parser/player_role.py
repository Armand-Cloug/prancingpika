# parser/player_role.py
from __future__ import annotations

import os
from typing import Dict, Iterable, Set

from .types import Event
from .spell.role import ROLE_COMBOS, ROLE_PRIORITY
from .spell.spells import to_spell_key

Role = str
DEFAULT_ROLE: Role = "Unknown"

# Codes où un "spell" est réellement observable chez toi
DEFAULT_ACTION_CODES: set[int] = {
    1,              # début d'incantation (cast start)
    3, 4, 23, 29,   # dégâts (dont crit=23)
    5, 28,          # soins (dont crit=28)
    6, 7,           # buffs gagnés/perdus (utile si rôles via auras)
    8,              # effet appliqué ("est victime de ...") -> ex: Instigation
    32, 33,         # boucliers
}

# Debug via env (ne nécessite aucune modif ailleurs)
#   ROLE_DEBUG_PLAYER="Cloug" ROLE_DEBUG_LIMIT=200 python3 -m parser.main ...
_DEBUG_PLAYER = os.getenv("ROLE_DEBUG_PLAYER", "").strip() or None
try:
    _DEBUG_LIMIT = int(os.getenv("ROLE_DEBUG_LIMIT", "200"))
except ValueError:
    _DEBUG_LIMIT = 200


def spells_used_by_player(
    events: Iterable[Event],
    start_sec: int,
    end_sec: int,
    *,
    action_codes: Set[int] = DEFAULT_ACTION_CODES,
) -> Dict[str, Set[str]]:
    """
    Retourne {player: {spell_key}} sur la fenêtre [start_sec, end_sec].

    Debug (optionnel):
      - ROLE_DEBUG_PLAYER="Cloug" : affiche le mapping ability -> key pour ce joueur
      - ROLE_DEBUG_LIMIT="200"    : limite le nombre de lignes debug
    """
    out: Dict[str, Set[str]] = {}
    dbg_n = 0

    for e in events:
        if e.ts_sec < start_sec or e.ts_sec > end_sec:
            continue
        if e.code not in action_codes:
            continue
        if not e.src or not e.ability:
            continue

        key = to_spell_key(e.ability)  # "Tir instantané" -> "RFS" (si alias correctement défini)

        # DEBUG (sans changer les appels)
        if _DEBUG_PLAYER and e.src == _DEBUG_PLAYER and dbg_n < _DEBUG_LIMIT:
            if key is None:
                print(f"[ROLEDBG] UNMAPPED code={e.code} ability={e.ability!r}")
            else:
                print(f"[ROLEDBG] MAPPED   code={e.code} ability={e.ability!r} -> {key}")
            dbg_n += 1

        if not key:
            continue

        out.setdefault(e.src, set()).add(key)

    if _DEBUG_PLAYER:
        print(f"[ROLEDBG] {_DEBUG_PLAYER} unique_keys={sorted(out.get(_DEBUG_PLAYER, set()))}")

    return out


def _break_ties(roles: list[str]) -> Role:
    if len(roles) == 1:
        return roles[0]
    pr = {r: i for i, r in enumerate(ROLE_PRIORITY)}
    roles.sort(key=lambda r: pr.get(r, 10_000))
    return roles[0]


def choose_role(
    spells_seen: Set[str],
    *,
    exact_first: bool = True,
    allow_superset: bool = True,
) -> Role:
    if not spells_seen:
        return DEFAULT_ROLE

    # 1) match exact
    if exact_first:
        exact_roles: list[str] = []
        for role, combos in ROLE_COMBOS.items():
            for combo in combos:
                if spells_seen == set(combo):
                    exact_roles.append(role)
        if exact_roles:
            return _break_ties(exact_roles)

    # 2) match inclusion (si le joueur a AU MOINS les spells du combo)
    if allow_superset:
        candidates: list[tuple[str, frozenset[str]]] = []
        for role, combos in ROLE_COMBOS.items():
            for combo in combos:
                if set(combo).issubset(spells_seen):
                    candidates.append((role, combo))

        if not candidates:
            return DEFAULT_ROLE

        # le combo le plus spécifique (plus long) gagne
        max_len = max(len(combo) for _, combo in candidates)
        best_roles = [role for role, combo in candidates if len(combo) == max_len]
        return _break_ties(best_roles)

    return DEFAULT_ROLE


def infer_player_roles(
    events: Iterable[Event],
    start_sec: int,
    end_sec: int,
    *,
    action_codes: Set[int] = DEFAULT_ACTION_CODES,
    exact_first: bool = True,
    allow_superset: bool = True,
) -> Dict[str, Role]:
    spells_map = spells_used_by_player(events, start_sec, end_sec, action_codes=action_codes)
    return {
        player: choose_role(spells, exact_first=exact_first, allow_superset=allow_superset)
        for player, spells in spells_map.items()
    }