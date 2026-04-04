-- Migration: add RIFT account linking (riftAccountId, RiftCharacter)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Colonnes de liaison RIFT sur web_accounts
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `web_accounts`
    ADD COLUMN IF NOT EXISTS `riftAccountId` VARCHAR(128) NULL,
    ADD COLUMN IF NOT EXISTS `riftLinkedAt`  DATETIME(3)  NULL,
    ADD COLUMN IF NOT EXISTS `riftLocked`    BOOLEAN      NOT NULL DEFAULT false;

ALTER TABLE `web_accounts`
    ADD UNIQUE INDEX IF NOT EXISTS `web_accounts_riftAccountId_key` (`riftAccountId`);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Table rift_characters
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `rift_characters` (
    `id`           BIGINT       NOT NULL AUTO_INCREMENT,
    `webAccountId` BIGINT       NOT NULL,
    `name`         VARCHAR(128) NOT NULL,
    `shard`        VARCHAR(64)  NOT NULL,
    `calling`      VARCHAR(64)  NOT NULL,
    `level`        INT          NOT NULL,
    `guild`        VARCHAR(128) NULL,
    `lastSeenAt`   DATETIME(3)  NOT NULL,
    UNIQUE INDEX `rift_characters_name_shard_key` (`name`, `shard`),
    INDEX `rift_characters_webAccountId_idx` (`webAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `rift_characters`
    ADD CONSTRAINT `rift_characters_webAccountId_fkey`
        FOREIGN KEY (`webAccountId`) REFERENCES `web_accounts`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE;
