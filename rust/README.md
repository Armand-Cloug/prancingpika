# pika-parser

Parser de logs de combat Rift en Rust.  
Hybride **PrancingTurtle** (calculs, normalisation multilingue) + **PrancingPika** (stockage agrégé, détection de combats, rôles).

---

## Architecture

```
src/
├── types.rs          Tous les types partagés (ActionCode, CombatEvent, Fight, Phase…)
├── event_reader.rs   Parsing brut des lignes de log (ProcessLine de PT)
├── fight_extractor.rs Détection des kills de boss (Combat Begin/End + kills)
├── bosses/           BossDef + handlers par boss complexe
│   ├── mod.rs        BOSS_DEFS, match_boss_name, display_name
│   ├── titan_x.rs
│   ├── isiel.rs
│   └── council.rs
├── stats.rs          sum_damage, sum_heal, sum_absorbed, sum_player_deaths
├── abilities.rs      AbilityStats, collect_by_ability, to_lines
├── player_class.rs   Détection de classe (code 6 + table ability→class)
├── player_role.rs    Détection de rôle (ROLE_COMBOS matching)
├── segments.rs       RunSegment, build_segments (Titan X, Isiel…)
├── output.rs         Rendu terminal
├── db/
│   ├── config.rs     DbConfig depuis .env
│   ├── ensure.rs     ensure_boss, ensure_group, ensure_player, ensure_ability
│   └── import.rs     import_log_file (logique principale d'import)
└── api/
    ├── mod.rs        serve()
    ├── routes.rs     Router Axum
    ├── handlers.rs   Tous les handlers HTTP
    └── models.rs     Types de réponse JSON
```

---

## Philosophie (héritage PrancingTurtle)

- **Langue-neutre** : une seule couche de normalisation EN ENTRÉE (`ProcessSpecial`)  
  → FR `"absorbé"`, DE `"absorbiert"`, EN `"absorbed"` → `ABSORBED` → `event.absorbed = N`
- **`ability_id`** (field[8] du tuple) = clé canonique d'un sort, jamais le nom
- **`overkill > 0`** = mort d'une entité (universel, pas de regex sur le texte)
- **`TotalDamage`** = `amount + absorbed + blocked + ignored` (intercepted exclu intentionnellement)
- **`CombatStarted`** = basé sur codes numériques + `src_kind/dst_kind` uniquement
- **`DisplayName`** normalisé : tous les noms FR/DE → anglais canonique

---

## Installation

```bash
# 1. Prérequis
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update stable

# 2. Clone et build
git clone <repo>
cd pika-parser
cargo build --release

# 3. Configuration DB
cp .env.example .env
# Éditer .env avec vos credentials MySQL

# 4. Migration DB
mysql -u user -p database < prisma/migrations/0001_initial/migration.sql
# ou via Prisma :
# cd app && npx prisma migrate deploy
```

---

## CLI — Commandes

### `parse` — Analyse et affichage terminal (sans DB)

```bash
# Afficher tous les kills du fichier
./target/release/pika-parser parse combat.log

# Afficher le breakdown par ability
./target/release/pika-parser parse combat.log --abilities

# Afficher uniquement le kill #2
./target/release/pika-parser parse combat.log --fight 2

# Avec un .env custom
./target/release/pika-parser --env-file /path/to/.env parse combat.log
```

Exemple de sortie :
```
🔍 Parsing de combat.log …

Fichier parsé : 3 fight(s) détecté(s)

  Kill #01 │ Azranel                         │ 20:14:33 → 20:19:47 │ 05:14
  Kill #02 │ Commandant Isiel                │ 20:25:01 → 20:31:22 │ 06:21
  Kill #03 │ Titan X                         │ 20:45:00 → 20:52:18 │ 07:18

════════════════════════════════════════════════════════════════════════════════
Kill #01  │  Azranel  │  20:14:33 → 20:19:47  │  Durée: 05:14
════════════════════════════════════════════════════════════════════════════════
  DPS groupe: 1 245 320  │  HPS groupe: 312 000  │  APS groupe: 45 200
────────────────────────────────────────────────────────────────────────────────
 Joueur                       Classe       Rôle           Dégâts       DPS  ...
────────────────────────────────────────────────────────────────────────────────
 Cloug                        Warrior      DPS         485 230 000  1545320  ...
```

### `inspect` — Liste rapide des fights (sans stats)

```bash
./target/release/pika-parser inspect combat.log
```

### `import` — Parser et insérer en DB

```bash
# Import complet
./target/release/pika-parser import combat.log \
  --guild-id 1 \
  --uploader-id 42 \
  --date 2026-03-15

# Dry-run (affiche ce qui serait importé sans écrire)
./target/release/pika-parser import combat.log \
  --guild-id 1 \
  --uploader-id 42 \
  --dry-run

# Sans le détail des abilities (plus rapide pour les gros fichiers)
./target/release/pika-parser import combat.log \
  --guild-id 1 \
  --uploader-id 42 \
  --skip-abilities

# Avec un label de groupe
./target/release/pika-parser import combat.log \
  --guild-id 1 \
  --uploader-id 42 \
  --label "Raid de progression - Mardi"
```

### `serve` — Serveur HTTP API

```bash
# Port par défaut 3001
./target/release/pika-parser serve

# Port custom
./target/release/pika-parser serve --port 8080

# Adresse custom
./target/release/pika-parser serve --host 127.0.0.1 --port 3001
```

---

## API HTTP

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Santé du service |
| `POST` | `/api/upload?guild_id=&uploader_id=` | Upload et import d'un log |
| `POST` | `/api/parse-preview` | Parse un log, retourne l'analyse en texte |
| `GET` | `/api/bosses` | Liste des boss avec des runs |
| `GET` | `/api/leaderboard/:boss_id` | Meilleur DPS par joueur pour un boss |
| `GET` | `/api/fastest/:boss_id` | Meilleurs temps de kill |
| `GET` | `/api/top-players/:boss_id` | Top joueurs par classe/rôle |
| `GET` | `/api/run/:run_id` | Détail complet d'un run |
| `GET` | `/api/run/:run_id/player/:name/abilities` | Breakdown par ability |
| `GET` | `/api/recent?limit=20` | Derniers runs uploadés |
| `GET` | `/api/player/:name` | Historique d'un joueur |

### Query params communs

- `role=DPS|Healer|Tank|Support`
- `class=Warrior|Mage|Rogue|Cleric|Primalist`
- `limit=50`

### Upload depuis le frontend Next.js

```typescript
// Équivalent de l'upload Python actuel
const res = await fetch(
  `${PARSER_URL}/api/upload?guild_id=${guildId}&uploader_id=${uploaderId}&date=${date}`,
  {
    method: 'POST',
    body: logFileContent, // string brut du fichier .log
  }
);
const data = await res.json();
// { ok: true, fights_detected: 3, runs_inserted: 3, runs_skipped: 0 }
```

---

## Variables d'environnement

| Variable | Description | Défaut |
|---|---|---|
| `DATABASE_URL` | URL MySQL complète | — |
| `DB_HOST` | Hôte MySQL | `127.0.0.1` |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_USER` | Utilisateur MySQL | — |
| `DB_PASSWORD` | Mot de passe MySQL | — |
| `DB_NAME` | Nom de la base | — |
