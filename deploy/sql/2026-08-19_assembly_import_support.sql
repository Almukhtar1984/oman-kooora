-- Assembly (الجمعية العمومية) Excel-import support.
--
-- 1) Adds `membership_number` (رقم العضوية) so a club's own historical
--    membership numbers are preserved on import.
-- 2) Relaxes columns that imported membership registries frequently lack
--    (birth date, civil ID, phone, membership/subscription dates) to NULL,
--    so partial rows can still be imported. Existing rows are unaffected.
--
-- The Sequelize model `assemblies` maps to table `assemblies`. VERIFY the table
-- name on your server first: SHOW TABLES LIKE 'assembl%';  -- expected: assemblies
--
-- Apply manually on production (back up first):
--   mysqldump -u <user> -p <db> assemblies > backup_before_assembly_import.sql
--   mysql -u <user> -p <db> < 2026-08-19_assembly_import_support.sql

ALTER TABLE `assemblies`
  ADD COLUMN `membership_number` VARCHAR(50) NULL AFTER `card_number`;

ALTER TABLE `assemblies`
  MODIFY `date_birth`        DATE        NULL,
  MODIFY `card_number`       VARCHAR(50) NULL,
  MODIFY `phone`             VARCHAR(20) NULL,
  MODIFY `membership_date`   DATE        NULL,
  MODIFY `subscription_date` DATE        NULL;
