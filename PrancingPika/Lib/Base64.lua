-- ═══════════════════════════════════════════════════════
--  Lib/Base64.lua — Encodeur Base64 pur Lua 5.1
-- ═══════════════════════════════════════════════════════

local alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

function PPBase64Encode(data)
    local result = {}
    local len = #data

    for i = 1, len - 2, 3 do
        local b1 = string.byte(data, i)
        local b2 = string.byte(data, i + 1)
        local b3 = string.byte(data, i + 2)

        result[#result + 1] = string.sub(alphabet, math.floor(b1 / 4) + 1,           math.floor(b1 / 4) + 1)
        result[#result + 1] = string.sub(alphabet, (b1 % 4) * 16 + math.floor(b2 / 16) + 1, (b1 % 4) * 16 + math.floor(b2 / 16) + 1)
        result[#result + 1] = string.sub(alphabet, (b2 % 16) * 4 + math.floor(b3 / 64) + 1, (b2 % 16) * 4 + math.floor(b3 / 64) + 1)
        result[#result + 1] = string.sub(alphabet, b3 % 64 + 1, b3 % 64 + 1)
    end

    local rem = len % 3
    if rem == 1 then
        local b1 = string.byte(data, len)
        result[#result + 1] = string.sub(alphabet, math.floor(b1 / 4) + 1, math.floor(b1 / 4) + 1)
        result[#result + 1] = string.sub(alphabet, (b1 % 4) * 16 + 1, (b1 % 4) * 16 + 1)
        result[#result + 1] = "=="
    elseif rem == 2 then
        local b1 = string.byte(data, len - 1)
        local b2 = string.byte(data, len)
        result[#result + 1] = string.sub(alphabet, math.floor(b1 / 4) + 1, math.floor(b1 / 4) + 1)
        result[#result + 1] = string.sub(alphabet, (b1 % 4) * 16 + math.floor(b2 / 16) + 1, (b1 % 4) * 16 + math.floor(b2 / 16) + 1)
        result[#result + 1] = string.sub(alphabet, (b2 % 16) * 4 + 1, (b2 % 16) * 4 + 1)
        result[#result + 1] = "="
    end

    return table.concat(result)
end
