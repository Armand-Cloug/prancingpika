-- Migration: add columns introduced after initial deployment
-- Uses IF NOT EXISTS throughout — safe to run on any DB state.

-- runs: absorbed totals + APS group stat
ALTER TABLE `runs`
  ADD COLUMN IF NOT EXISTS `totalAbsorbed` BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `apsGroup`      DOUBLE NOT NULL DEFAULT 0;

-- run_players: per-player absorbed / overheal / blocked / APS + spec
ALTER TABLE `run_players`
  ADD COLUMN IF NOT EXISTS `absorbed` BIGINT      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `overheal` BIGINT      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `blocked`  BIGINT      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `aps`      DOUBLE      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `spec`     VARCHAR(64) NULL;

-- Index on (runId, aps) used for leaderboard queries
ALTER TABLE `run_players`
  ADD INDEX IF NOT EXISTS `run_players_runId_aps_idx` (`runId`, `aps`);

-- run_player_abilities: absorbed portion (shields)
ALTER TABLE `run_player_abilities`
  ADD COLUMN IF NOT EXISTS `absorbed` BIGINT NOT NULL DEFAULT 0;
