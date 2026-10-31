-- تسجيل الفريق طلبٌ على الطريق كالأربعة.
--
-- The client counted team registration with the four requests: a team the club
-- creates pays its registration fee and adds players only after the final
-- approval.
--
-- request_flows.request_type — 'team_registration'.
--
-- Its own file, not a block appended to 2026-10-31_request_road.sql: the
-- migration ledger runs a file once by name, so an edit to a file a server has
-- already applied would never run there.
--
-- Additive and idempotent — safe to re-run. No row changes.

SET @has_team_reg := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'request_flows'
      AND COLUMN_NAME = 'request_type' AND COLUMN_TYPE LIKE '%team_registration%');
SET @sql := IF(@has_team_reg = 0,
    'ALTER TABLE request_flows MODIFY COLUMN request_type ENUM(''player_registration'',''transfer'',''loan'',''player_release'',''team_registration'') NOT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
