from __future__ import annotations

"""Détection de classe (calling) des joueurs Rift à partir des logs.

Objectif
--------
Associer un joueur à une classe (War / Rogue / Primalist / Cleric / Mage)
à partir de capacités *spécifiques à une classe*, repérées dans les logs.

On s'appuie sur des lignes comme :

  00:31:37: ( 6 , ... , Joueur , Joueur , 0 , ... , Inspirations profondes , 0 )
  Joueur acquiert la capacité Inspirations profondes de Joueur.

Le parser existant expose déjà :
- Event.code
- Event.src_kind / Event.src
- Event.ability

Ce module ne modifie pas le parsing : il ne fait que déduire une classe à partir
d'une table de correspondance "capacité -> classe".

Usage
-----
- Remplir ABILITY_TO_CLASS avec ~10 capacités par classe (en bas du fichier).
- Appeler infer_player_classes(events) pour obtenir un mapping joueur -> classe.

Si aucune capacité ne matche pour un joueur, la classe renvoyée est "Unknown"
(comme demandé).
"""

from collections import Counter, defaultdict
from typing import Dict, Iterable

from parser.types import Event

CLASSES = ("War", "Rogue", "Primalist", "Cleric", "Mage")
DEFAULT_CLASS = "Unknown"


def _norm(s: str) -> str:
    # Normalisation simple : casse + espaces
    return " ".join((s or "").strip().casefold().split())


# -----------------------------------------------------------------------------
# Capacité -> Classe
# -----------------------------------------------------------------------------

ABILITY_TO_CLASS: Dict[str, str] = {
    # Rogue
    #_norm(""): "Rogue",
    _norm("Mode gardien"): "Rogue",
    _norm("Maîtrise du combat à distance"): "Rogue",

    # War
    # _norm("..."): "War",
    _norm("Inspirations profondes"): "War",
    _norm("Retournement de lame"): "War",
    _norm("Néant"): "War",
    _norm("Posture prête"): "War",
    _norm("Conductivité améliorée"): "War",
    _norm("Lame-tempête"): "War",

    # Primalist
    # _norm("..."): "Primalist",
    _norm("Fontis de courroux"): "Primalist",
    _norm("Fontis de barbarie"): "Primalist",
    _norm("Fontis de sublimation"): "Primalist",
    _norm("Sauvagerie primitive"): "Primalist",
    _norm("Fontis d'oblitération"): "Primalist",
    _norm("Fontis de vitalité"): "Primalist",
    _norm("Fontis de soif de sang"): "Primalist",
    _norm("Fontis de rétribution"): "Primalist",
    _norm("Fontis de frénésie"): "Primalist",
    _norm("Destin en sursis"): "Primalist",
    _norm("Fontis de présence d'esprit"): "Primalist",

    # Cleric
    # _norm("..."): "Cleric",
    _norm("Bénédiction de vitalité"): "Cleric",
    _norm("Mine de souverain"): "Cleric",
    _norm("Armure de dévotion"): "Cleric",
    _norm("Armure du réveil"): "Cleric",
    _norm("Conduit de la Nature"): "Cleric",
    _norm("Vengeance du nord primitif"): "Cleric",
    _norm("Vengeance de la tempête hivernale"): "Cleric",
    _norm("Détermination héroïque"): "Cleric",
    _norm("Excès partagé"): "Cleric",

    # Mage
    # _norm("..."): "Mage",
    _norm("Rempart d'Archonte"): "Mage",
    _norm("Puissance de Neddra"): "Mage",
    _norm("Bienfait aqueux"): "Mage",
    _norm("Voile vivifiant"): "Mage",
    _norm("Armure prismatique"): "Mage",
    _norm("Charge foudroyante"): "Mage",
    _norm("Armure de Pyromancien"): "Mage",
    _norm("Voile des arcanes"): "Mage",
    _norm("Armure eldritch"): "Mage",
}


def infer_player_classes(events: Iterable[Event]) -> Dict[str, str]:
    """Retourne un mapping joueur -> classe.

    Stratégie :
    - on ne valide une classe que lorsqu'on voit un event "gain capacité" (code 6)
      dont le nom matche ABILITY_TO_CLASS.
    - si plusieurs classes matchent pour un même joueur (cas rare), on choisit
      la classe la plus fréquente (vote). En cas d'égalité, on renvoie Unknown.

    Notes :
    - on se base sur ev.src (le joueur qui acquiert)
    - on garde le code minimal et robuste, sans dépendre du texte "acquiert".
    """

    votes: dict[str, Counter[str]] = defaultdict(Counter)

    for ev in events:
        # Ligne "acquisition capacité" dans tes logs : code 6
        if ev.code != 6:
            continue
        if ev.src_kind != "P":
            continue
        if not ev.src:
            continue

        cls = ABILITY_TO_CLASS.get(_norm(ev.ability))
        if not cls:
            continue

        votes[ev.src][cls] += 1

    out: Dict[str, str] = {}

    for player, c in votes.items():
        if not c:
            out[player] = DEFAULT_CLASS
            continue

        most_common = c.most_common()
        if len(most_common) == 1:
            out[player] = most_common[0][0]
            continue

        # si égalité sur le max => Unknown
        top_cls, top_cnt = most_common[0]
        if any(cnt == top_cnt and cls != top_cls for cls, cnt in most_common[1:]):
            out[player] = DEFAULT_CLASS
        else:
            out[player] = top_cls

    return out
