# PTPika Bot

Bot Discord pour la plateforme **Prancing Pika** — analyse de logs de combat RIFT. Il expose des slash commands pour consulter les stats des joueurs et envoie des notifications automatiques dans les channels configurés.

---

## Architecture

```
bot/
├── src/
│   ├── index.js            # Point d'entrée : démarre l'API HTTP et le client Discord
│   ├── api.js              # Serveur Express (port 8081) — healthcheck + webhook /notify
│   ├── discord.js          # Client Discord.js v14 — chargement et dispatch des commandes
│   ├── db.js               # Pool MySQL + toutes les requêtes (stats, runs, guildes)
│   ├── notifications.js    # Polling automatique + résumé hebdomadaire
│   └── commands/           # Un fichier = une slash command
├── .env                    # Variables d'environnement
└── package.json
```

## Fonctionnement

Au démarrage, le bot lance deux processus en parallèle :

1. **Serveur HTTP Express** sur le port `8081`
   - `GET /health` — healthcheck
   - `POST /notify` — webhook appelé par l'app web après un upload ; déclenche un poll immédiat sans attendre les 30 secondes

2. **Client Discord** (discord.js v14)
   - Charge dynamiquement tous les fichiers de `src/commands/`
   - Dispatch les interactions slash vers la commande correspondante
   - Au `ClientReady`, démarre le système de notifications si `DATABASE_URL` est défini

### Notifications automatiques

Le module `notifications.js` tourne en arrière-plan et gère trois types de messages :

| Déclencheur | Channel | Contenu |
|---|---|---|
| Nouveau run détecté (polling 30s) | `NOTIFY_CHANNEL_ID` | Embed : boss, durée, DPS/HPS groupe, top 5 joueurs |
| Record personnel battu | `RECORDS_CHANNEL_ID` | Message texte par joueur avec la nouvelle valeur DPS/HPS/APS |
| Record de guilde battu | `RECORDS_CHANNEL_ID` | Message texte avec le nouveau temps |
| Mercredi à 09h00 (cron) | `WEEKLY_CHANNEL_ID` | Embeds résumé hebdomadaire par boss |

L'état (dernier `run_id` traité) est persisté dans `data/state.json` pour survivre aux redémarrages.

---

## Slash commands

### Stats & Lookup

| Commande | Description |
|---|---|
| `/lookup <pseudo>` | Historique complet d'un joueur — meilleur score par boss |
| `/personalbest <pseudo> <boss>` | Meilleur score DPS/HPS/APS d'un joueur sur un boss précis |
| `/top <boss> [limit]` | Top DPS sur un boss toutes guildes confondues (défaut : 10, max : 25) |
| `/compare <pseudo1> <pseudo2> <boss>` | Comparaison côte à côte de deux joueurs sur un boss |

### Runs

| Commande | Description |
|---|---|
| `/lastrun` | Dernier run uploadé : boss, guilde, durée, stats groupe, top 5 |
| `/weeklysummary` | Résumé hebdomadaire manuel : top 3 par catégorie (DPS/HPS/APS) par boss |

### Admin (Owner du serveur ou porteur du rôle `ADMIN_ROLE_ID`)

| Commande | Description |
|---|---|
| `/deleterun <run_id>` | Supprime un run de la base de données |
| `/reparse <filename>` | Relance le parser Rust sur un fichier log existant via son API HTTP |
| `/changelog <title> <updates>` | Poste un embed changelog (séparer les entrées avec `\|`) |
| `/rules <title> <sections...>` | Poste un embed de règles multi-sections (jusqu'à 3 sections, séparer avec `\|`) |
| `/presentation <title> <sections...>` | Poste un embed de présentation multi-sections (jusqu'à 3 sections) |
| `/help` | Liste toutes les commandes disponibles |

Les commandes admin sont accessibles uniquement au **propriétaire du serveur Discord** ou aux membres portant le rôle dont l'ID est défini dans `ADMIN_ROLE_ID` (`.env`). La vérification est purement Discord-native, sans dépendance à la base de données.

---

## Configuration

Copier `.env` et remplir les valeurs :

```env
PORT=8081
DISCORD_TOKEN=          # Token du bot (Discord Developer Portal)
CLIENT_ID=              # ID de l'application Discord

# Optionnel — déploiement des commandes sur un seul serveur en dev
# GUILD_ID=

# Base de données (même instance que le parser Rust)
DATABASE_URL=mysql://user:password@host:3306/prancingpika

# URL du parser Rust (commande /reparse)
PARSER_URL=http://parser:3001

# ID du rôle Discord autorisé à utiliser les commandes admin
# (le propriétaire du serveur est toujours autorisé, quelle que soit cette valeur)
# En CI/CD : variable GitHub vars.BOT_ADMIN_ROLE_ID
ADMIN_ROLE_ID=          # ID numérique du rôle Discord (clic droit → Copier l'identifiant)

# IDs des channels Discord pour les notifications
NOTIFY_CHANNEL_ID=      # Nouveaux runs + records de guilde
RECORDS_CHANNEL_ID=     # Records personnels des joueurs
WEEKLY_CHANNEL_ID=      # Résumé hebdomadaire (fallback sur NOTIFY_CHANNEL_ID si absent)
```

> **CI/CD** — Les variables sont injectées depuis GitHub Actions. `ADMIN_ROLE_ID` correspond à la variable `BOT_ADMIN_ROLE_ID` (non-sensible → `vars`, pas `secrets`).

Si `DATABASE_URL` est absent, les notifications sont désactivées mais les commandes restent accessibles.
Si `DISCORD_TOKEN` est absent, le client Discord ne démarre pas (utile pour tester l'API seule).

---

## Démarrage

```bash
# Installer les dépendances
npm install

# Enregistrer les slash commands auprès de Discord
# (une seule fois, ou à chaque ajout de commande)
npm run deploy

# Lancer le bot
npm start
```

### Déploiement des commandes

```bash
# Déploiement sur un serveur spécifique (instantané, recommandé en dev)
GUILD_ID=123456789 npm run deploy

# Déploiement global (propagation jusqu'à 1h)
npm run deploy
```

---

## Dépendances principales

| Package | Rôle |
|---|---|
| `discord.js` v14 | Client Discord et constructeurs d'embeds |
| `express` | Serveur HTTP interne |
| `mysql2` | Connexion MariaDB/MySQL en pool |
| `node-cron` | Planification du résumé hebdomadaire |
| `dotenv` | Chargement du fichier `.env` |
