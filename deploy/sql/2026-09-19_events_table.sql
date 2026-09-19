-- Team events (فعاليات الفريق): the `events` table exists in the models since
-- the team-events feature but was never created on production (DB_SYNC is off
-- there), so every `events` query failed with:
--   Table 'tomoh.events' doesn't exist
-- That single missing table also took down the whole statistics payload
-- (FetchAllData / SearchData) once platform totals started counting events —
-- the mobile app showed "ServerFailure(Failed to fetch all data, null)".
-- The resolver no longer fails because of it (a missing table counts as 0),
-- but the feature itself needs the table.
--
-- The UUID id / FK columns MUST match `teams`.`id` exactly in BOTH charset and
-- collation, or InnoDB rejects the FK with "ERROR 1215 Cannot add foreign key
-- constraint". Production (`tomoh`) uses CHAR(36) CHARACTER SET utf8
-- COLLATE utf8_bin (utf8mb3). VERIFY before applying elsewhere:
--   SHOW CREATE TABLE teams\G   -- look at the `id` column
-- If your DB reports utf8mb4/utf8mb4_bin instead, swap both occurrences.
--
-- Apply on production (new table — safe, additive):
--   mysql -u <user> -p <db> < 2026-09-19_events_table.sql

CREATE TABLE IF NOT EXISTS `events` (
  `id`          CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `id_team`     CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `date`        DATETIME NOT NULL,
  `images`      TEXT NULL COMMENT 'JSON array of image paths',
  `createdAt`   DATETIME NOT NULL,
  `updatedAt`   DATETIME NOT NULL,
  `deletedAt`   DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_events_team` (`id_team`),
  CONSTRAINT `fk_events_team` FOREIGN KEY (`id_team`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
