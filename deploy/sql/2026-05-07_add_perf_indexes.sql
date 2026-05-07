-- ============================================================================
-- Performance indexes for hot lookup paths
-- ----------------------------------------------------------------------------
-- Run manually on the production tomoh DB during a low-traffic window.
--
--     mysql -u tomoh -p tomoh < deploy/sql/2026-05-07_add_perf_indexes.sql
--
-- The script wraps each CREATE INDEX in a stored procedure that first checks
-- information_schema.statistics, because MySQL 5.7 has no
-- "CREATE INDEX IF NOT EXISTS" syntax. Re-running the file is therefore safe
-- and idempotent.
--
-- Adding a non-unique index on InnoDB takes a metadata-only sort + write of a
-- secondary B-tree. On the largest table here (people, ~21k rows) this is
-- under a second. ALTER TABLE ... ADD INDEX briefly takes a metadata lock,
-- so still prefer running outside of peak hours.
--
-- Coverage rationale (from the audit report):
--   * people: 20,891 rows, only PRIMARY index. Any lookup by card_number or
--     phone (used by SearchPerson modal, createPlayer's duplicate guard, and
--     the personExternal query) is currently a full scan.
--   * players: 19,164 rows. status / type / class are filtered in the
--     dashboard and player-list pages without any supporting index.
--   * members: 1,023 rows. status / classification are filtered in the
--     "members" tab on every page load.
--   * requests: status / type are the two columns the inbox/outbox UI
--     filters on; id_club / id_team_to do not exist on this table — the
--     tenant link is via requests.id_player → players.id_team, which is
--     already covered by the existing players.id_team index.
-- ============================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS _create_index_if_missing //

CREATE PROCEDURE _create_index_if_missing(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_columns VARCHAR(255)
)
BEGIN
    DECLARE existing INT DEFAULT 0;

    SELECT COUNT(*) INTO existing
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name   = p_table
      AND index_name   = p_index;

    IF existing = 0 THEN
        SET @ddl = CONCAT('CREATE INDEX `', p_index, '` ON `', p_table, '` (', p_columns, ')');
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DELIMITER ;

-- people (~21k rows)
CALL _create_index_if_missing('people',  'idx_people_card_number',     '`card_number`');
CALL _create_index_if_missing('people',  'idx_people_phone',           '`phone`');

-- players (~19k rows)
CALL _create_index_if_missing('players', 'idx_players_status',         '`status`');
CALL _create_index_if_missing('players', 'idx_players_type',           '`type`');
CALL _create_index_if_missing('players', 'idx_players_class',          '`class`');

-- members (~1k rows; small but filtered constantly)
CALL _create_index_if_missing('members', 'idx_members_status',         '`status`');
CALL _create_index_if_missing('members', 'idx_members_classification', '`classification`');

-- requests (small today, but the filter set is fixed)
CALL _create_index_if_missing('requests', 'idx_requests_status',       '`status`');
CALL _create_index_if_missing('requests', 'idx_requests_type',         '`type`');

DROP PROCEDURE _create_index_if_missing;
