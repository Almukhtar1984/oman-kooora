-- FCM push: store each user's device token so the server can push a
-- notification while the app is closed. Idempotent — safe to re-run.

SET @has_token := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'fcm_token');
SET @sql := IF(@has_token = 0,
    'ALTER TABLE users ADD COLUMN fcm_token VARCHAR(512) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_platform := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'fcm_platform');
SET @sql := IF(@has_platform = 0,
    'ALTER TABLE users ADD COLUMN fcm_platform VARCHAR(20) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
