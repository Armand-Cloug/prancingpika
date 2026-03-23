// src/db.js
// Connexion MySQL et toutes les requetes DB du bot Discord.
// Utilise DATABASE_URL (format mysql://user:pass@host:port/db).

import mysql from 'mysql2/promise';

let pool = null;

export function getDb() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('[db] DATABASE_URL manquant dans .env');
    }
    pool = mysql.createPool(process.env.DATABASE_URL);
  }
  return pool;
}

// ─── Helpers d'affichage ──────────────────────────────────────────────────────

export function fmtDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function fmtNum(n) {
  if (n == null) return '—';
  return Math.round(Number(n)).toLocaleString('fr-FR');
}

export const CLASS_COLORS = {
  Rogue:     0xFFD700,
  Cleric:    0x00C853,
  Warrior:   0xE53935,
  Primalist: 0x29B6F6,
  Mage:      0x7C4DFF,
};

export function classColor(cls) {
  return CLASS_COLORS[cls] ?? 0x90A4AE;
}

export function classEmoji(cls) {
  const map = {
    Rogue:     '🗡️',
    Cleric:    '✨',
    Warrior:   '⚔️',
    Primalist: '🌪️',
    Mage:      '🔮',
  };
  return map[cls] ?? '❓';
}

export function roleEmoji(role) {
  const map = {
    DPS:     '⚔️',
    Healer:  '💚',
    Tank:    '🛡️',
    Support: '🎵',
  };
  return map[role] ?? '❓';
}

// ─── Requetes ─────────────────────────────────────────────────────────────────

/**
 * Meilleur score d'un joueur sur un boss (tri par DPS desc).
 */
export async function getPersonalBest(playerName, bossName) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT
      p.name   AS player_name,
      p.class,
      rp.dps, rp.hps, rp.aps, rp.role,
      COALESCE(r.bossDurationS, r.durationTotalS) AS duration_s,
      r.startedAt,
      r.id     AS run_id,
      b.name   AS boss_name,
      g.name   AS guild_name
    FROM run_players rp
    JOIN runs    r ON rp.runId    = r.id
    JOIN players p ON rp.playerId = p.id
    JOIN bosses  b ON r.bossId    = b.id
    JOIN guilds  g ON r.guildId   = g.id
    WHERE p.name LIKE ? AND b.name LIKE ?
    ORDER BY rp.dps DESC
    LIMIT 1`,
    [`%${playerName}%`, `%${bossName}%`]
  );
  return rows[0] ?? null;
}

/**
 * Top N joueurs par DPS sur un boss (un score par joueur = son record).
 */
export async function getTopDps(bossName, limit = 10) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT player_name, class, dps, hps, aps, role, duration_s, started_at, run_id, guild_name
    FROM (
      SELECT
        p.name  AS player_name,
        p.class,
        rp.dps, rp.hps, rp.aps, rp.role,
        COALESCE(r.bossDurationS, r.durationTotalS) AS duration_s,
        r.startedAt AS started_at,
        r.id        AS run_id,
        g.name      AS guild_name,
        ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY rp.dps DESC) AS rn
      FROM run_players rp
      JOIN runs    r ON rp.runId    = r.id
      JOIN players p ON rp.playerId = p.id
      JOIN bosses  b ON r.bossId    = b.id
      JOIN guilds  g ON r.guildId   = g.id
      WHERE b.name LIKE ?
    ) ranked
    WHERE rn = 1
    ORDER BY dps DESC
    LIMIT ?`,
    [`%${bossName}%`, limit]
  );
  return rows;
}

/**
 * Historique d'un joueur : meilleur score par boss.
 */
export async function getPlayerHistory(playerName) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT
      b.name          AS boss_name,
      MAX(rp.dps)     AS best_dps,
      MAX(rp.hps)     AS best_hps,
      MAX(rp.aps)     AS best_aps,
      p.class,
      rp.role,
      COUNT(rp.runId) AS run_count
    FROM run_players rp
    JOIN runs    r ON rp.runId    = r.id
    JOIN players p ON rp.playerId = p.id
    JOIN bosses  b ON r.bossId    = b.id
    WHERE p.name LIKE ?
    GROUP BY b.id, b.name, p.class, rp.role
    ORDER BY best_dps DESC`,
    [`%${playerName}%`]
  );
  return rows;
}

/**
 * Comparer deux joueurs sur un boss.
 */
export async function comparePlayers(player1, player2, bossName) {
  const [p1, p2] = await Promise.all([
    getPersonalBest(player1, bossName),
    getPersonalBest(player2, bossName),
  ]);
  return { p1, p2 };
}

/**
 * Dernier run uploade.
 */
export async function getLastRun() {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT
      r.id  AS run_id,
      b.name AS boss_name,
      g.name AS guild_name,
      g.tag  AS guild_tag,
      COALESCE(r.bossDurationS, r.durationTotalS) AS duration_s,
      r.dpsGroup, r.hpsGroup, r.apsGroup,
      r.startedAt, r.createdAt
    FROM runs   r
    JOIN bosses b ON r.bossId  = b.id
    JOIN guilds g ON r.guildId = g.id
    ORDER BY r.createdAt DESC
    LIMIT 1`
  );
  return rows[0] ?? null;
}

/**
 * Roster d'un run, trie par DPS.
 */
export async function getRunRoster(runId, limit = 5) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT
      p.name  AS player_name,
      p.class,
      rp.dps, rp.hps, rp.aps, rp.role
    FROM run_players rp
    JOIN players p ON rp.playerId = p.id
    WHERE rp.runId = ?
    ORDER BY rp.dps DESC
    LIMIT ?`,
    [runId, limit]
  );
  return rows;
}

/**
 * Resume hebdomadaire : meilleur score par joueur par boss sur 7 jours,
 * puis top 3 par categorie (DPS/HPS/APS).
 */
export async function getWeeklySummary() {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT
      b.name  AS boss_name,
      p.name  AS player_name,
      p.class,
      rp.dps, rp.hps, rp.aps, rp.role
    FROM run_players rp
    JOIN runs    r ON rp.runId    = r.id
    JOIN players p ON rp.playerId = p.id
    JOIN bosses  b ON r.bossId    = b.id
    WHERE r.startedAt >= DATE_ADD(
      CONCAT(DATE_SUB(CURDATE(), INTERVAL ((DAYOFWEEK(CURDATE()) - 4 + 7) % 7) DAY), ' 09:00:00'),
      INTERVAL CASE WHEN ((DAYOFWEEK(CURDATE()) - 4 + 7) % 7) = 0 AND TIME(NOW()) < '09:00:00' THEN 7 ELSE 0 END DAY
    )`
  );

  // Agreger par boss+joueur (meilleur score de la semaine par joueur)
  const playerBest = {};
  for (const row of rows) {
    const key = `${row.boss_name}\x00${row.player_name}`;
    if (!playerBest[key]) {
      playerBest[key] = { ...row };
    } else {
      playerBest[key].dps = Math.max(playerBest[key].dps, row.dps);
      playerBest[key].hps = Math.max(playerBest[key].hps, row.hps);
      playerBest[key].aps = Math.max(playerBest[key].aps, row.aps);
    }
  }

  // Grouper par boss
  const byBoss = {};
  for (const entry of Object.values(playerBest)) {
    if (!byBoss[entry.boss_name]) byBoss[entry.boss_name] = [];
    byBoss[entry.boss_name].push(entry);
  }

  // Top 3 par categorie
  const result = {};
  for (const [boss, entries] of Object.entries(byBoss)) {
    result[boss] = {
      dps: [...entries].sort((a, b) => b.dps - a.dps).slice(0, 3),
      hps: [...entries].sort((a, b) => b.hps - a.hps).slice(0, 3),
      aps: [...entries].filter(e => e.aps > 0).sort((a, b) => b.aps - a.aps).slice(0, 3),
    };
  }
  return result;
}

/**
 * Verifie si un utilisateur Discord est Officer ou Owner d'une guilde.
 * Retourne { role, guildId } ou null.
 */
export async function isOfficerOrOwner(discordUserId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT gm.role, gm.guildId
    FROM guild_members gm
    JOIN web_accounts wa ON gm.accountId = wa.id
    WHERE wa.provider = 'discord'
      AND wa.providerAccountId = ?
      AND gm.role IN ('OWNER', 'OFFICER')
    LIMIT 1`,
    [String(discordUserId)]
  );
  return rows[0] ?? null;
}

/**
 * Supprime un run par ID (cascade sur run_players, run_deaths, run_buffs).
 */
export async function deleteRun(runId) {
  const db = getDb();
  const [result] = await db.query('DELETE FROM runs WHERE id = ?', [runId]);
  return result.affectedRows > 0;
}

/**
 * ID du dernier run en DB (pour le polling de notifications).
 */
export async function getLatestRunId() {
  const db = getDb();
  const [rows] = await db.query('SELECT id FROM runs ORDER BY createdAt DESC LIMIT 1');
  return rows[0]?.id ?? null;
}

/**
 * Runs crees apres un certain ID (pour le polling).
 */
export async function getRunsAfter(lastId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT
      r.id    AS run_id,
      b.name  AS boss_name,
      b.id    AS boss_id,
      g.name  AS guild_name,
      g.id    AS guild_id,
      COALESCE(r.bossDurationS, r.durationTotalS) AS duration_s,
      r.dpsGroup, r.hpsGroup, r.apsGroup,
      r.createdAt
    FROM runs   r
    JOIN bosses b ON r.bossId  = b.id
    JOIN guilds g ON r.guildId = g.id
    WHERE r.id > ?
    ORDER BY r.id ASC`,
    [lastId]
  );
  return rows;
}

/**
 * Record personnel precedent d'un joueur sur un boss (avant un run donne).
 */
export async function getPreviousPersonalBest(playerId, bossId, beforeRunId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT
      MAX(rp.dps) AS max_dps,
      MAX(rp.hps) AS max_hps,
      MAX(rp.aps) AS max_aps
    FROM run_players rp
    JOIN runs r ON rp.runId = r.id
    WHERE rp.playerId = ? AND r.bossId = ? AND r.id < ?`,
    [playerId, bossId, beforeRunId]
  );
  return rows[0] ?? { max_dps: 0, max_hps: 0, max_aps: 0 };
}

/**
 * Record de temps precedent d'une guilde sur un boss (avant un run donne).
 */
export async function getPreviousGuildRecord(guildId, bossId, beforeRunId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT MIN(COALESCE(bossDurationS, durationTotalS)) AS min_duration
    FROM runs
    WHERE guildId = ? AND bossId = ? AND id < ?`,
    [guildId, bossId, beforeRunId]
  );
  return rows[0]?.min_duration ?? null;
}

/**
 * Joueurs d'un run avec leur playerId (pour le suivi des PB).
 */
export async function getRunPlayers(runId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT
      rp.playerId,
      p.name AS player_name,
      p.class,
      rp.dps, rp.hps, rp.aps, rp.role
    FROM run_players rp
    JOIN players p ON rp.playerId = p.id
    WHERE rp.runId = ?
    ORDER BY rp.dps DESC`,
    [runId]
  );
  return rows;
}
