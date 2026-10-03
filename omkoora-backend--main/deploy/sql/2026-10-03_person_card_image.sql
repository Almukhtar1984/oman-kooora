-- Portal (mobile app): let a member upload a photo of their card, stored on the
-- person and returned by portalMe. Idempotent — safe to re-run.

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'people' AND COLUMN_NAME = 'card_image');
SET @sql := IF(@has_col = 0,
    'ALTER TABLE people ADD COLUMN card_image VARCHAR(100) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
