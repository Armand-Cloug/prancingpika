-- CreateTable
CREATE TABLE `instances` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(128) NOT NULL,
    `shortName` VARCHAR(32) NULL,

    UNIQUE INDEX `instances_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bosses` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(128) NOT NULL,
    `displayName` VARCHAR(128) NULL,
    `instanceId` BIGINT NULL,

    UNIQUE INDEX `bosses_name_key`(`name`),
    INDEX `bosses_instanceId_idx`(`instanceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `abilities` (
    `id` BIGINT NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `damageType` VARCHAR(32) NULL,
    `firstSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `abilities_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groups` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `rosterHash` CHAR(40) NOT NULL,
    `rosterSize` INTEGER NOT NULL,
    `label` VARCHAR(128) NULL,

    UNIQUE INDEX `groups_rosterHash_key`(`rosterHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `players` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(128) NOT NULL,
    `class` VARCHAR(32) NULL,

    UNIQUE INDEX `players_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `web_accounts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `provider` ENUM('google', 'discord') NOT NULL,
    `providerAccountId` VARCHAR(128) NOT NULL,
    `pseudo` VARCHAR(128) NOT NULL,
    `email` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastLogin` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `web_accounts_pseudo_idx`(`pseudo`),
    UNIQUE INDEX `web_accounts_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guilds` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(128) NOT NULL,
    `tag` VARCHAR(16) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `guilds_name_key`(`name`),
    UNIQUE INDEX `guilds_tag_key`(`tag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guild_members` (
    `guildId` BIGINT NOT NULL,
    `accountId` BIGINT NOT NULL,
    `role` ENUM('OWNER', 'OFFICER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `guild_members_accountId_idx`(`accountId`),
    INDEX `guild_members_guildId_idx`(`guildId`),
    PRIMARY KEY (`guildId`, `accountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `runs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `bossId` BIGINT NOT NULL,
    `groupId` BIGINT NOT NULL,
    `guildId` BIGINT NOT NULL,
    `uploaderId` BIGINT NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `endedAt` DATETIME(3) NOT NULL,
    `durationTotalS` INTEGER NOT NULL,
    `bossDurationS` INTEGER NULL,
    `totalDamage` BIGINT NOT NULL,
    `totalHealing` BIGINT NOT NULL,
    `totalAbsorbed` BIGINT NOT NULL DEFAULT 0,
    `dpsGroup` DOUBLE NOT NULL,
    `hpsGroup` DOUBLE NOT NULL,
    `apsGroup` DOUBLE NOT NULL DEFAULT 0,
    `logFile` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `runs_bossId_idx`(`bossId`),
    INDEX `runs_groupId_idx`(`groupId`),
    INDEX `runs_guildId_idx`(`guildId`),
    INDEX `runs_uploaderId_idx`(`uploaderId`),
    INDEX `runs_bossId_durationTotalS_idx`(`bossId`, `durationTotalS`),
    INDEX `runs_bossId_groupId_durationTotalS_idx`(`bossId`, `groupId`, `durationTotalS`),
    INDEX `runs_guildId_bossId_durationTotalS_idx`(`guildId`, `bossId`, `durationTotalS`),
    INDEX `runs_uploaderId_createdAt_idx`(`uploaderId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `run_players` (
    `runId` BIGINT NOT NULL,
    `playerId` BIGINT NOT NULL,
    `damage` BIGINT NOT NULL,
    `healing` BIGINT NOT NULL,
    `absorbed` BIGINT NOT NULL DEFAULT 0,
    `overheal` BIGINT NOT NULL DEFAULT 0,
    `blocked` BIGINT NOT NULL DEFAULT 0,
    `dps` DOUBLE NOT NULL,
    `hps` DOUBLE NOT NULL,
    `aps` DOUBLE NOT NULL DEFAULT 0,
    `role` VARCHAR(32) NULL,

    INDEX `run_players_playerId_idx`(`playerId`),
    INDEX `run_players_runId_dps_idx`(`runId`, `dps`),
    INDEX `run_players_runId_hps_idx`(`runId`, `hps`),
    INDEX `run_players_runId_aps_idx`(`runId`, `aps`),
    PRIMARY KEY (`runId`, `playerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `run_player_abilities` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `runId` BIGINT NOT NULL,
    `playerId` BIGINT NOT NULL,
    `kind` ENUM('DAMAGE', 'HEAL', 'ABSORB') NOT NULL DEFAULT 'DAMAGE',
    `abilityId` BIGINT NOT NULL,
    `abilityName` VARCHAR(128) NOT NULL,
    `total` BIGINT NOT NULL,
    `hits` INTEGER NOT NULL,
    `critRate` DOUBLE NOT NULL,
    `minHit` INTEGER NOT NULL,
    `maxHit` INTEGER NOT NULL,
    `avgHit` DOUBLE NOT NULL,
    `rate` DOUBLE NOT NULL,
    `pct` DOUBLE NOT NULL,
    `absorbed` BIGINT NOT NULL DEFAULT 0,

    INDEX `run_player_abilities_runId_playerId_idx`(`runId`, `playerId`),
    INDEX `run_player_abilities_runId_kind_idx`(`runId`, `kind`),
    INDEX `run_player_abilities_abilityId_idx`(`abilityId`),
    UNIQUE INDEX `run_player_abilities_runId_playerId_kind_abilityId_key`(`runId`, `playerId`, `kind`, `abilityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `run_deaths` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `runId` BIGINT NOT NULL,
    `playerId` BIGINT NOT NULL,
    `deathCount` INTEGER NOT NULL,
    `firstDeathSec` INTEGER NULL,
    `lastDeathSec` INTEGER NULL,

    INDEX `run_deaths_runId_idx`(`runId`),
    UNIQUE INDEX `run_deaths_runId_playerId_key`(`runId`, `playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `run_buffs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `runId` BIGINT NOT NULL,
    `buffName` VARCHAR(128) NOT NULL,
    `totalUptimeSec` INTEGER NOT NULL,
    `uptimePct` DOUBLE NOT NULL,
    `sourcePlayer` VARCHAR(128) NULL,

    INDEX `run_buffs_runId_idx`(`runId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bosses` ADD CONSTRAINT `bosses_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `instances`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guild_members` ADD CONSTRAINT `guild_members_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guilds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guild_members` ADD CONSTRAINT `guild_members_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `web_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `runs` ADD CONSTRAINT `runs_bossId_fkey` FOREIGN KEY (`bossId`) REFERENCES `bosses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `runs` ADD CONSTRAINT `runs_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `runs` ADD CONSTRAINT `runs_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guilds`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `runs` ADD CONSTRAINT `runs_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `web_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `run_players` ADD CONSTRAINT `run_players_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `runs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `run_players` ADD CONSTRAINT `run_players_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `run_player_abilities` ADD CONSTRAINT `run_player_abilities_abilityId_fkey` FOREIGN KEY (`abilityId`) REFERENCES `abilities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `run_player_abilities` ADD CONSTRAINT `run_player_abilities_runId_playerId_fkey` FOREIGN KEY (`runId`, `playerId`) REFERENCES `run_players`(`runId`, `playerId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `run_deaths` ADD CONSTRAINT `run_deaths_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `runs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `run_deaths` ADD CONSTRAINT `run_deaths_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `run_buffs` ADD CONSTRAINT `run_buffs_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `runs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
