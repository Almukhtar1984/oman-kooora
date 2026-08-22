-- Committees feature (اللجان): a club creates committees (لجنة تحكيم، قانون…)
-- and adds members (name + phone) to each. Two new tables.
--
-- The UUID id / FK columns MUST match `clubs`.`id` exactly in BOTH charset and
-- collation, or InnoDB rejects the FK with "ERROR 1215 Cannot add foreign key
-- constraint". On the production DB (`tomoh`) every table is DEFAULT CHARSET=utf8
-- and every UUID column is CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin (utf8mb3),
-- so that is what is used below. VERIFY before applying elsewhere:
--   SHOW CREATE TABLE clubs\G   -- look at the `id` column
-- If your DB reports utf8mb4/utf8mb4_bin instead, swap the two occurrences
-- of `CHARACTER SET utf8 COLLATE utf8_bin` accordingly.
--
-- Apply on production (new tables — safe):
--   mysql -u <user> -p <db> < 2026-08-19_committees.sql

CREATE TABLE IF NOT EXISTS `committees` (
  `id`        CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `name`      VARCHAR(100) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `deletedAt` DATETIME NULL,
  `id_club`   CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  PRIMARY KEY (`id`),
  KEY `idx_committees_club` (`id_club`),
  CONSTRAINT `fk_committees_club` FOREIGN KEY (`id_club`) REFERENCES `clubs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `committee_members` (
  `id`           CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `name`         VARCHAR(100) NOT NULL,
  `phone`        VARCHAR(20) NULL,
  `createdAt`    DATETIME NOT NULL,
  `updatedAt`    DATETIME NOT NULL,
  `deletedAt`    DATETIME NULL,
  `id_committee` CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  PRIMARY KEY (`id`),
  KEY `idx_committee_members_committee` (`id_committee`),
  CONSTRAINT `fk_committee_members_committee` FOREIGN KEY (`id_committee`) REFERENCES `committees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
