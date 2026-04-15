-- ═══════════════════════════════════════════════════════
--  Core/Commands.lua — Handlers /pp
--
--  Command.Console.Display(console, suppressPrefix, text, html)
--    console       : "general" | "combat" | console_id
--    suppressPrefix: false → affiche le préfixe addon automatique
--    text          : le message
--    html          : true → balises <font color="#rrggbb">, <u>, <a lua="...">
-- ═══════════════════════════════════════════════════════

PPCmd = {}

-- ── Helper affichage ────────────────────────────────────
-- HTML mode activé → couleurs avec <font color="#rrggbb">
local function chat(msg)
    Command.Console.Display("general", false,
        '<font color="#7dd3fc">PP</font> ' .. tostring(msg), true)
end
local function chatOk(msg)
    Command.Console.Display("general", false,
        '<font color="#86efac">PP ✔</font> ' .. tostring(msg), true)
end
local function chatErr(msg)
    Command.Console.Display("general", false,
        '<font color="#ff6b6b">PP ✘</font> ' .. tostring(msg), true)
end
local function sep()
    Command.Console.Display("general", false,
        '<font color="#444c58">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</font>', true)
end

-- ── /pp hello ───────────────────────────────────────────
local GREETINGS = {
    "Pika pika! ⚡ Hello Telara! Here to parse your DPS — or silently judge it.",
    "PIKACHU used UPLOAD LOG! It's super effective! ...once you link your account.",
    "Still not evolved. Still winning. That's Ash's Pikachu and me both.",
    "Fun fact: Pikachu weighs 13.2 lbs. Less than your guild's drama.",
    "Pika! Loaded and ready. Warning: may cause min-maxing at 2am.",
    "ZAP! PrancingPika online. Ash waited 25 seasons. I can wait for your logs.",
    "Your friendly neighbourhood Pikachu-themed log parser has entered Telara!",
}

function PPCmd.Hello()
    math.randomseed(math.floor(Inspect.Time.Real() * 100))
    chat(GREETINGS[math.random(1, #GREETINGS)])
end

-- ── /pp web ─────────────────────────────────────────────
function PPCmd.Web()
    sep()
    chat('<font color="#7dd3fc">Website</font>')
    chat('URL : <font color="#fbbf24">https://prancingpika.cloug.fr</font>')
    chat('<font color="#6b7280">Copy the URL above and paste it in your browser.</font>')
    sep()
end

-- ── /pp api ─────────────────────────────────────────────
function PPCmd.Api()
    sep()
    chat('<font color="#7dd3fc">API Status</font>')
    chat('Endpoint : <font color="#fbbf24">https://prancingpika.cloug.fr</font>')
    local id = PrancingPikaData and PrancingPikaData.riftAccountId
    if id then
        chatOk('RIFT ID : <font color="#fbbf24">' .. id .. '</font>')
        chat('Characters in cache : <font color="#fbbf24">' .. PPData.CharCount() .. '</font>')
    else
        chatErr("No RIFT ID yet — run /pp export first.")
    end
    chat('<font color="#6b7280">RIFT addons cannot make HTTP requests directly.</font>')
    chat('<font color="#6b7280">Use /pp export and paste the code on the website.</font>')
    sep()
end

-- ── /pp export ──────────────────────────────────────────
function PPCmd.Export()
    PPData.SyncCurrentChar()

    if PPData.CharCount() == 0 then
        chatErr("No characters found. Make sure you are logged in with a character.")
        return
    end

    local exportStr = PPData.BuildExportString()
    PPUI.ShowExport(exportStr)

    sep()
    chatOk("Export window opened!")
    chat('Characters : <font color="#fbbf24">' .. PPData.CharCount() .. '</font>')
    chat('<font color="#6b7280">1. Click the field in the popup</font>')
    chat('<font color="#6b7280">2. Ctrl+A then Ctrl+C</font>')
    chat('<font color="#6b7280">3. Paste on <font color="#fbbf24">prancingpika.cloug.fr/account</font></font>')
    sep()
end

-- ── /pp sync ────────────────────────────────────────────
function PPCmd.Sync()
    PPData.SyncCurrentChar()
    chatOk(PPData.CharCount() .. " character(s) updated in local cache.")
    chat('<font color="#6b7280">Run /pp export to get the updated string.</font>')
end

-- ── /pp status ──────────────────────────────────────────
function PPCmd.Status()
    sep()
    chat('<font color="#7dd3fc">PrancingPika — Status</font>')
    local id = PrancingPikaData and PrancingPikaData.riftAccountId
    if id then
        chatOk('RIFT ID : <font color="#fbbf24">' .. id .. '</font>')
        chat('Characters : <font color="#fbbf24">' .. PPData.CharCount() .. '</font>')
        chat('<font color="#6b7280">Run /pp export to sync with the website.</font>')
    else
        chatErr("Not set up yet — run /pp export to get started.")
    end
    sep()
end

-- ── /pp help ────────────────────────────────────────────
function PPCmd.Help()
    sep()
    chat('<font color="#7dd3fc">PrancingPika v2.0.0 — Commands</font>')
    chat('<font color="#fbbf24">/pp hello</font>  — Test the addon')
    chat('<font color="#fbbf24">/pp export</font> — Open export window (copy &amp; paste on website)')
    chat('<font color="#fbbf24">/pp sync</font>   — Refresh local character cache')
    chat('<font color="#fbbf24">/pp status</font> — Show current status')
    chat('<font color="#fbbf24">/pp api</font>    — Show API info')
    chat('<font color="#fbbf24">/pp web</font>    — Show website URL')
    chat('<font color="#fbbf24">/pp help</font>   — This message')
    sep()
end

-- ── Dispatcher ──────────────────────────────────────────
-- Le handler reçoit (handle, args) — on ignore le handle avec _
function PPCmd.Dispatch(_, args)
    args = (args or ""):match("^%s*(.-)%s*$")

    if     args == "hello"  or args == "hi" then PPCmd.Hello()
    elseif args == "export" or args == "e"  then PPCmd.Export()
    elseif args == "sync"                   then PPCmd.Sync()
    elseif args == "status"                 then PPCmd.Status()
    elseif args == "api"                    then PPCmd.Api()
    elseif args == "web"                    then PPCmd.Web()
    elseif args == "help"   or args == ""   then PPCmd.Help()
    else
        chatErr("Unknown command: /pp " .. args)
        chat('<font color="#6b7280">Type /pp help for the list.</font>')
    end
end
