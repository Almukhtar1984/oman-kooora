-- Match-official accounts (رابعاً: إدارة المباريات).
--
-- Each match can be handed to a match official who logs in with a generated
-- code and sees only that match. This mirrors the per-league admin accounts.
--
--   * match.id_user  -> the official's users row (SET NULL if the user is gone)
--   * match.code     -> the login code shown in the league dashboard
--   * match.note     -> free-text notes printed with the match
--   * users.role adds '5' -> the match-official role
--
-- Apply manually on production (back up first):
--   mysqldump -u <user> -p tomoh matches users > backup_before_match_official.sql
--   mysql -u <user> -p tomoh < 2026-07-06_add_match_official.sql
--
-- Idempotent intent: the ADD COLUMNs fail harmlessly if already present; the
-- role MODIFY is safe to re-run (it just restates the same enum).

ALTER TABLE `matches` ADD COLUMN `id_user` CHAR(36) NULL AFTER `id_league`;
ALTER TABLE `matches` ADD COLUMN `code` VARCHAR(20) NULL AFTER `id_user`;
ALTER TABLE `matches` ADD COLUMN `note` TEXT NULL AFTER `code`;

ALTER TABLE `users` MODIFY COLUMN `role` ENUM('1','2','3','4','5') NULL DEFAULT '3';
