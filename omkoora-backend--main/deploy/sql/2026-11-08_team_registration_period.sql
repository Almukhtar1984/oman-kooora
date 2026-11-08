-- مدة تسجيل الفريق: من وإلى.
--
-- The client, 2026-11-08: when a club adds a team it sets the registration
-- period, and «بعدما ينتهي التاريخ مباشرة … يعمل توقيف حساب الفريق» — no
-- account may enter the team until the club activates it again.
--
-- teams.registration_start — the day the team's registration starts (shown).
-- teams.registration_end   — the last day it is valid. The day after, the team
--                            is suspended: its accounts cannot sign in, and the
--                            nightly job turns account_status off.
-- Both NULL for every existing team: nothing expires until a club sets a date.
--
-- Additive and idempotent — safe to re-run. No row changes.

SET @has_start := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teams' AND COLUMN_NAME = 'registration_start');
SET @sql := IF(@has_start = 0,
    'ALTER TABLE teams ADD COLUMN registration_start DATE NULL AFTER account_status',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_end := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teams' AND COLUMN_NAME = 'registration_end');
SET @sql := IF(@has_end = 0,
    'ALTER TABLE teams ADD COLUMN registration_end DATE NULL AFTER registration_start',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
