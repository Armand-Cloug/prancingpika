# PrancingPika — Addon RIFT

## Installation

Copie le dossier `PrancingPika/` dans :
- **Windows** : `Documents\RIFT\AddOns\PrancingPika\`
- **Linux (Proton)** : `~/.steam/.../Documents/RIFT/AddOns/PrancingPika/`

Lance RIFT → l'addon charge automatiquement.

---

## Commandes

| Commande | Description |
|---|---|
| `/pp hello` | Message fun pour tester l'addon |
| `/pp export` | Ouvre la fenêtre d'export (texte copiable) |
| `/pp sync` | Rafraîchit le cache local des personnages |
| `/pp status` | Affiche l'état actuel |
| `/pp api` | Infos sur la connexion API |
| `/pp web` | Affiche l'URL du site |
| `/pp help` | Liste des commandes |

---

## Flow de liaison

```
1. En jeu → /pp export
2. Ctrl+A dans la fenêtre popup → Ctrl+C
3. Va sur https://prancingpika.cloug.fr/account
4. Colle dans le champ "RIFT Account"
5. Clique "Link my RIFT account"
6. ✅ Tes personnages apparaissent sur le site !
```

Pour re-synchroniser de nouveaux personnages plus tard, refais la même chose.
Le compte web reste verrouillé sur ton compte RIFT — seul l'admin peut délier.

---

## Structure des fichiers

```
PrancingPika/
├── PrancingPika.toc       ← Déclaration addon + SavedVariables
├── PrancingPika.lua       ← Point d'entrée + events
├── Lib/
│   └── Base64.lua         ← Encodeur base64 pur Lua
└── Core/
    ├── Data.lua            ← Gestion SavedVariables + sérialisation JSON
    ├── UI.lua              ← Fenêtre popup avec RiftTextfield
    └── Commands.lua        ← Handlers /pp
```
