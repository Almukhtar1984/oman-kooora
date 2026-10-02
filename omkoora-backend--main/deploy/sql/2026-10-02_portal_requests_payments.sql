-- Portal profile / requests & complaints / payment details.
--
-- Adds the columns the member-portal work needs. The GraphQL models now expect
-- them; DB_SYNC_ALTER is off in production, so apply this file manually.
--
-- Tables (plural, as Sequelize names them): `requests`, `attachments`,
-- `member_payments`. Production UUID columns are CHAR(36) CHARACTER SET utf8
-- COLLATE utf8_bin (utf8mb3) — switch to utf8mb4_bin if the target DB uses
-- utf8mb4. Verify first:  SHOW TABLES LIKE 'request%';  SHOW TABLES LIKE 'attachment%';
--
-- Back up first:
--   mysqldump -u <user> -p <db> requests attachments member_payments > backup_before_portal_requests_payments.sql
--   mysql -u <user> -p <db> < 2026-10-02_portal_requests_payments.sql
--
-- Idempotent: safe to re-run — each ADD COLUMN is guarded by information_schema.

-- ---------------------------------------------------------------------------
-- requests: reference_number, admin_reply, replied_at
-- ---------------------------------------------------------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests' AND COLUMN_NAME = 'reference_number');
SET @sql := IF(@c = 0,
    'ALTER TABLE requests ADD COLUMN reference_number VARCHAR(32) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Unique index on reference_number (MySQL allows multiple NULLs under UNIQUE).
SET @i := (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests' AND INDEX_NAME = 'uq_requests_reference');
SET @sql := IF(@i = 0,
    'ALTER TABLE requests ADD UNIQUE KEY uq_requests_reference (reference_number)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests' AND COLUMN_NAME = 'admin_reply');
SET @sql := IF(@c = 0,
    'ALTER TABLE requests ADD COLUMN admin_reply TEXT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests' AND COLUMN_NAME = 'replied_at');
SET @sql := IF(@c = 0,
    'ALTER TABLE requests ADD COLUMN replied_at DATETIME NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- attachments: id_request (a request's uploaded files live in this table)
-- ---------------------------------------------------------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attachments' AND COLUMN_NAME = 'id_request');
SET @sql := IF(@c = 0,
    'ALTER TABLE attachments ADD COLUMN id_request CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @i := (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attachments' AND INDEX_NAME = 'idx_attachments_request');
SET @sql := IF(@i = 0,
    'ALTER TABLE attachments ADD KEY idx_attachments_request (id_request)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Optional FK (run only if requests.id charset/collation matches exactly):
-- ALTER TABLE attachments
--   ADD CONSTRAINT fk_attachments_request FOREIGN KEY (id_request)
--   REFERENCES requests(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- member_payments: method, status, receipt_url, transaction_number
-- ---------------------------------------------------------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'member_payments' AND COLUMN_NAME = 'method');
SET @sql := IF(@c = 0,
    'ALTER TABLE member_payments ADD COLUMN method VARCHAR(20) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'member_payments' AND COLUMN_NAME = 'status');
SET @sql := IF(@c = 0,
    'ALTER TABLE member_payments ADD COLUMN status VARCHAR(20) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'member_payments' AND COLUMN_NAME = 'receipt_url');
SET @sql := IF(@c = 0,
    'ALTER TABLE member_payments ADD COLUMN receipt_url VARCHAR(255) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'member_payments' AND COLUMN_NAME = 'transaction_number');
SET @sql := IF(@c = 0,
    'ALTER TABLE member_payments ADD COLUMN transaction_number VARCHAR(100) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
