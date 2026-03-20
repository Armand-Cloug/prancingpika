-- prisma/migrations/0001_initial/migration.sql
-- Migration initiale — schéma hybride PrancingPika + PrancingTurtle
-- À appliquer via : npx prisma migrate deploy
-- Ou manuellement : mysql -u user -p database < migration.sql

SET NAMES 'utf8mb4';
SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- instances
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `instances` (
  `id`        BIGINT NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(128) NOT NULL,
  `shortName` VARCHAR(32)  NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `instances_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- bosses
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bosses` (
  `id`          BIGINT NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(128) NOT NULL,
  `displayName` VARCHAR(128) NULL,
  `instanceId`  BIGINT       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bosses_name_key` (`name`),
  KEY `bosses_instanceId_idx` (`instanceId`),
  CONSTRAINT `bosses_instanceId_fk` FOREIGN KEY (`instanceId`)
    REFERENCES `instances` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- abilities — ability_id Rift comme PK (pas autoincrement)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `abilities` (
  `id`          BIGINT      NOT NULL,   -- = ability_id du log Rift (field[8])
  `name`        VARCHAR(128) NOT NULL,  -- nom tel que vu (peut être FR ou EN)
  `damageType`  VARCHAR(32)  NULL,      -- "Physical", "Fire", etc. (normalisé EN)
  `firstSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `abilities_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- groups
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `groups` (
  `id`         BIGINT NOT NULL AUTO_INCREMENT,
  `rosterHash` CHAR(40)     NOT NULL,  -- sha1 hex
  `rosterSize` INT          NOT NULL,
  `label`      VARCHAR(128) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `groups_rosterHash_key` (`rosterHash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- players
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `players` (
  `id`    BIGINT NOT NULL AUTO_INCREMENT,
  `name`  VARCHAR(128) NOT NULL,
  `class` VARCHAR(32)  NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `players_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- web_accounts
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `web_accounts` (
  `id`                BIGINT NOT NULL AUTO_INCREMENT,
  `provider`          ENUM('google','discord') NOT NULL,
  `providerAccountId` VARCHAR(128) NOT NULL,
  `pseudo`            VARCHAR(128) NOT NULL,
  `email`             VARCHAR(191) NULL,
  `imageUrl`          VARCHAR(255) NULL,
  `createdAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastLogin`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `web_accounts_provider_providerAccountId_key` (`provider`, `providerAccountId`),
  KEY `web_accounts_pseudo_idx` (`pseudo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- guilds
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `guilds` (
  `id`        BIGINT NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(128) NOT NULL,
  `tag`       VARCHAR(16)  NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `guilds_name_key` (`name`),
  UNIQUE KEY `guilds_tag_key`  (`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- guild_members
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `guild_members` (
  `guildId`   BIGINT NOT NULL,
  `accountId` BIGINT NOT NULL,
  `role`      ENUM('OWNER','OFFICER','MEMBER') NOT NULL DEFAULT 'MEMBER',
  `joinedAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`guildId`, `accountId`),
  KEY `guild_members_accountId_idx` (`accountId`),
  KEY `guild_members_guildId_idx`   (`guildId`),
  CONSTRAINT `guild_members_guildId_fk`
    FOREIGN KEY (`guildId`)   REFERENCES `guilds`       (`id`) ON DELETE CASCADE,
  CONSTRAINT `guild_members_accountId_fk`
    FOREIGN KEY (`accountId`) REFERENCES `web_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- runs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `runs` (
  `id`             BIGINT NOT NULL AUTO_INCREMENT,
  `bossId`         BIGINT NOT NULL,
  `groupId`        BIGINT NOT NULL,
  `guildId`        BIGINT NOT NULL,
  `uploaderId`     BIGINT NOT NULL,
  `startedAt`      DATETIME(3) NOT NULL,
  `endedAt`        DATETIME(3) NOT NULL,
  `durationTotalS` INT    NOT NULL,
  `bossDurationS`  INT    NULL,
  `totalDamage`    BIGINT NOT NULL DEFAULT 0,
  `totalHealing`   BIGINT NOT NULL DEFAULT 0,
  `totalAbsorbed`  BIGINT NOT NULL DEFAULT 0,
  `dpsGroup`       DOUBLE NOT NULL DEFAULT 0,
  `hpsGroup`       DOUBLE NOT NULL DEFAULT 0,
  `apsGroup`       DOUBLE NOT NULL DEFAULT 0,
  `logFile`        VARCHAR(255) NULL,
  `createdAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `runs_bossId_idx`                   (`bossId`),
  KEY `runs_groupId_idx`                  (`groupId`),
  KEY `runs_guildId_idx`                  (`guildId`),
  KEY `runs_uploaderId_idx`               (`uploaderId`),
  KEY `runs_bossId_durationTotalS_idx`    (`bossId`, `durationTotalS`),
  KEY `runs_bossId_groupId_duration_idx`  (`bossId`, `groupId`, `durationTotalS`),
  KEY `runs_guildId_bossId_duration_idx`  (`guildId`, `bossId`, `durationTotalS`),
  KEY `runs_uploaderId_createdAt_idx`     (`uploaderId`, `createdAt`),
  CONSTRAINT `runs_bossId_fk`     FOREIGN KEY (`bossId`)     REFERENCES `bosses`       (`id`) ON DELETE RESTRICT,
  CONSTRAINT `runs_groupId_fk`    FOREIGN KEY (`groupId`)    REFERENCES `groups`       (`id`) ON DELETE RESTRICT,
  CONSTRAINT `runs_guildId_fk`    FOREIGN KEY (`guildId`)    REFERENCES `guilds`       (`id`) ON DELETE RESTRICT,
  CONSTRAINT `runs_uploaderId_fk` FOREIGN KEY (`uploaderId`) REFERENCES `web_accounts` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- run_players
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `run_players` (
  `runId`    BIGINT NOT NULL,
  `playerId` BIGINT NOT NULL,
  `damage`   BIGINT NOT NULL DEFAULT 0,
  `healing`  BIGINT NOT NULL DEFAULT 0,
  `absorbed` BIGINT NOT NULL DEFAULT 0,
  `overheal` BIGINT NOT NULL DEFAULT 0,
  `blocked`  BIGINT NOT NULL DEFAULT 0,
  `dps`      DOUBLE NOT NULL DEFAULT 0,
  `hps`      DOUBLE NOT NULL DEFAULT 0,
  `aps`      DOUBLE NOT NULL DEFAULT 0,
  `role`     VARCHAR(32) NULL,
  PRIMARY KEY (`runId`, `playerId`),
  KEY `run_players_playerId_idx`  (`playerId`),
  KEY `run_players_runId_dps_idx` (`runId`, `dps`),
  KEY `run_players_runId_hps_idx` (`runId`, `hps`),
  KEY `run_players_runId_aps_idx` (`runId`, `aps`),
  CONSTRAINT `run_players_runId_fk`
    FOREIGN KEY (`runId`)    REFERENCES `runs`    (`id`) ON DELETE CASCADE,
  CONSTRAINT `run_players_playerId_fk`
    FOREIGN KEY (`playerId`) REFERENCES `players` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- run_player_abilities
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `run_player_abilities` (
  `id`          BIGINT NOT NULL AUTO_INCREMENT,
  `runId`       BIGINT NOT NULL,
  `playerId`    BIGINT NOT NULL,
  `kind`        ENUM('DAMAGE','HEAL','ABSORB') NOT NULL DEFAULT 'DAMAGE',
  `abilityId`   BIGINT      NOT NULL,  -- FK vers abilities.id (ability_id Rift)
  `abilityName` VARCHAR(128) NOT NULL, -- nom d'affichage seulement
  `total`       BIGINT  NOT NULL DEFAULT 0,
  `hits`        INT     NOT NULL DEFAULT 0,
  `critRate`    DOUBLE  NOT NULL DEFAULT 0,
  `minHit`      INT     NOT NULL DEFAULT 0,
  `maxHit`      INT     NOT NULL DEFAULT 0,
  `avgHit`      DOUBLE  NOT NULL DEFAULT 0,
  `rate`        DOUBLE  NOT NULL DEFAULT 0,
  `pct`         DOUBLE  NOT NULL DEFAULT 0,
  `absorbed`    BIGINT  NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rpa_unique` (`runId`, `playerId`, `kind`, `abilityId`),
  KEY `rpa_runId_playerId_idx` (`runId`, `playerId`),
  KEY `rpa_runId_kind_idx`     (`runId`, `kind`),
  KEY `rpa_abilityId_idx`      (`abilityId`),
  CONSTRAINT `rpa_runPlayer_fk`
    FOREIGN KEY (`runId`, `playerId`) REFERENCES `run_players` (`runId`, `playerId`) ON DELETE CASCADE,
  CONSTRAINT `rpa_abilityId_fk`
    FOREIGN KEY (`abilityId`) REFERENCES `abilities` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- run_deaths
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `run_deaths` (
  `id`            BIGINT NOT NULL AUTO_INCREMENT,
  `runId`         BIGINT NOT NULL,
  `playerId`      BIGINT NOT NULL,
  `deathCount`    INT    NOT NULL DEFAULT 0,
  `firstDeathSec` INT    NULL,
  `lastDeathSec`  INT    NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `run_deaths_unique` (`runId`, `playerId`),
  KEY `run_deaths_runId_idx` (`runId`),
  CONSTRAINT `run_deaths_runId_fk`
    FOREIGN KEY (`runId`)    REFERENCES `runs`    (`id`) ON DELETE CASCADE,
  CONSTRAINT `run_deaths_playerId_fk`
    FOREIGN KEY (`playerId`) REFERENCES `players` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- run_buffs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `run_buffs` (
  `id`             BIGINT NOT NULL AUTO_INCREMENT,
  `runId`          BIGINT NOT NULL,
  `buffName`       VARCHAR(128) NOT NULL,
  `totalUptimeSec` INT    NOT NULL DEFAULT 0,
  `uptimePct`      DOUBLE NOT NULL DEFAULT 0,
  `sourcePlayer`   VARCHAR(128) NULL,
  PRIMARY KEY (`id`),
  KEY `run_buffs_runId_idx` (`runId`),
  CONSTRAINT `run_buffs_runId_fk`
    FOREIGN KEY (`runId`) REFERENCES `runs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
