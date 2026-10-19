-- Multi-stage transfer/loan approval chain: team → own club → destination club.
-- Adds transfers.id_club_from (the player's own club, first approver) and extends
-- transfers.status with the stage values. Idempotent — safe to re-run.

-- 1) Extend the status enum (MODIFY is declarative, so re-running is safe).
--    Keeps the legacy 'waiting' value for old rows.
ALTER TABLE transfers
  MODIFY COLUMN status ENUM('accepted','rejected','waiting','waiting_club_from','waiting_club_to')
  NULL DEFAULT 'waiting_club_from';

-- 2) transfers.id_club_from — the from-team's club (nullable; legacy rows stay NULL).
SET @has_club_from := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transfers' AND COLUMN_NAME = 'id_club_from');
SET @sql := IF(@has_club_from = 0,
    'ALTER TABLE transfers ADD COLUMN id_club_from CHAR(36) NULL AFTER id_club_to',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
