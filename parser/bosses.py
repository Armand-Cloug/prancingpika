from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Optional

from parser.types import Fight, Phase


@dataclass(frozen=True)
class BossDef:
    name: str
    aliases: list[str]
    handler: Callable[[Fight], list[Phase]]
    exact_match: bool = False
    
    def matches(self, s: str) -> bool:
        s_low = s.lower()
        if self.name.lower() in s_low:
            return True
        for a in self.aliases:
            if a.lower() in s_low:
                return True
        return False


# Handlers
def _common_handler(fight: Fight) -> list[Phase]:
    # boss only == total (combat begin -> end)
    return [
        Phase(
            name="Boss",
            start_sec=fight.start_sec,
            end_sec=fight.end_sec,
            boss_name=fight.encounter,
        )
    ]


def _titanx_handler(fight: Fight) -> list[Phase]:
    from parser.encounters.titan_x import build_phases_titan_x
    return build_phases_titan_x(fight)


def _isiel_handler(fight: Fight) -> list[Phase]:
    from parser.encounters.isiel import build_phases_isiel
    return build_phases_isiel(fight)


def _tarjulia_kill_check(fight: Fight) -> bool:
    from parser.encounters.tarjulia import is_kill_tarjulia
    return is_kill_tarjulia(fight)

def _council_handler(fight: Fight) -> list[Phase]:
    from parser.encounters.council_destin import build_phases_council_destin
    return build_phases_council_destin(fight)


BOSS_DEFS: dict[str, BossDef] = {
    # IROTP
    "Ereandorn": BossDef("Ereandorn", aliases=[], handler=_common_handler),
    "Beruhast": BossDef("Beruhast", aliases=[], handler=_common_handler),
    "Général Silgen": BossDef("Général Silgen", aliases=["General Silgen"], handler=_common_handler),
    "Grand-Prêtre Arakhurn": BossDef("Grand-Prêtre Arakhurn", aliases=["High Priest Arakhurn"], handler=_common_handler),

    # TDNM
    "Beligosh": BossDef("Beligosh", aliases=[], handler=_common_handler),
    "Tarjulia": BossDef("Tarjulia", aliases=[], handler=_common_handler),
    "Le Concile du Destin": BossDef("Le Concile du Destin", aliases=["Countessa Danazhal", "Marquise Boldoch", "Comte Pluezhal"], handler=_council_handler, exact_match=True),
    "Malannon": BossDef("Malannon", aliases=[], handler=_common_handler),

    # BOS
    "Azranel": BossDef("Azranel", aliases=[], handler=_common_handler),
    "Commandant Isiel": BossDef("Commandant Isiel", aliases=["Isiel"], handler=_isiel_handler),
    "Titan X": BossDef("Titan X", aliases=["TitanX"], handler=_titanx_handler),
}


def build_phases_for_fight(fight: Fight) -> list[Phase]:
    boss_def = BOSS_DEFS.get(fight.encounter)
    if not boss_def:
        return _common_handler(fight)
    return boss_def.handler(fight)
