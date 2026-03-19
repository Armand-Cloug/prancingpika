# ⚡ Prancing Pika

---

## 🇫🇷 Présentation (Français)

**Prancing Pika** est une plateforme communautaire avancée dédiée à l’analyse, à l’indexation et à la visualisation des logs de combat du MMORPG **RIFT**.

Le projet vise à fournir un outil fiable et précis permettant aux joueurs et guildes d’exploiter leurs performances PvE à partir des fichiers `combat.log`. Il combine un **parser Python robuste**, une **base de données relationnelle optimisée** et une **interface web moderne** développée avec Next.js.

Prancing Pika met l’accent sur la précision des calculs (DPS, HPS, durée réelle des combats), la gestion correcte des encounters complexes (multi-boss, multi-phases) et la lisibilité des résultats.

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
* Offrir une base technique solide pour une plateforme communautaire évolutive

---

### 🧱 Architecture détaillée

Le projet repose sur **trois composants fortement découplés**.

#### 1️⃣ Parser – Python

Le parser constitue le cœur technique du projet.

* Analyse ligne par ligne des fichiers `combat.log`
* Modélisation stricte des événements (dégâts, soins, buffs, debuffs)
* Détection automatique :

  * Début / fin de combat
  * Boss actifs
  * Phases successives ou simultanées
* Gestion des encounters complexes :

  * Multi-boss
  * Phases discontinues
  * Temps morts entre phases
* Calculs basés exclusivement sur les timestamps réels
* Normalisation des classes (ROGUE, Cleric, etc.)
* Import structuré et sécurisé en base de données

#### 2️⃣ Base de données – MySQL / MariaDB

* Modèle relationnel structuré autour des notions de :

  * Runs
  * Boss / encounters
  * Joueurs
  * Statistiques DPS / HPS
* Optimisation pour les requêtes analytiques
* Gestion de l’historique complet des performances
* Accès via **Prisma ORM** pour garantir cohérence et évolutivité

#### 3️⃣ Frontend – Next.js

* Application web moderne basée sur **Next.js App Router**
* Code en **TypeScript**
* Utilisation intensive de composants UI réutilisables
* Pages principales :

  * Leaderboards
  * Top players par boss et par classe
  * Last uploads (10 derniers boss importés)
  * Pages de détail par boss
* Design cohérent, lisible et orienté performance

---

### 🚀 Fonctionnalités principales

#### 📥 Import des logs

* Import manuel ou automatisé
* Support d’un nombre illimité de fichiers
* Détection des doublons
* Gestion explicite des paramètres de contexte (date, guilde, uploader)

```bash
python3 -m parser.import_runs combat.log/13-01-2026.txt \
  --env-file parser/.env \
  --date 2026-01-17 \
  --guild-id 1 \
  --uploader-id 1
```

---

#### 📊 Analyse avancée

* Calcul DPS / HPS individuels et de groupe
* Prise en compte exclusive des phases actives
* Correction des écarts liés aux transitions de phases
* Résultats cohérents avec les logs in-game

---

#### 🏆 Leaderboards

* Classements par boss
* Classements par classe
* Comparaison DPS / durée de combat
* Historique complet et traçable

---

#### 🆕 Last Uploads

* Affichage des **10 derniers boss uploadés**
* Informations clés :

  * Boss
  * Date
  * Uploader
  * DPS / durée
* Interface alignée visuellement avec les leaderboards

---

### ⚠️ Points techniques clés

* Gestion robuste des **phases discontinues**
* Calculs strictement basés sur les timestamps
* Séparation claire parsing / stockage / affichage
* Code orienté maintenabilité et évolutivité

---

## 🇬🇧 Overview (English)

**Prancing Pika** is an advanced community-driven platform dedicated to analyzing, indexing, and visualizing combat logs from the MMORPG **RIFT**.

The project provides a reliable and accurate tool for players and guilds to exploit PvE performance data from `combat.log` files. It combines a **robust Python parser**, a **relational database optimized for analytics**, and a **modern Next.js web interface**.

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
* Build a strong technical foundation for a scalable community platform

---

### 🧱 Detailed Architecture

The project is built around **three strongly decoupled components**.

#### 1️⃣ Parser – Python

The parser is the technical core of the project.

* Line-by-line analysis of `combat.log` files
* Strict event modeling (damage, healing, buffs, debuffs)
* Automatic detection of:

  * Fight start and end
  * Active bosses
  * Sequential or simultaneous phases
* Complex encounter handling:

  * Multi-boss fights
  * Discontinuous phases
  * Downtime between phases
* Calculations strictly based on real timestamps
* Class normalization (ROGUE, Cleric, etc.)
* Safe and structured database import

#### 2️⃣ Database – MySQL / MariaDB

* Relational schema centered on:

  * Runs
  * Bosses / encounters
  * Players
  * DPS / HPS statistics
* Optimized for analytical queries
* Full performance history retention
* Accessed through **Prisma ORM** for consistency and scalability

#### 3️⃣ Frontend – Next.js

* Modern web application using **Next.js App Router**
* Written in **TypeScript**
* Extensive use of reusable UI components
* Main pages:

  * Leaderboards
  * Top players per boss and class
  * Last uploads (latest 10 imported bosses)
  * Boss detail pages
* Clean, readable, performance-oriented design

---

### 🚀 Core Features

#### 📥 Log Import

* Manual or automated imports
* Unlimited file support
* Duplicate detection
* Explicit contextual parameters (date, guild, uploader)

```bash
python3 -m parser.import_runs combat.log/13-01-2026.txt \
  --env-file parser/.env \
  --date 2026-01-17 \
  --guild-id 1 \
  --uploader-id 1
```

---

#### 📊 Advanced Analysis

* Individual and group DPS / HPS computation
* Active-phase-only time calculation
* Phase transition gap correction
* Results consistent with in-game logs

---

#### 🏆 Leaderboards

* Boss-based rankings
* Class-based rankings
* DPS vs fight duration comparison
* Fully traceable historical data

---

#### 🆕 Last Uploads

* Display of the **10 most recently uploaded bosses**
* Key information:

  * Boss
  * Date
  * Uploader
  * DPS / duration
* Visual consistency with leaderboards

---

### ⚠️ Key Technical Points

* Robust handling of **discontinuous phases**
* Timestamp-based calculations only
* Clear separation between parsing, storage, and display
* Code designed for maintainability and scalability

---

## 👤 Author

Developed by **Armand "Cloug" Zireg**
Engineering student – cybersecurity & systems
Personal project with strong technical and community focus

---

## 📜 License

Personal project – community and educational use.
License to be defined depending on future code openness.