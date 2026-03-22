// src/deploy-commands.js
// Enregistre les slash commands aupres de Discord via l'API REST.
// Utilisation : node src/deploy-commands.js
//
// Variables d'environnement requises :
//   DISCORD_TOKEN
//   CLIENT_ID
//   GUILD_ID (optionnel : deploiement restreint a un serveur pour les tests)

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync }  from 'fs';
import { pathToFileURL }from 'url';
import { join, dirname }from 'path';
import { fileURLToPath }from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const token    = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId  = process.env.GUILD_ID; // optionnel

if (!token || !clientId) {
  console.error('DISCORD_TOKEN et CLIENT_ID sont requis dans .env');
  process.exit(1);
}

const commands = [];

const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = pathToFileURL(join(commandsPath, file)).href;
  const command  = await import(filePath);
  if (command.data) {
    commands.push(command.data.toJSON());
    console.log(`  + /${command.data.name}`);
  }
}

const rest = new REST().setToken(token);

try {
  console.log(`\nEnregistrement de ${commands.length} slash command(s)...`);

  let data;
  if (guildId) {
    // Deploiement sur un serveur specifique (instantane, recommande pour les tests)
    data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log(`OK : ${data.length} commande(s) enregistree(s) sur le serveur ${guildId}.`);
  } else {
    // Deploiement global (jusqu'a 1h de propagation)
    data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    console.log(`OK : ${data.length} commande(s) enregistree(s) globalement.`);
  }
} catch (err) {
  console.error('Erreur lors du deploiement :', err);
  process.exit(1);
}
