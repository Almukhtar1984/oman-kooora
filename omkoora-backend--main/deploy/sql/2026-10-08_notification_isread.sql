-- Fix: production `notifications` has no isRead column.
--
-- The Sequelize model (src/Models/Notification.mjs) defines isRead (BOOLEAN,
-- default false), so every SELECT lists it and every INSERT sets it. The prod
-- table was created before that column existed, so portalMyNotifications 500s
-- with "Unknown column 'isRead' in 'field list'" and CreateNotification* inserts
-- fail the same way. Add the column to match the model.
--
-- Sequelize maps BOOLEAN -> TINYINT(1) and defaultValue:false -> DEFAULT 0, with
-- allowNull defaulting to true. ADD COLUMN ... DEFAULT 0 backfills existing rows
-- to 0 (unread).
--
-- Table (plural, as Sequelize names it): `notifications`.
--
-- Back up first:
--   mysqldump -u <user> -p <db> notifications > backup_before_notification_isread.sql
--   mysql -u <user> -p <db> < 2026-10-08_notification_isread.sql
--
-- Idempotent: safe to re-run.

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'isRead');
SET @sql := IF(@c = 0,
    'ALTER TABLE notifications ADD COLUMN isRead TINYINT(1) NULL DEFAULT 0',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
