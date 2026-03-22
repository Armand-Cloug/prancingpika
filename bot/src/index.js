import 'dotenv/config';
import { startApi }     from './api.js';
import { startDiscord } from './discord.js';

const port = Number(process.env.PORT || 8081);

await startApi({ port });
await startDiscord();
