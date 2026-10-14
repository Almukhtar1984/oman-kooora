-- Phase 1 (stadiums): a stadium can be owned by a dedicated owner account.
-- Adds roles 6/7/8 (stadium/academy/store owner), stadia.id_user (owner),
-- notifications.id_user (owner-targeted alerts). Idempotent — safe to re-run.

-- 1) Extend the users.role enum to 1..8 (keeps existing values).
--    MODIFY is declarative, so re-running is safe.
ALTER TABLE users
  MODIFY COLUMN role ENUM('1','2','3','4','5','6','7','8') NOT NULL DEFAULT '3';

-- 2) stadia.id_user — the owning stadium-owner account (nullable; legacy rows stay NULL).
SET @has_stadium_user := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stadia' AND COLUMN_NAME = 'id_user');
SET @sql := IF(@has_stadium_user = 0,
    'ALTER TABLE stadia ADD COLUMN id_user CHAR(36) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) notifications.id_user — user-targeted notifications (e.g. owner booking alerts).
SET @has_notif_user := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'id_user');
SET @sql := IF(@has_notif_user = 0,
    'ALTER TABLE notifications ADD COLUMN id_user CHAR(36) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
