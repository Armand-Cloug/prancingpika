// bot/src/discord.js
import pkg from "discord.js";

// v14: IntentsBitField / GatewayIntentBits
// v13: Intents
const {
  Client,
  IntentsBitField,
  GatewayIntentBits,
  Intents,
} = pkg;

let client = null;

export async function startDiscord() {
  const token = process.env.DISCORD_TOKEN;

  // Démarre même sans token (API HTTP OK)
  if (!token) {
    console.log("[bot] DISCORD_TOKEN missing: Discord client not started.");
    return;
  }

  // Détermine l'intent "Guilds" selon la version
  let intents = undefined;

  if (IntentsBitField?.Flags?.Guilds) {
    // discord.js v14
    intents = [IntentsBitField.Flags.Guilds];
  } else if (GatewayIntentBits?.Guilds) {
    // discord.js v14 (autre export)
    intents = [GatewayIntentBits.Guilds];
  } else if (Intents?.FLAGS?.GUILDS) {
    // discord.js v13
    intents = [Intents.FLAGS.GUILDS];
  } else {
    // Dernier recours : aucun intent (client démarre quand même, mais limité)
    intents = [];
  }

  client = new Client({ intents });

  client.once("ready", () => {
    console.log(`[bot] Logged in as ${client.user?.tag}`);
  });

  client.on("error", (err) => {
    console.error("[bot] Discord client error:", err);
  });

  await client.login(token);
}

export function getDiscordClient() {
  return client;
}