-- One-shot SQL patch — NOT a Sequelize migration.
-- omkoora-backend--main has no migration runner; run this directly with
-- the mysql CLI on the production server.
--
-- Aligns the `tomoh` schema with columns declared by omkoora-backend--main's
-- models that are missing from the existing DB.
--
-- Why it matters: Sequelize selects every defined attribute, so a query like
--   SELECT id, name, ..., descreption FROM teams
-- raises "Unknown column 'descreption'" and the resolver throws, leaving
-- the team/club/player lists empty in the dashboards.
--
-- Pre-flight: confirm the columns are actually missing before running.
--   DESCRIBE teams;    -- expecting `descreption`
--   DESCRIBE clubs;    -- expecting `mohafada`
--   DESCRIBE players;  -- expecting `type`
--
-- Run order:
--   mysqldump -u root -p tomoh > /root/backups/tomoh_$(date +%F_%H%M).sql
--   mysql -u root -p tomoh < deploy/sql/2026-05-07_align_schema_with_new_backend.sql

START TRANSACTION;

-- 1) teams.descreption — required by Models/Team.mjs (allowNull: false, default).
ALTER TABLE teams
  ADD COLUMN descreption VARCHAR(500) NOT NULL DEFAULT 'نبذة عن الفريق';

-- 2) clubs.mohafada — Omani governorate enum, nullable in Models/Club.mjs.
ALTER TABLE clubs
  ADD COLUMN mohafada ENUM(
    'ظفار',
    'مسندم',
    'البريمي',
    'الداخلية',
    'شمال الباطنة',
    'جنوب الباطنة',
    'شمال الشرقية',
    'جنوب الشرقية',
    'الظاهرة',
    'الوسطى',
    'مسقط'
  ) NULL;

-- 3) players.type — required by Models/Players.mjs (allowNull: false, default 'internal').
ALTER TABLE players
  ADD COLUMN type ENUM('internal', 'external') NOT NULL DEFAULT 'internal';

-- 4) players.status — extend the existing enum to include the new 'suspended' value
--    used by the new sanctions feature. Existing rows are unaffected.
ALTER TABLE players
  MODIFY COLUMN status ENUM('accepted', 'rejected', 'waiting', 'waiting_club', 'suspended')
  DEFAULT 'waiting';

COMMIT;

-- Verify:
--   DESCRIBE teams;
--   DESCRIBE clubs;
--   DESCRIBE players;
--   SELECT COUNT(*) FROM teams WHERE descreption IS NULL;   -- expect 0
--   SELECT COUNT(*) FROM players WHERE type IS NULL;        -- expect 0
