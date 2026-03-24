# ⚡ Prancing Pika

---

## 🇫🇷 Présentation (Français)

**Prancing Pika** est une plateforme communautaire avancée dédiée à l'analyse, à l'indexation et à la visualisation des logs de combat du MMORPG **RIFT**.

Le projet fournit un outil fiable et précis permettant aux joueurs et guildes d'exploiter leurs performances PvE à partir des fichiers `combat.log`. Il combine un **parser Rust haute performance**, une **base de données relationnelle optimisée**, une **interface web moderne** développée avec Next.js, et un **bot Discord** intégré.

Prancing Pika met l'accent sur la précision des calculs (DPS, HPS, durée réelle des combats), la gestion correcte des encounters complexes (multi-boss, multi-phases) et la lisibilité des résultats.

---

### 🎯 Objectifs du projet

* Parser automatiquement et de manière fiable les **logs de combat RIFT**
* Identifier précisément :

  * Boss et encounters
  * Phases (ex : Concile du Destin, transitions)
  * Joueurs, classes et rôles
* Calculer des métriques avancées :

  * DPS / HPS individuels et de groupe
  * Durée effective des combats (hors downtime)
  * Performance par joueur, classe et boss
* Centraliser et historiser les runs
* Proposer une **interface web performante et cohérente**
* Offrir une **intégration Discord** native pour la communauté
* Bâtir une base technique solide pour une plateforme communautaire évolutive

---

### 🧱 Architecture détaillée

Le projet repose sur **quatre composants fortement découplés**.

```
prancingpika/
├── app/          # Frontend Next.js 16
├── rust/         # Parser & API HTTP (pika-parser)
├── bot/          # Bot Discord Node.js
└── docker-compose.yml
```

#### 1️⃣ Parser – Rust (`pika-parser`)

Le parser constitue le cœur technique du projet.

* Analyse ligne par ligne des fichiers `combat.log`
* Modélisation stricte des événements (dégâts, soins, buffs, debuffs)
* Détection automatique :

  * Début / fin de combat
  * Boss actifs (matching exact, insensible à la casse)
  * Phases successives ou simultanées
* Gestion des encounters complexes :

  * Multi-boss
  * Phases discontinues
  * Temps morts entre phases
* Calculs basés exclusivement sur les timestamps réels
* Normalisation des classes et des rôles
* Import structuré et sécurisé en base de données
* **Anticheat** : vérification des patterns suspects avant import
* Exposition d'une **API HTTP** (Axum, port 8080) consommée par le frontend

Commandes CLI disponibles :

```bash
cargo run -- parse <fichier>          # Analyse sèche, sortie terminal
cargo run -- inspect <fichier>        # Liste rapide des combats détectés
cargo run -- import <fichier> -g <guild_id> -u <uploader_id>  # Import en DB
cargo run -- serve                    # Démarre le serveur HTTP (port 8080)
```

#### 2️⃣ Base de données – MariaDB 11.4

* Modèle relationnel structuré autour des notions de :

  * Runs
  * Boss / encounters
  * Joueurs, groupes, guildes
  * Statistiques DPS / HPS / APS
* Optimisation pour les requêtes analytiques
* Gestion de l'historique complet des performances
* Schéma géré via **Prisma ORM** (migrations versionées)

#### 3️⃣ Frontend – Next.js 16

* Application web moderne basée sur **Next.js App Router**
* Code en **TypeScript**, composants UI via **shadcn/ui** (Radix + Tailwind CSS v4)
* Pages principales :

  * Leaderboards par boss et par classe
  * Top players
  * Last uploads (derniers boss importés)
  * Lookup joueur / comparaison
  * Pages de détail par boss
* Design cohérent, lisible et orienté performance

#### 4️⃣ Bot Discord – Node.js

* Bot Discord.js v14 exposant des **slash commands**
* Notifications automatiques dans les channels configurés :

  * Nouveau run détecté (polling 30s)
  * Record personnel ou de guilde battu
  * Résumé hebdomadaire (mercredi 09h00)
* Serveur HTTP interne (port 8081) pour les webhooks de l'app web

---

### 🚀 Fonctionnalités principales

#### 📥 Import des logs

* Import via l'interface web ou la CLI du parser
* Détection des doublons
* Gestion explicite des paramètres de contexte (date, guilde, uploader)
* Vérification anticheat avant tout enregistrement

#### 📊 Analyse avancée

* Calcul DPS / HPS / APS individuels et de groupe
* Prise en compte exclusive des phases actives
* Correction des écarts liés aux transitions de phases
* Résultats cohérents avec les logs in-game

#### 🏆 Leaderboards

* Classements par boss
* Classements par classe
* Comparaison DPS / durée de combat
* Historique complet et traçable

#### 🆕 Last Uploads

* Affichage des derniers boss uploadés
* Informations clés : boss, date, uploader, DPS / durée
* Interface alignée visuellement avec les leaderboards

#### 🤖 Bot Discord

* `/lookup`, `/personalbest`, `/top`, `/compare` — stats et classements
* `/lastrun`, `/weeklysummary` — résumés de runs
* `/deleterun`, `/reparse`, `/changelog`, `/rules`, `/presentation` — commandes admin
* Accès admin restreint au propriétaire du serveur ou au rôle configuré (`ADMIN_ROLE_ID`)

---

### ⚠️ Points techniques clés

* Matching des boss par **égalité exacte** (insensible à la casse) — évite les faux positifs sur les noms de joueurs contenant un nom de boss
* Calculs strictement basés sur les timestamps
* Séparation claire parsing / stockage / affichage
* Déploiement via **Docker Compose** + **Traefik** (HTTPS Let's Encrypt)
* CI/CD GitHub Actions (Prod + Preprod)

---

## 🇬🇧 Overview (English)

**Prancing Pika** is an advanced community-driven platform dedicated to analyzing, indexing, and visualizing combat logs from the MMORPG **RIFT**.

The project provides a reliable and accurate tool for players and guilds to exploit PvE performance data from `combat.log` files. It combines a **high-performance Rust parser**, a **relational database optimized for analytics**, a **modern Next.js web interface**, and an integrated **Discord bot**.

Prancing Pika focuses on calculation accuracy (DPS, HPS, real fight duration), proper handling of complex encounters (multi-boss, multi-phase), and result clarity.

---

### 🎯 Project Goals

* Reliably parse **RIFT combat logs**
* Accurately identify:

  * Bosses and encounters
  * Phases and transitions
  * Players, classes, and roles
* Compute advanced metrics:

  * Individual and group DPS / HPS
  * Effective fight duration (excluding downtime)
  * Performance per player, class, and boss
* Centralize and historize runs
* Provide a **fast and consistent web interface**
* Deliver a **native Discord integration** for the community
* Build a strong technical foundation for a scalable community platform

---

### 🧱 Detailed Architecture

The project is built around **four strongly decoupled components**.

#### 1️⃣ Parser – Rust (`pika-parser`)

The parser is the technical core of the project.

* Line-by-line analysis of `combat.log` files
* Strict event modeling (damage, healing, buffs, debuffs)
* Automatic detection of:

  * Fight start and end
  * Active bosses (exact match, case-insensitive)
  * Sequential or simultaneous phases
* Complex encounter handling:

  * Multi-boss fights
  * Discontinuous phases
  * Downtime between phases
* Calculations strictly based on real timestamps
* Class and role normalization
* Safe and structured database import
* **Anti-cheat**: suspicious pattern detection before import
* Exposes an **HTTP API** (Axum, port 8080) consumed by the frontend

Available CLI commands:

```bash
cargo run -- parse <file>             # Dry analysis, terminal output
cargo run -- inspect <file>           # Quick fight list
cargo run -- import <file> -g <guild_id> -u <uploader_id>  # Parse + DB import
cargo run -- serve                    # Start HTTP server (port 8080)
```

#### 2️⃣ Database – MariaDB 11.4

* Relational schema centered on:

  * Runs
  * Bosses / encounters
  * Players, groups, guilds
  * DPS / HPS / APS statistics
* Optimized for analytical queries
* Full performance history retention
* Schema managed via **Prisma ORM** (versioned migrations)

#### 3️⃣ Frontend – Next.js 16

* Modern web application using **Next.js App Router**
* Written in **TypeScript**, UI components via **shadcn/ui** (Radix + Tailwind CSS v4)
* Main pages:

  * Leaderboards per boss and class
  * Top players
  * Last uploads
  * Player lookup / comparison
  * Boss detail pages
* Clean, readable, performance-oriented design

#### 4️⃣ Discord Bot – Node.js

* Discord.js v14 bot exposing **slash commands**
* Automatic notifications in configured channels:

  * New run detected (30s polling)
  * Personal or guild record broken
  * Weekly summary (Wednesday 09:00)
* Internal HTTP server (port 8081) for webhooks from the web app

---

### 🚀 Core Features

#### 📥 Log Import

* Import via web interface or parser CLI
* Duplicate detection
* Explicit contextual parameters (date, guild, uploader)
* Anti-cheat verification before any record is saved

#### 📊 Advanced Analysis

* Individual and group DPS / HPS / APS computation
* Active-phase-only time calculation
* Phase transition gap correction
* Results consistent with in-game logs

#### 🏆 Leaderboards

* Boss-based rankings
* Class-based rankings
* DPS vs fight duration comparison
* Fully traceable historical data

#### 🆕 Last Uploads

* Display of the most recently uploaded bosses
* Key info: boss, date, uploader, DPS / duration
* Visual consistency with leaderboards

#### 🤖 Discord Bot

* `/lookup`, `/personalbest`, `/top`, `/compare` — stats and rankings
* `/lastrun`, `/weeklysummary` — run summaries
* `/deleterun`, `/reparse`, `/changelog`, `/rules`, `/presentation` — admin commands
* Admin access restricted to server owner or configured role (`ADMIN_ROLE_ID`)

---

### ⚠️ Key Technical Points

* Boss matching uses **exact equality** (case-insensitive) — prevents false positives from player names containing a boss name
* Timestamp-based calculations only
* Clear separation between parsing, storage, and display
* Deployed via **Docker Compose** + **Traefik** (HTTPS via Let's Encrypt)
* GitHub Actions CI/CD (Prod + Preprod environments)

---

## 👤 Author

Developed by **Armand "Cloug" Zireg**
Engineering student – cybersecurity & systems
Personal project with strong technical and community focus

---

## 📜 License

This project is licensed under the **MIT License** — free to use, modify, and distribute with attribution.
See the [LICENSE](./LICENSE) file for details.
