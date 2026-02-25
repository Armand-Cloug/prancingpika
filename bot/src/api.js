import express from "express";

export async function startApi({ port }) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Endpoint appelé par ton API web
  app.post("/notify", (req, res) => {
    // Pour l’instant: on ne fait rien du message
    // (tu peux log si besoin)
    // console.log("notify:", req.body);

    res.json({ ok: true });
  });

  await new Promise((resolve) => {
    app.listen(port, "0.0.0.0", () => resolve());
  });

  console.log(`[bot] API listening on :${port}`);
}