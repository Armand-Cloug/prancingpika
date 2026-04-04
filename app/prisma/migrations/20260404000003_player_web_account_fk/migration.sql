-- AlterTable: add nullable webAccountId to players
ALTER TABLE `players` ADD COLUMN `webAccountId` BIGINT NULL;

-- CreateIndex
CREATE INDEX `players_webAccountId_idx` ON `players`(`webAccountId`);

-- AddForeignKey: ON DELETE SET NULL so removing a WebAccount just un-links the player
ALTER TABLE `players` ADD CONSTRAINT `players_webAccountId_fkey`
  FOREIGN KEY (`webAccountId`) REFERENCES `web_accounts`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
