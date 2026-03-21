-- Migration: align preprod/prod schema with current Prisma schema
-- Safe to run on any DB state (IF NOT EXISTS on tables/columns; no IF NOT EXISTS on FK constraints
-- since MariaDB does not support it — these are new relationships that did not exist before).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create missing tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `abilities` (
    `id`          BIGINT       NOT NULL,
    `name`        VARCHAR(128) NOT NULL,
    `damageType`  VARCHAR(32)  NULL,
    `firstSeenAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `abilities_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `run_deaths` (
    `id`            BIGINT NOT NULL AUTO_INCREMENT,
    `runId`         BIGINT NOT NULL,
    `playerId`      BIGINT NOT NULL,
    `deathCount`    INT    NOT NULL,
    `firstDeathSec` INT    NULL,
    `lastDeathSec`  INT    NULL,
    UNIQUE INDEX `run_deaths_runId_playerId_key`(`runId`, `playerId`),
    INDEX `run_deaths_runId_idx`(`runId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `run_buffs` (
    `id`             BIGINT       NOT NULL AUTO_INCREMENT,
    `runId`          BIGINT       NOT NULL,
    `buffName`       VARCHAR(128) NOT NULL,
    `totalUptimeSec` INT          NOT NULL,
    `uptimePct`      DOUBLE       NOT NULL,
    `sourcePlayer`   VARCHAR(128) NULL,
    INDEX `run_buffs_runId_idx`(`runId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Add missing columns and FK to bosses
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `bosses`
    ADD COLUMN IF NOT EXISTS `displayName` VARCHAR(128) NULL,
    ADD COLUMN IF NOT EXISTS `instanceId`  BIGINT       NULL;

ALTER TABLE `bosses`
    ADD INDEX IF NOT EXISTS `bosses_instanceId_idx` (`instanceId`);

ALTER TABLE `bosses`
    ADD CONSTRAINT `bosses_instanceId_fkey`
        FOREIGN KEY (`instanceId`) REFERENCES `instances`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Migrate run_player_abilities to abilityId-based schema
--    Old schema used abilityName as unique key; new schema uses abilityId FK.
--    Existing rows have no real Rift ability IDs → clear them first.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `run_player_abilities`
    DROP FOREIGN KEY  IF EXISTS `run_player_abilities_abilityId_fkey`,
    DROP INDEX        IF EXISTS `run_player_abilities_runId_playerId_kind_abilityName_key`,
    DROP INDEX        IF EXISTS `run_player_abilities_abilityName_idx`,
    DROP INDEX        IF EXISTS `run_player_abilities_runId_playerId_kind_abilityId_key`,
    DROP INDEX        IF EXISTS `run_player_abilities_abilityId_idx`;

TRUNCATE TABLE `run_player_abilities`;

ALTER TABLE `run_player_abilities`
    ADD COLUMN IF NOT EXISTS `abilityId` BIGINT NOT NULL DEFAULT 0,
    MODIFY COLUMN `kind` ENUM('DAMAGE', 'HEAL', 'ABSORB') NOT NULL DEFAULT 'DAMAGE';

ALTER TABLE `run_player_abilities`
    ADD UNIQUE INDEX `run_player_abilities_runId_playerId_kind_abilityId_key` (`runId`, `playerId`, `kind`, `abilityId`),
    ADD INDEX        `run_player_abilities_abilityId_idx` (`abilityId`);

ALTER TABLE `run_player_abilities`
    ADD CONSTRAINT `run_player_abilities_abilityId_fkey`
        FOREIGN KEY (`abilityId`) REFERENCES `abilities`(`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Add FKs for newly created tables
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `run_deaths`
    ADD CONSTRAINT `run_deaths_runId_fkey`
        FOREIGN KEY (`runId`)    REFERENCES `runs`(`id`)    ON DELETE CASCADE  ON UPDATE CASCADE,
    ADD CONSTRAINT `run_deaths_playerId_fkey`
        FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `run_buffs`
    ADD CONSTRAINT `run_buffs_runId_fkey`
        FOREIGN KEY (`runId`) REFERENCES `runs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
