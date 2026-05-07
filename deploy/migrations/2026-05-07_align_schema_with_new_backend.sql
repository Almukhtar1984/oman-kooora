-- Aligns the production `tomoh` MySQL schema with columns introduced by
-- omkoora-backend--main but never created in the original DB (which was
-- built by server-old).
--
-- Symptom these columns cause when missing:
--   Sequelize generates `SELECT ..., descreption, ... FROM teams` etc.
--   MySQL returns "Unknown column 'descreption'" → resolver throws →
--   the affected GraphQL query returns no data → frontend lists appear empty.
--
-- Pre-flight (run first to see whether any of these are still needed):
--   DESCRIBE teams;    -- expecting `descreption`
--   DESCRIBE clubs;    -- expecting `mohafada`
--   DESCRIBE players;  -- expecting `type`
--
-- Run order: take a backup, run this whole file in a transaction, verify, deploy backend.
--   mysqldump -u root -p tomoh > /root/backups/tomoh_$(date +%F_%H%M).sql
--   mysql -u root -p tomoh < 2026-05-07_align_schema_with_new_backend.sql

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
