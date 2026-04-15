-- ═══════════════════════════════════════════════════════
--  PrancingPika.lua — Point d'entrée
-- ═══════════════════════════════════════════════════════

PrancingPika = { version = "2.0.0" }

-- ── Chargement des SavedVariables ───────────────────────
-- Event.Addon.SavedVariables.Load.End se déclenche quand les
-- variables persistantes sont prêtes. C'est ici qu'on initialise.
Command.Event.Attach(Event.Addon.SavedVariables.Load.End,
    function(_, identifier)
        if identifier ~= "PrancingPika" then return end
        PPData.Init()
        PPData.SyncCurrentChar()
        Command.Console.Display("general", false,
            '<font color="#7dd3fc">PP</font> v' .. PrancingPika.version ..
            ' loaded — <font color="#fbbf24">/pp help</font>', true)
    end,
    "PrancingPika_SavedVarsLoaded"
)

-- ── Commande slash /pp ──────────────────────────────────
-- Command.Slash.Register("pp") retourne une table event.
-- On s'y attache avec Command.Event.Attach.
-- Le handler reçoit (handle, args).
Command.Event.Attach(
    Command.Slash.Register("pp"),
    PPCmd.Dispatch,
    "PrancingPika_Slash"
)
