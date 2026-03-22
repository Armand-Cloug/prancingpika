// src/api.js
// Serveur HTTP interne du bot.
//
//   GET  /health  — healthcheck
//   POST /notify  — webhook optionnel appele par l'app web apres un import
//                   declenche un poll immediat des notifications

import express from 'express';

export async function startApi({ port }) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Webhook appele par l'app web apres un upload reussi.
  // Declenche un poll immediat pour notifier sans attendre les 30 secondes.
  app.post('/notify', async (_req, res) => {
    res.json({ ok: true });
    try {
      const { triggerPoll } = await import('./notifications.js');
      await triggerPoll();
    } catch {
      // Non-fatal : le poll normal prendra le relais
    }
  });

  await new Promise(resolve => {
    app.listen(port, '0.0.0.0', () => resolve());
  });

  console.log(`[bot] API HTTP en ecoute sur :${port}`);
}
