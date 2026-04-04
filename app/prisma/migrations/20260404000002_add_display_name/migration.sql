-- AlterTable: add displayName to web_accounts
ALTER TABLE `web_accounts` ADD COLUMN `displayName` VARCHAR(32) NULL;
ALTER TABLE `web_accounts` ADD UNIQUE INDEX `web_accounts_displayName_key`(`displayName`);
