-- Per-person notifications for the member portal.
--
-- Adds notifications.id_person so a member can see only the notifications that
-- concern them (a loan/transfer/sanction about their own player/technical-staff
-- /member record). Best-effort & nullable — team-wide notifications leave it
-- null. Plain column (no FK): a player/member/technical id all map to one person.
--
-- Table (plural, as Sequelize names it): `notifications`. Production UUID
-- columns are CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin (utf8mb3) — switch to
-- utf8mb4_bin if the target DB uses utf8mb4. Verify: SHOW TABLES LIKE 'notification%';
--
-- Back up first:
--   mysqldump -u <user> -p <db> notifications > backup_before_notification_person.sql
--   mysql -u <user> -p <db> < 2026-10-05_notification_person.sql
--
-- Idempotent: safe to re-run.

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'id_person');
SET @sql := IF(@c = 0,
    'ALTER TABLE notifications ADD COLUMN id_person CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @i := (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND INDEX_NAME = 'idx_notifications_person');
SET @sql := IF(@i = 0,
    'ALTER TABLE notifications ADD KEY idx_notifications_person (id_person)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
