-- ═══════════════════════════════════════════════════════
--  Core/UI.lua — Fenetre d'export 100% custom
--
--  Fenetree entierement construite avec des frames RIFT
--  natifs pour un controle total sur la barre de titre.
--  LibExtendedWidgets fournit SimpleTextArea + SetBorder.
-- ═══════════════════════════════════════════════════════

PPUI = {}

local ctx = UI.CreateContext("PPContext")
local win = nil

-- ─── Dimensions ────────────────────────────────────────
local W      = 580
local H      = 255
local PAD    = 20    -- marge interieure
local TBAR_H = 44    -- hauteur barre de titre

-- ─── Palette (RIFT dark teal theme) ────────────────────
local COL = {
    win_bg    = {0.04, 0.09, 0.16, 0.97},   -- fond fenetere
    tbar_bg   = {0.05, 0.20, 0.35, 1.00},   -- barre de titre
    tbar_hi   = {0.15, 0.48, 0.72, 1.00},   -- ligne highlight
    title_txt = {0.85, 0.95, 1.00, 1.00},   -- texte du titre
    inst_txt  = {0.82, 0.86, 0.90, 1.00},   -- instructions
    link_txt  = {0.35, 0.72, 0.95, 1.00},   -- texte bleu/lien
    field_bg  = {0.03, 0.06, 0.12, 0.95},   -- fond champ
    foot_txt  = {0.45, 0.52, 0.60, 1.00},   -- bas de page
    border    = {0.20, 0.52, 0.80, 0.55},   -- bordure
}

-- ─── Helper SetBackgroundColor ─────────────────────────
local function bg(frame, c)
    frame:SetBackgroundColor(c[1], c[2], c[3], c[4])
end

function PPUI.ShowExport(exportString)
    if win then win:SetVisible(false); win = nil end

    -- ── Conteneur principal ───────────────────────────
    win = UI.CreateFrame("Frame", "PPWin", ctx)
    win:SetWidth(W)
    win:SetHeight(H)
    win:SetPoint("TOPCENTER", UIParent, "TOPCENTER", 0, 20)
    win:SetLayer(200)
    bg(win, COL.win_bg)

    -- Bordure fine autour de la fenetre
    Library.LibExtendedWidgets.SetBorder("plain", win, 1,
        COL.border[1], COL.border[2], COL.border[3], COL.border[4])

    -- ── Barre de titre ────────────────────────────────
    local tbar = UI.CreateFrame("Frame", "PPTBar", win)
    tbar:SetPoint("TOPLEFT",  win, "TOPLEFT",  0, 0)
    tbar:SetPoint("TOPRIGHT", win, "TOPRIGHT", 0, 0)
    tbar:SetHeight(TBAR_H)
    bg(tbar, COL.tbar_bg)

    -- Ligne de highlight (bord superieur de la barre)
    local thi = UI.CreateFrame("Frame", "PPTHi", win)
    thi:SetPoint("TOPLEFT",  win, "TOPLEFT",  0, 0)
    thi:SetPoint("TOPRIGHT", win, "TOPRIGHT", 0, 0)
    thi:SetHeight(2)
    bg(thi, COL.tbar_hi)

    -- Ligne de separation en bas de la barre
    local tsep = UI.CreateFrame("Frame", "PPTSep", win)
    tsep:SetPoint("TOPLEFT",  win, "TOPLEFT",  0, TBAR_H - 1)
    tsep:SetPoint("TOPRIGHT", win, "TOPRIGHT", 0, TBAR_H - 1)
    tsep:SetHeight(1)
    bg(tsep, COL.tbar_hi)

    -- Titre centre dans la barre
    local ttxt = UI.CreateFrame("Text", "PPTTxt", win)
    ttxt:SetPoint("CENTER", tbar, "CENTER", 0, 0)
    ttxt:SetFontSize(15)
    ttxt:SetFontColor(
        COL.title_txt[1], COL.title_txt[2],
        COL.title_txt[3], COL.title_txt[4])
    ttxt:SetText("PrancingPika  --  Export Account")

    -- Bouton fermer [X] coin sup droit
    local xbtn = UI.CreateFrame("Frame", "PPClose", win)
    xbtn:SetWidth(28)
    xbtn:SetHeight(28)
    xbtn:SetPoint("CENTERRIGHT", tbar, "CENTERRIGHT", -8, 0)
    xbtn:SetBackgroundColor(0.45, 0.08, 0.08, 0.85)

    local xtxt = UI.CreateFrame("Text", "PPCloseTxt", xbtn)
    xtxt:SetPoint("CENTER", xbtn, "CENTER", 0, 0)
    xtxt:SetFontSize(14)
    xtxt:SetFontColor(1, 0.5, 0.5, 1)
    xtxt:SetText("X")

    xbtn.Event.LeftClick = function()
        win:SetVisible(false); win = nil
    end
    xbtn.Event.MouseIn = function()
        xbtn:SetBackgroundColor(0.70, 0.10, 0.10, 0.95)
    end
    xbtn.Event.MouseOut = function()
        xbtn:SetBackgroundColor(0.45, 0.08, 0.08, 0.85)
    end

    -- Drag via la barre de titre (mouse events natifs RIFT)
    tbar.Event.LeftDown = function(self)
        self.dragging = true
        local m = Inspect.Mouse()
        self.ox = m.x - win:GetLeft()
        self.oy = m.y - win:GetTop()
        local l, t = win:GetLeft(), win:GetTop()
        win:ClearAll()
        win:SetPoint("TOPLEFT", UIParent, "TOPLEFT", l, t)
        win:SetWidth(W)
        win:SetHeight(H)
    end
    tbar.Event.LeftUp        = function(self) self.dragging = false end
    tbar.Event.LeftUpoutside = function(self) self.dragging = false end
    tbar.Event.MouseMove     = function(self, x, y)
        if not self.dragging then return end
        win:SetPoint("TOPLEFT", UIParent, "TOPLEFT",
            x - self.ox, y - self.oy)
    end

    -- ── Instructions ──────────────────────────────────
    local y0 = TBAR_H + 12

    local inst = UI.CreateFrame("Text", "PPInst", win)
    inst:SetPoint("TOPLEFT", win, "TOPLEFT", PAD, y0)
    inst:SetFontSize(12)
    inst:SetFontColor(COL.inst_txt[1], COL.inst_txt[2],
                      COL.inst_txt[3], COL.inst_txt[4])
    inst:SetText("Click the field below, press Ctrl+A then Ctrl+C to copy")

    local lnk = UI.CreateFrame("Text", "PPLink", win)
    lnk:SetPoint("TOPLEFT", win, "TOPLEFT", PAD, y0 + 18)
    lnk:SetFontSize(11)
    lnk:SetFontColor(COL.link_txt[1], COL.link_txt[2],
                     COL.link_txt[3], COL.link_txt[4])
    lnk:SetText("Then paste on  prancingpika.cloug.fr/account  >>  RIFT Account section")

    -- ── Champ texte ───────────────────────────────────
    local fieldY = y0 + 44
    local fieldH = H - fieldY - PAD - 22

    local ta = UI.CreateFrame("SimpleTextArea", "PPField", win)
    ta:SetPoint("TOPLEFT",  win, "TOPLEFT",  PAD,  fieldY)
    ta:SetPoint("TOPRIGHT", win, "TOPRIGHT", -PAD, fieldY)
    ta:SetHeight(fieldH)
    ta:SetBackgroundColor(COL.field_bg[1], COL.field_bg[2],
                          COL.field_bg[3], COL.field_bg[4])
    ta:SetText(exportString)
    ta:SetKeyFocus(true)

    ta.Event.TextAreaChange = function()
        ta:SetText(exportString)
        ta:SetKeyFocus(true)
    end

    -- ── Pied de fenetre ───────────────────────────────
    local foot = UI.CreateFrame("Text", "PPFoot", win)
    foot:SetPoint("BOTTOMLEFT", win, "BOTTOMLEFT", PAD, -8)
    foot:SetFontSize(10)
    foot:SetFontColor(COL.foot_txt[1], COL.foot_txt[2],
                      COL.foot_txt[3], COL.foot_txt[4])
    foot:SetText(PPData.CharCount() ..
        " character(s) included  --  drag the title bar to move")
end

function PPUI.Close()
    if win then win:SetVisible(false); win = nil end
end