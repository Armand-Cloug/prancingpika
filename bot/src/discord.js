// src/discord.js
// Client Discord v14 : chargement des slash commands et dispatch des interactions.

import { Client, GatewayIntentBits, Collection, Events, MessageFlags } from 'discord.js';
import { readdirSync }    from 'fs';
import { pathToFileURL }  from 'url';
import { join, dirname }  from 'path';
import { fileURLToPath }  from 'url';
import { startNotifications } from './notifications.js';
import { handleTicketCreate } from './commands/ticket.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let client = null;

export async function startDiscord() {
  const token = process.env.DISCORD_TOKEN;

  if (!token) {
    console.log('[bot] DISCORD_TOKEN manquant — client Discord non demarre.');
    return;
  }

  client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.commands = new Collection();

  // Chargement dynamique des commandes depuis src/commands/
  const commandsPath = join(__dirname, 'commands');
  const commandFiles = readdirSync(commandsPath).filter(f => f.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = pathToFileURL(join(commandsPath, file)).href;
    const command  = await import(filePath);

    if (!command.data || !command.execute) {
      console.warn(`[bot] Fichier commande invalide (manque data/execute): ${file}`);
      continue;
    }
    client.commands.set(command.data.name, command);
    console.log(`[bot] Commande chargee : /${command.data.name}`);
  }

  // Map des handlers de boutons
  const buttonHandlers = {
    ticket_create: handleTicketCreate,
  };

  // Handler des interactions (slash commands + boutons)
  client.on(Events.InteractionCreate, async interaction => {
    // Boutons
    if (interaction.isButton()) {
      const handler = buttonHandlers[interaction.customId];
      if (!handler) return;
      try {
        await handler(interaction);
      } catch (err) {
        console.error(`[bot] Erreur bouton ${interaction.customId}:`, err);
        const msg = { content: 'Une erreur est survenue.', flags: MessageFlags.Ephemeral };
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
      return;
    }

    // Slash commands
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`[bot] Erreur dans /${interaction.commandName}:`, err);
      const msg = { content: 'An error occurred while executing this command.', flags: MessageFlags.Ephemeral };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  });

  client.once(Events.ClientReady, c => {
    console.log(`[bot] Connecte en tant que ${c.user.tag}`);

    // Demarrage des notifications automatiques une fois le client pret
    if (process.env.DATABASE_URL) {
      startNotifications(client);
    } else {
      console.log('[bot] DATABASE_URL absent — notifications desactivees.');
    }
  });

  client.on('error', err => {
    console.error('[bot] Erreur client Discord:', err);
  });

  await client.login(token);
}

export function getDiscordClient() {
  return client;
}
