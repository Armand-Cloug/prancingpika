// src/notifications.js
// Notifications automatiques postees dans les channels configures.
//
//   NOTIFY_CHANNEL_ID  — nouveaux runs
//   RECORDS_CHANNEL_ID — records personnels des joueurs + records de guilde
//   WEEKLY_CHANNEL_ID  — resume hebdomadaire (mercredi 9h)
//
// Mecanisme : polling toutes les 30 secondes sur la table `runs`.
// Un fichier data/state.json stocke le dernier run_id traite.

import cron    from 'node-cron';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname }  from 'path';
import { fileURLToPath }  from 'url';
import { EmbedBuilder }   from 'discord.js';
import {
  getLatestRunId,
  getRunsAfter,
  getRunRoster,
  getRunPlayers,
  getPreviousPersonalBest,
  getPreviousGuildRecord,
  getWeeklySummary,
  classEmoji, roleEmoji,
  fmtNum, fmtDuration,
} from './db.js';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = join(__dirname, '..', 'data', 'state.json');

// ─── Persistance de l'etat ────────────────────────────────────────────────────

async function loadState() {
  try {
    const raw = await readFile(STATE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { lastRunId: null };
  }
}

async function saveState(state) {
  try {
    await mkdir(join(__dirname, '..', 'data'), { recursive: true });
    await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('[notifications] Erreur sauvegarde state:', err);
  }
}

// ─── Helpers embeds ───────────────────────────────────────────────────────────

function getChannel(client, envVar) {
  const id = process.env[envVar];
  if (!id) return null;
  return client.channels.cache.get(id) ?? null;
}

function buildRunEmbed(run, roster) {
  const rosterLines = roster.map((r, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
    return `${medal} ${classEmoji(r.class)}${roleEmoji(r.role)} **${r.player_name}** — ${fmtNum(r.dps)} DPS`;
  });

  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`📊 New run — ${run.guild_name} killed ${run.boss_name}`)
    .addFields(
      { name: '⏱️ Duration',   value: fmtDuration(run.duration_s), inline: true },
      { name: '💥 Group DPS',  value: fmtNum(run.dpsGroup),         inline: true },
      { name: '💚 Group HPS',  value: fmtNum(run.hpsGroup),         inline: true },
      { name: '🏆 Top 5',      value: rosterLines.join('\n') || '—' },
    )
    .setFooter({ text: 'PTPika Bot - By Cloug' })
    .setTimestamp();
}

export function buildWeeklyEmbed(summary) {
  const embeds = [];

  for (const [boss, cats] of Object.entries(summary)) {
    const lines = [];

    if (cats.dps.length) {
      lines.push('**⚔️ DPS**');
      cats.dps.forEach((p, i) => {
        const medal = ['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`;
        lines.push(`${medal} ${classEmoji(p.class)} **${p.player_name}** — ${fmtNum(p.dps)}`);
      });
    }

    if (cats.hps.length) {
      lines.push('\n**💚 HPS**');
      cats.hps.forEach((p, i) => {
        const medal = ['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`;
        lines.push(`${medal} ${classEmoji(p.class)} **${p.player_name}** — ${fmtNum(p.hps)}`);
      });
    }

    if (cats.aps.length) {
      lines.push('\n**🛡️ APS**');
      cats.aps.forEach((p, i) => {
        const medal = ['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`;
        lines.push(`${medal} ${classEmoji(p.class)} **${p.player_name}** — ${fmtNum(p.aps)}`);
      });
    }

    if (!lines.length) continue;

    embeds.push(
      new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(`📅 Weekly summary — ${boss}`)
        .setDescription(lines.join('\n'))
        .setFooter({ text: 'PTPika Bot - By Cloug' })
    );
  }

  if (!embeds.length) {
    embeds.push(
      new EmbedBuilder()
        .setColor(0x90A4AE)
        .setTitle('📅 Weekly summary')
        .setDescription('No activity this week.')
        .setFooter({ text: 'PTPika Bot - By Cloug' })
    );
  }

  return embeds;
}

// ─── Logique de poll ──────────────────────────────────────────────────────────

let _client = null;

export async function triggerPoll() {
  if (_client) await poll(_client).catch(err =>
    console.error('[notifications] Erreur poll manuel:', err)
  );
}

async function poll(client) {
  let state = await loadState();

  // Initialisation : memoriser le dernier run connu sans notifier
  if (state.lastRunId == null) {
    const latest = await getLatestRunId();
    state.lastRunId = latest != null ? Number(latest) : 0;
    await saveState(state);
    return;
  }

  const newRuns = await getRunsAfter(state.lastRunId);
  if (!newRuns.length) return;

  const notifyChannel  = getChannel(client, 'NOTIFY_CHANNEL_ID');
  const recordsChannel = getChannel(client, 'RECORDS_CHANNEL_ID');

  for (const run of newRuns) {
    state.lastRunId = Number(run.run_id);

    // 1. Notification de nouveau run
    if (notifyChannel) {
      try {
        const roster = await getRunRoster(run.run_id, 5);
        const embed  = buildRunEmbed(run, roster);
        await notifyChannel.send({ embeds: [embed] });
      } catch (err) {
        console.error('[notifications] Erreur envoi run:', err);
      }
    }

    // 2. Records personnels
    if (recordsChannel) {
      try {
        const players = await getRunPlayers(run.run_id);
        for (const p of players) {
          const prev = await getPreviousPersonalBest(p.playerId, run.boss_id, run.run_id);
          const newDps  = Number(p.dps);
          const newHps  = Number(p.hps);
          const newAps  = Number(p.aps);
          const prevDps = Number(prev.max_dps ?? 0);
          const prevHps = Number(prev.max_hps ?? 0);
          const prevAps = Number(prev.max_aps ?? 0);

          // Determiner la metrique la plus representative (eviter le doublon)
          if (newDps > prevDps && newDps > 0) {
            await recordsChannel.send(
              `🏆 **${p.player_name}** just broke their personal record on **${run.boss_name}** — **${fmtNum(newDps)} DPS** (${p.class ?? p.role ?? '?'})`
            );
          } else if (newHps > prevHps && newHps > 0) {
            await recordsChannel.send(
              `🏆 **${p.player_name}** just broke their personal record on **${run.boss_name}** — **${fmtNum(newHps)} HPS** (${p.class ?? p.role ?? '?'})`
            );
          } else if (newAps > prevAps && newAps > 0) {
            await recordsChannel.send(
              `🏆 **${p.player_name}** just broke their personal record on **${run.boss_name}** — **${fmtNum(newAps)} APS** (${p.class ?? p.role ?? '?'})`
            );
          }
        }
      } catch (err) {
        console.error('[notifications] Erreur records perso:', err);
      }
    }

    // 3. Record de guilde (temps) — même channel que les records personnels
    if (recordsChannel) {
      try {
        const prevRecord = await getPreviousGuildRecord(run.guild_id, run.boss_id, run.run_id);
        if (prevRecord != null && run.duration_s < Number(prevRecord)) {
          await recordsChannel.send(
            `⚔️ Guild **${run.guild_name}** just broke their record on **${run.boss_name}** — ${fmtDuration(run.duration_s)} *(previously ${fmtDuration(Number(prevRecord))})*`
          );
        }
      } catch (err) {
        console.error('[notifications] Erreur record guilde:', err);
      }
    }
  }

  await saveState(state);
}

// ─── Resume hebdomadaire ──────────────────────────────────────────────────────

async function sendWeeklySummary(client) {
  const channel = getChannel(client, 'WEEKLY_CHANNEL_ID')
    ?? getChannel(client, 'NOTIFY_CHANNEL_ID');

  if (!channel) {
    console.log('[notifications] Aucun channel configure pour le resume hebdo.');
    return;
  }

  try {
    const summary = await getWeeklySummary();
    const embeds  = buildWeeklyEmbed(summary);
    for (let i = 0; i < embeds.length; i += 10) {
      await channel.send({ embeds: embeds.slice(i, i + 10) });
    }
    console.log('[notifications] Resume hebdomadaire envoye.');
  } catch (err) {
    console.error('[notifications] Erreur resume hebdo:', err);
  }
}

// ─── Point d'entree ───────────────────────────────────────────────────────────

export function startNotifications(client) {
  _client = client;

  // Polling toutes les 30 secondes
  setInterval(() => {
    poll(client).catch(err =>
      console.error('[notifications] Erreur polling:', err)
    );
  }, 30_000);

  // Premier poll immediat
  poll(client).catch(err =>
    console.error('[notifications] Erreur premier poll:', err)
  );

  // Resume hebdomadaire : mercredi a 09:00 (heure locale du serveur)
  cron.schedule('0 9 * * 3', () => {
    console.log('[notifications] Lancement resume hebdomadaire...');
    sendWeeklySummary(client).catch(err =>
      console.error('[notifications] Erreur cron hebdo:', err)
    );
  });

  console.log('[notifications] Polling actif (30s) + cron hebdo mercredi 09:00.');
}
