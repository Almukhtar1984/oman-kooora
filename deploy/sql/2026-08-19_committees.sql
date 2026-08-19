-- Committees feature (اللجان): a club creates committees (لجنة تحكيم، قانون…)
-- and adds members (name + phone) to each. Two new tables.
--
-- The UUID id / FK columns use COLLATE utf8mb4_bin to match the existing
-- `clubs`.`id` column (Sequelize UUID => CHAR(36) utf8mb4_bin); FK creation
-- fails otherwise.
--
-- Apply on production (new tables — safe):
--   mysql -u <user> -p <db> < 2026-08-19_committees.sql

CREATE TABLE IF NOT EXISTS `committees` (
  `id`        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name`      VARCHAR(100) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `deletedAt` DATETIME NULL,
  `id_club`   CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  PRIMARY KEY (`id`),
  KEY `idx_committees_club` (`id_club`),
  CONSTRAINT `fk_committees_club` FOREIGN KEY (`id_club`) REFERENCES `clubs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `committee_members` (
  `id`           CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name`         VARCHAR(100) NOT NULL,
  `phone`        VARCHAR(20) NULL,
  `createdAt`    DATETIME NOT NULL,
  `updatedAt`    DATETIME NOT NULL,
  `deletedAt`    DATETIME NULL,
  `id_committee` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  PRIMARY KEY (`id`),
  KEY `idx_committee_members_committee` (`id_committee`),
  CONSTRAINT `fk_committee_members_committee` FOREIGN KEY (`id_committee`) REFERENCES `committees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
