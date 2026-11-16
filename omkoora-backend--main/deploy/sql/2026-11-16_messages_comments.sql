-- الرسائل: الخطاب الطويل يُرسل، والتعليق يحمل مستنداته (اجتماع العميل، 2026-11-16).
--
-- messages.content    — كان VARCHAR(500)، والمحرّر يكتب HTML، فخطابٌ عادي — استقالة
--                       لاعب بنصّها — تجاوزه، فرفضت القاعدة الرسالة و«حدث خطأ أثناء
--                       إرسال الرسالة». صار MEDIUMTEXT.
-- comments.note       — ملاحظة التعليق، كانت VARCHAR(500)، صارت TEXT.
-- attachments.id_comment — مستندات التعليق، في جدول المرفقات نفسه الذي يحمل مرفقات
--                       الرسائل والاجتماعات والطلبات.
--
-- Widening and additive only — no row changes. Idempotent — safe to re-run.

SET @content_ready := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages'
      AND COLUMN_NAME = 'content' AND DATA_TYPE = 'mediumtext');
SET @sql := IF(@content_ready = 0,
    'ALTER TABLE messages MODIFY COLUMN content MEDIUMTEXT NOT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @note_ready := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'comments'
      AND COLUMN_NAME = 'note' AND DATA_TYPE = 'text');
SET @sql := IF(@note_ready = 0,
    'ALTER TABLE comments MODIFY COLUMN note TEXT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_comment := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attachments' AND COLUMN_NAME = 'id_comment');
SET @sql := IF(@has_comment = 0,
    'ALTER TABLE attachments ADD COLUMN id_comment CHAR(36) NULL AFTER id_request, ADD INDEX idx_attachments_comment (id_comment)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
