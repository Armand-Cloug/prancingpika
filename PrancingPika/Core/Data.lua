-- ═══════════════════════════════════════════════════════
--  Core/Data.lua — SavedVariables + sérialisation
-- ═══════════════════════════════════════════════════════

PPData = {}

-- Appelé après le chargement des SavedVariables
function PPData.Init()
    -- PrancingPikaData est une variable globale "account" déclarée dans le .toc
    -- Elle est restaurée automatiquement avant Event.Addon.SavedVariables.Load.End
    if type(PrancingPikaData) ~= "table" then
        PrancingPikaData = {}
    end
    PrancingPikaData.riftAccountId = PrancingPikaData.riftAccountId or nil
    PrancingPikaData.characters    = PrancingPikaData.characters    or {}
end

function PPData.GenerateId()
    if PrancingPikaData.riftAccountId then
        return PrancingPikaData.riftAccountId
    end
    math.randomseed(math.floor(Inspect.Time.Real() * 1000))
    local player = Inspect.Unit.Detail("player")
    local name   = (player and player.name or "rift"):lower():gsub("[^a-z0-9]", "")
    local ts     = math.floor(Inspect.Time.Real())
    local rnd    = math.random(10000, 99999)
    PrancingPikaData.riftAccountId = string.format("rft-%s-%d-%d", name, ts, rnd)
    return PrancingPikaData.riftAccountId
end

function PPData.SyncCurrentChar()
    local player = Inspect.Unit.Detail("player")
    local shard  = Inspect.Shard()
    if not player or not player.name then return end
    local char = {
        name    = player.name,
        shard   = (shard and shard.name) or "Unknown",
        calling = player.calling         or "Unknown",
        level   = player.level           or 0,
        guild   = player.guild           or nil,
    }
    PrancingPikaData.characters[char.name .. "@" .. char.shard] = char
end

local function jsonStr(s)
    if s == nil then return "null" end
    s = tostring(s)
    s = s:gsub('\\', '\\\\')
    s = s:gsub('"',  '\\"')
    s = s:gsub('\n', '\\n')
    s = s:gsub('\r', '\\r')
    return '"' .. s .. '"'
end

function PPData.BuildExportString()
    PPData.GenerateId()
    local parts = {}
    for _, c in pairs(PrancingPikaData.characters) do
        local guild = (c.guild ~= nil) and jsonStr(c.guild) or "null"
        table.insert(parts, string.format(
            '{"name":%s,"shard":%s,"calling":%s,"level":%d,"guild":%s}',
            jsonStr(c.name), jsonStr(c.shard), jsonStr(c.calling),
            c.level or 0, guild
        ))
    end
    local json = string.format(
        '{"riftAccountId":%s,"characters":[%s]}',
        jsonStr(PrancingPikaData.riftAccountId),
        table.concat(parts, ",")
    )
    return "PP:" .. PPBase64Encode(json)
end

function PPData.CharCount()
    local n = 0
    for _ in pairs(PrancingPikaData.characters) do n = n + 1 end
    return n
end
