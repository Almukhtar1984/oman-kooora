-- «تسجيل عضو جديد»: الاستمارات ترفع مع الطلب (العميل، 2026-11-19).
--
-- «استمارة طلب العضوية، وإذا كان أقل من 18 تعهد ولي الأمر — هذا بالنسبة لتسجيل
-- العضوية». ويرفع الفريق ما شاء من مرفقات أخرى. فيرى النادي ذلك كله في «ملف
-- الطلب» قبل قبوله المبدئي.
--
-- assemblies.membership_form  — استمارة طلب العضوية (PDF أو صورة أو Word).
-- assemblies.guardian_form    — تعهد ولي الأمر، للعضو دون 18 سنة.
-- attachments.id_assembly     — المرفقات الأخرى، في جدول المرفقات نفسه.
--
-- Additive only — no row changes. Idempotent — safe to re-run.

SET @has_form := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assemblies' AND COLUMN_NAME = 'membership_form');
SET @sql := IF(@has_form = 0,
    'ALTER TABLE assemblies ADD COLUMN membership_form VARCHAR(100) NULL AFTER nationalIDBack',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_guardian := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assemblies' AND COLUMN_NAME = 'guardian_form');
SET @sql := IF(@has_guardian = 0,
    'ALTER TABLE assemblies ADD COLUMN guardian_form VARCHAR(100) NULL AFTER membership_form',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_assembly := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attachments' AND COLUMN_NAME = 'id_assembly');
SET @sql := IF(@has_assembly = 0,
    'ALTER TABLE attachments ADD COLUMN id_assembly CHAR(36) NULL, ADD INDEX idx_attachments_assembly (id_assembly)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
