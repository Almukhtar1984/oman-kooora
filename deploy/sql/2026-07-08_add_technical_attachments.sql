-- Technical-staff attachments (إضافة مرفقات للجهاز الفني).
--
-- Attachments are stored in the SAME table as player attachments; a technical
-- staff member's files are keyed by id_technical_apparatus (nullable, so the
-- existing player rows are unaffected).
--
-- The Sequelize model `attachment_person` maps to table `attachment_people`.
-- VERIFY the table name on your server first, it must match the running schema:
--   SHOW TABLES LIKE 'attachment%';
-- and adjust the table name below if it differs.
--
-- Apply manually on production (back up first):
--   mysqldump -u <user> -p <db> attachment_people > backup_before_technical_attachments.sql
--   mysql -u <user> -p <db> < 2026-07-08_add_technical_attachments.sql
--
-- Idempotent intent: the ADD COLUMN fails harmlessly if it already exists.

ALTER TABLE `attachment_people`
  ADD COLUMN `id_technical_apparatus` CHAR(36) NULL AFTER `id_player`;
