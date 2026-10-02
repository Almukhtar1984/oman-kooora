-- Loan/transfer for technical staff: a transfer row can now reference a
-- technical-staff member instead of a player. Idempotent — safe to re-run.
--
-- The column must share technical_apparatus.id's charset/collation so the FK
-- can be created. Production UUID columns are CHAR(36) CHARACTER SET utf8
-- COLLATE utf8_bin (utf8mb3) — switch to utf8mb4_bin if the target DB uses
-- utf8mb4.

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transfers' AND COLUMN_NAME = 'id_technical_apparatus');
SET @sql := IF(@has_col = 0,
    'ALTER TABLE transfers ADD COLUMN id_technical_apparatus CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL AFTER id_player',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
