-- Academies module (phase 1): standalone academy units with their own owner
-- account (role 7), mirroring the stadium-owner foundation. Four new tables:
--   academies, academy_programs, academy_news, academy_registrations.
-- Additive & non-breaking. Idempotent (CREATE TABLE IF NOT EXISTS) — safe to re-run.
--
-- The users.role enum already covers '1'..'8' and notifications.id_user already
-- exists (added in 2026-10-14_stadium_owner.sql), so role 7 owner accounts and
-- owner-targeted notifications need nothing extra here.
--
-- UUID id / id_* columns are CHAR(36) utf8/utf8_bin to match the existing tables
-- (teams/users use CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin on production).
-- No hard FK constraints — production runs with DB_SYNC off (like `stadia.id_user`),
-- so referential integrity is enforced in the resolvers; this avoids ERROR 1215
-- collation mismatches across environments.

CREATE TABLE IF NOT EXISTS `academies` (
  `id`        CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `name`      VARCHAR(255) NOT NULL,
  `about`     VARCHAR(1000) NULL,
  `logo`      VARCHAR(255) NULL,
  `images`    VARCHAR(500) NULL,
  `phone`     VARCHAR(30) NULL,
  `email`     VARCHAR(100) NULL,
  `mohafada`  VARCHAR(100) NULL,
  `wiliya`    VARCHAR(100) NULL,
  `id_user`   CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `deletedAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_academies_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `academy_programs` (
  `id`           CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `name`         VARCHAR(255) NOT NULL,
  `age_category` VARCHAR(100) NULL,
  `schedule`     VARCHAR(500) NULL,
  `about`        VARCHAR(500) NULL,
  `price`        DOUBLE NULL,
  `id_academy`   CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  `createdAt`    DATETIME NOT NULL,
  `updatedAt`    DATETIME NOT NULL,
  `deletedAt`    DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_academy_programs_academy` (`id_academy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `academy_news` (
  `id`         CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `title`      VARCHAR(255) NOT NULL,
  `body`       TEXT NULL,
  `image`      VARCHAR(255) NULL,
  `id_academy` CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  `createdAt`  DATETIME NOT NULL,
  `updatedAt`  DATETIME NOT NULL,
  `deletedAt`  DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_academy_news_academy` (`id_academy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `academy_registrations` (
  `id`               CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `full_name`        VARCHAR(150) NOT NULL,
  `phone`            VARCHAR(30) NOT NULL,
  `child_birth_date` DATE NULL,
  `age`              INT NULL,
  `status`           ENUM('waiting','accepted','rejected') NOT NULL DEFAULT 'waiting',
  `payment_status`   ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  `note`             VARCHAR(500) NULL,
  `id_academy`       CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  `id_program`       CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  `createdAt`        DATETIME NOT NULL,
  `updatedAt`        DATETIME NOT NULL,
  `deletedAt`        DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_academy_registrations_academy` (`id_academy`),
  KEY `idx_academy_registrations_program` (`id_program`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
