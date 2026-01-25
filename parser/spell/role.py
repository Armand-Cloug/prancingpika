# parser/spell/role.py
from __future__ import annotations

from .spells import SPELLS

# Un rôle peut avoir plusieurs combos
ROLE_COMBOS: dict[str, list[frozenset[str]]] = {

  # ROGUE : 

  "SlothFire": [
      frozenset({"RFS", "CS", "DS", "RZB", "TF"}),
  ],

  "Bofors": [
      frozenset({"RFS", "CS", "DS", "VIR"}),
  ],

  "BBQ": [
      frozenset({"RFS", "CS", "DS", "EB"}),
  ],

  "BofoTank": [
      frozenset({"RFS", "CS", "DS", "R_TAUNT"}),
  ],

  "Marksman": [
      frozenset({"RFS", "CS", "AF"}),
  ],

  "SpitFire": [
      frozenset({"RFS", "CS", "DS"}),
  ],

  "NightBlade": [
      frozenset({"BS", "DS"}),
  ],

  "TactBard": [
      frozenset({"CAD", "AP"}),
  ],

  # WAR :

  "RiftBlade-RV": [
      frozenset({"RB", "IB", "SD"}),
  ],

  "RiftBlade-TP": [
      frozenset({"RB", "IB", "JT"}),
  ],

  "LinkChanter": [
      frozenset({"ST", "BSO"}),
  ],

  "Liberator Tank": [
      frozenset({"ST", "PR", "W_TAUNT"}),
  ],

  "Tempest": [
      frozenset({"CP", "JT"}),
  ],

  "OneButton": [
      frozenset({"WW", "IB"}),
  ],
  
  "Liberator": [
      frozenset({"ST", "PR"}),
  ],

  "Reaver": [
      frozenset({"VS", "SD"}),
  ],

  "Warlord": [
      frozenset({"AQD"}),
  ],

  # PRIMA :

  "HotPot": [
      frozenset({"SS", "FB", "SCA"}),
  ],

  "EZ-Range": [
      frozenset({"SS", "FB", "APD"}),
  ],

  "VulcaLord": [
      frozenset({"SS", "FB", "US"}),
  ],

  "TankDPS": [
      frozenset({"SS", "FB", "P_TAUNT"}),
  ],

  "PseudoDPS": [
      frozenset({"SS", "FB", "TW"}),
  ],

  "PseudoTankHeal": [
    frozenset({"TW", "P_TAUNT", "SSH"}),
  ],

  "PseudoTank": [
      frozenset({"TW", "P_TAUNT"}),
  ],

  "PseudoRange": [
      frozenset({"CA", "TS"}),
  ],

  "PrimaHeal": [
      frozenset({"SSH"}),
  ],

  "OneButton": [
      frozenset({"CA"}),
  ],

  # MAGE :

  "MetaChont": [
      frozenset({"GS", "EF"}),
  ],

  "ChloroChont": [
      frozenset({"GS", "LS"}),
  ],

  "MachinGun": [
      frozenset({"EF", "FST"}),
  ],

  "ElemChloro": [
      frozenset({"EF", "LS"}),
  ],

  "TankHeal": [
      frozenset({"M_TAUNT", "LS"}),
  ],

  "HealTank": [
      frozenset({"M_TAUNT", "EF"}),
  ],

  "Pyromancer": [
      frozenset({"FST", "EF"}),
  ],

  "Harbinger": [
      frozenset({"VS"}),
  ],

  "Warlock": [
      frozenset({"SL"}),
  ],

  #CLERIC :

  "Frooty": [
    frozenset({"AM", "RE", "FES"}),
  ],

  "DefiTank": [
      frozenset({"AM", "IDD", "C_TAUNT"}),
  ],

  "Shamann": [
      frozenset({"ICV", "FES"}),
  ],

  "Inquisitor": [
      frozenset({"NR", "FES"}),
  ],

  "DefiHeal": [
      frozenset({"AM", "IDD"}),
  ],

  "Wardocle": [
      frozenset({"IDD", "IDS"}),
  ],

  # COMMONN : 

  "Tank": [
      frozenset({"CAD", "R_TAUNT"}),
      frozenset({"W_TAUNT"}),
      frozenset({"P_TAUNT"}),
      frozenset({"M_TAUNT"}),
      frozenset({"C_TAUNT"}),
  ],
}

ROLE_PRIORITY: list[str] = [
    # ROGUE
    "SlothFire",
    "Bofors",
    "BBQ",
    "BofoTank",
    "SpitFire",
    "Marksman",
    "NightBlade",
    "TactBard",

    # WAR
    "Liberator Tank",
    "Liberator",
    "RiftBlade-RV",
    "RiftBlade-TP",
    "Tempest",
    "Reaver",
    "Warlord",
    "LinkChanter",
    "OneButton",

    # PRIMA
    "HotPot",
    "EZ-Range",
    "VulcaLord",
    "TankDPS",
    "PseudoTankHeal",
    "PseudoTank",
    "PseudoDPS",
    "PseudoRange",
    "PrimaHeal",
    "OneButton",

    # MAGE
    "TankHeal",
    "HealTank",
    "MetaChont",
    "ChloroChont",
    "ElemChloro",
    "MachinGun",
    "Pyromancer",
    "Harbinger",
    "Warlock",

    # CLERIC
    "DefiTank",
    "DefiHeal",
    "Frooty",
    "Wardocle",
    "Shamann",
    "Inquisitor",

    # COMMUN
    "Tank",
]