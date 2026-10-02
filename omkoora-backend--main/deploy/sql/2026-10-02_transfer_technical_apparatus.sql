-- Loan/transfer for technical staff: a transfer row can now reference a
-- technical-staff member instead of a player. Idempotent — safe to re-run.

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transfers' AND COLUMN_NAME = 'id_technical_apparatus');
SET @sql := IF(@has_col = 0,
    'ALTER TABLE transfers ADD COLUMN id_technical_apparatus CHAR(36) NULL AFTER id_player',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
