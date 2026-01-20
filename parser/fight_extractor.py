# parser/fight_extractor.py
from __future__ import annotations

import re
import sys
from collections import deque
from typing import Optional

from .types import Event, Fight
from .bosses import build_phases_for_fight
from .boss_match import match_boss_name, boss_involved

DEATH_RE = re.compile(r"est\s+mort", re.IGNORECASE)        # "X est mort(e)."
KILL_RE = re.compile(r"\ba\s+tu[ée]\b", re.IGNORECASE)     # "A a tué B"

# Uniquement des mots typiques de lignes de dégâts/soins (réduit fortement les faux positifs)
COMBAT_WORD_RE = re.compile(
    r"(inflige|dég[âa]ts?|damage|touche|frappe|attaque|crit|critique|soigne|heal)",
    re.IGNORECASE,
)
HAS_NUMBER_RE = re.compile(r"\b\d+\b")


def extract_kills(events: list[Event]) -> list[Fight]:
    """
    Kill "commun" :
      - code 11 ou texte "a tué" => dst est mort
      - code 12 + "est mort" => src est mort
      - on ne compte que si l'entité morte est un boss

    IMPORTANT :
    - Combat Begin/End peut être local (mort/phase/aggro) => ne doit PAS reset un boss fight
      si Begin suit un End de près (stitch).

    FIX "ligne parasite" (ex: Général Silgen) :
    - un code 12 "Boss est mort" peut apparaître trop tôt.
    - on ne finalise PAS immédiatement un kill sur code 12.
      => pending + confirmation plus tard si le boss ne réapparaît plus en combat
         ou si un code 11 arrive (prioritaire).

    REGLE "NE PAS COMPTER" (sans remonter le start) :
    - Au moment d'un boss kill (code 11 / "a tué"), on regarde s'il y a eu des
      interactions *réellement combat* avec CE boss dans les 3 secondes AVANT le Combat Begin.
    - Si oui => on NE COMPTE PAS ce kill, et on jette le pull courant.
    - On log explicitement la raison sur stderr.
    """

    fights: list[Fight] = []
    current_start: Optional[Event] = None
    current_events: list[Event] = []
    kill_idx = 0

    last_combat_end: Optional[Event] = None
    last_boss_seen_sec: Optional[int] = None

    # Stitch/rejoin
    REJOIN_GAP_SEC = 90
    BOSS_RECENT_SEC = 180

    # Anti-parasite code 12
    CONFIRM_DEATH_AFTER_SEC = 6
    pending_dead_boss: Optional[str] = None
    pending_dead_event: Optional[Event] = None
    pending_invalidated: bool = False

    # Lookback global (avant Begin)
    LOOKBACK_BEFORE_BEGIN_SEC = 3
    GLOBAL_BUFFER_SEC = 12  # >= LOOKBACK_BEFORE_BEGIN_SEC
    MIN_COMBATLIKE_INTERACTIONS = 2  # comme ton exemple (2 interactions dans la fenêtre)

    recent_events: deque[Event] = deque()

    # --- SPECIAL: Council of Fate tracking ---
    council_dead: set[str] = set()

    COUNCIL_KEY = "Le Concile du Destin"
    COUNCIL_MEMBERS = {
        "countessa danazhal",
        "marquise boldoch",
        "comte pluezhal",
    }

    def _is_council_member(name: str) -> bool:
        return (name or "").strip().casefold() in COUNCIL_MEMBERS
    # --- END SPECIAL ---


    def _clear_pending() -> None:
        nonlocal pending_dead_boss, pending_dead_event, pending_invalidated
        pending_dead_boss = None
        pending_dead_event = None
        pending_invalidated = False

    def _reset_to_new_pull(begin_ev: Event) -> None:
        nonlocal current_start, current_events, last_combat_end, last_boss_seen_sec
        current_start = begin_ev
        current_events = []
        last_combat_end = None
        last_boss_seen_sec = None
        council_dead.clear()
        _clear_pending()

    def _discard_current_fight() -> None:
        """Jette le fight courant sans le compter."""
        nonlocal current_start, current_events, last_combat_end, last_boss_seen_sec
        current_start = None
        current_events = []
        last_combat_end = None
        last_boss_seen_sec = None
        council_dead.clear()
        _clear_pending()

    def _note_boss_seen(ev: Event) -> None:
        nonlocal last_boss_seen_sec
        if match_boss_name(ev.src) or match_boss_name(ev.dst):
            last_boss_seen_sec = ev.ts_sec

    def _finalize(encounter: str, end_ev: Event) -> None:
        nonlocal kill_idx, current_start, current_events
        if current_start is None:
            return

        kill_idx += 1
        fight = Fight(
            encounter=encounter,
            kill_index=kill_idx,
            start_sec=current_start.ts_sec,
            end_sec=end_ev.ts_sec,
            start_ts=current_start.ts_str,
            end_ts=end_ev.ts_str,
            events=current_events.copy(),
        )
        fight.phases = build_phases_for_fight(fight)
        fights.append(fight)

        _discard_current_fight()

    def _maybe_confirm_pending(now_ev: Event) -> None:
        if current_start is None or not pending_dead_boss or not pending_dead_event:
            return
        if pending_invalidated:
            return
        if now_ev.ts_sec - pending_dead_event.ts_sec >= CONFIRM_DEATH_AFTER_SEC:
            _finalize(pending_dead_boss, pending_dead_event)

    def _trim_recent(now_ts: int) -> None:
        cutoff = now_ts - GLOBAL_BUFFER_SEC
        while recent_events and recent_events[0].ts_sec < cutoff:
            recent_events.popleft()

    def _is_combatlike_boss_interaction(e: Event, boss_key: str) -> bool:
        """
        Détecte une interaction "combat" avant Begin, mais de manière stricte :
        - le boss est impliqué
        - ce n'est pas un event structurel (Begin/End/Kill/Death)
        - raw contient un mot de combat ET un nombre (typique dégâts/soins)
        - l'autre entité n'est pas un boss (évite boss<->boss / scripts)
        """
        if not boss_involved(e, boss_key):
            return False

        if e.code in (0, 11, 12):
            return False
        if getattr(e, "ability", None) in ("Combat Begin", "Combat End"):
            return False

        other = e.dst if match_boss_name(e.src) else e.src
        if match_boss_name(other):
            return False

        raw = (getattr(e, "raw", None) or "")
        if not COMBAT_WORD_RE.search(raw):
            return False
        if not HAS_NUMBER_RE.search(raw):
            return False

        return True

    def _count_boss_interactions_before_begin(boss_key: str) -> int:
        """
        Compte les interactions combat-like dans la fenêtre :
          [begin - LOOKBACK_BEFORE_BEGIN_SEC ; begin)
        """
        if current_start is None:
            return 0

        begin_ts = current_start.ts_sec
        window_start = begin_ts - LOOKBACK_BEFORE_BEGIN_SEC
        cnt = 0

        for e in reversed(recent_events):
            if e.ts_sec >= begin_ts:
                continue
            if e.ts_sec < window_start:
                break
            if _is_combatlike_boss_interaction(e, boss_key):
                cnt += 1
                if cnt >= MIN_COMBATLIKE_INTERACTIONS:
                    return cnt
        return cnt

    def _log_skip(boss_key: str, kill_ev: Event, interactions: int) -> None:
        begin_ts = current_start.ts_str if current_start else "?"
        msg = (
            f"[fight_extractor] Boss '{boss_key}' détecté (kill {kill_ev.ts_str}) mais NON compté: "
            f"Combat Begin trop tardif ({interactions} interaction(s) 'combat-like' "
            f"dans les {LOOKBACK_BEFORE_BEGIN_SEC}s avant Begin {begin_ts})."
        )
        print(msg, file=sys.stderr)

    for ev in events:
        # Buffer global
        recent_events.append(ev)
        _trim_recent(ev.ts_sec)

        _maybe_confirm_pending(ev)

        # Combat Begin
        if ev.code == 0 and ev.ability == "Combat Begin":
            if current_start is None:
                _reset_to_new_pull(ev)
                continue

            # Begin alors qu'un combat est ouvert : rejoin ou nouveau pull
            if last_combat_end is not None:
                gap = ev.ts_sec - last_combat_end.ts_sec
                boss_recent = (
                    last_boss_seen_sec is not None
                    and (ev.ts_sec - last_boss_seen_sec) <= BOSS_RECENT_SEC
                )
                if gap <= REJOIN_GAP_SEC and boss_recent:
                    current_events.append(ev)
                    last_combat_end = None
                    continue

            _reset_to_new_pull(ev)
            continue

        # Hors combat
        if current_start is None:
            continue

        current_events.append(ev)
        _note_boss_seen(ev)

        # Combat End
        if ev.code == 0 and ev.ability == "Combat End":
            last_combat_end = ev
            continue

        # Invalidation pending si le boss réapparait après la "mort"
        if pending_dead_boss and pending_dead_event and ev.ts_sec > pending_dead_event.ts_sec:
            if boss_involved(ev, pending_dead_boss):
                pending_invalidated = True

        # Détection kill boss
        died: Optional[str] = None
        is_kill_line = (ev.code == 11) or bool(KILL_RE.search(ev.raw))
        is_death_line = (ev.code == 12) and bool(DEATH_RE.search(ev.raw))

        if is_kill_line:
            died = ev.dst
        elif is_death_line:
            died = ev.src

        if not died:
            continue

        boss_key = match_boss_name(died)
        if not boss_key:
            continue

        # --- SPECIAL: Council of Fate ---
        # Do NOT finalize on souls/adds, and finalize only when the 3 council members are dead.
        if boss_key == COUNCIL_KEY:
            if not _is_council_member(died):
                # ignore souls / other adds
                continue

            council_dead.add((died or "").strip().casefold())
            if len(council_dead) < 3:
                continue

            # Apply the usual "do not count" rule only on the real end (3rd death).
            if is_kill_line:
                interactions = _count_boss_interactions_before_begin(boss_key)
                if interactions >= MIN_COMBATLIKE_INTERACTIONS:
                    _log_skip(boss_key, ev, interactions)
                    _discard_current_fight()
                    continue

            _finalize(boss_key, ev)
            continue
        # --- END SPECIAL ---

        # Kill => appliquer la règle "ne pas compter" si interactions avant Begin
        if is_kill_line:
            interactions = _count_boss_interactions_before_begin(boss_key)
            if interactions >= MIN_COMBATLIKE_INTERACTIONS:
                _log_skip(boss_key, ev, interactions)
                _discard_current_fight()
                continue

            _finalize(boss_key, ev)
            continue

        # Mort "est mort" => pending confirm
        pending_dead_boss = boss_key
        pending_dead_event = ev
        pending_invalidated = False

    # Fin : confirmer pending si encore valide
    if current_start is not None and pending_dead_boss and pending_dead_event and not pending_invalidated:
        _finalize(pending_dead_boss, pending_dead_event)

    return fights
