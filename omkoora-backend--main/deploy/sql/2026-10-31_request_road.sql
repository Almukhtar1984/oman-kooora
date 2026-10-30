-- طريقٌ واحد بلا اختصار: السداد مرحلة لا يتخطّاها طلب.
--
-- The client, 2026-10-30: «جميع الأندية تعتمد على هذا الشيء… ما ممكن يسجّل
-- اللاعب، انتقال اللاعب، إعارة اللاعب، استقالة اللاعب، إلا في الدفع الرسوم».
-- Until now a request whose type the club had not priced skipped the fee stage
-- silently, and a transfer moved its player the moment both clubs agreed.
--
-- request_flows.fee_waived — the club waived the fee on purpose («إعارة
--                            مجانية»): the request passed the fee stage without
--                            paying, and its line says so instead of «تم السداد».
-- transfers.status          — 'waiting_payment': both clubs agreed; the fee and
--                            the final approval remain. The player moves only at
--                            the final approval.
--
-- Additive and idempotent — safe to re-run. No row changes.

SET @has_waived := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'request_flows' AND COLUMN_NAME = 'fee_waived');
SET @sql := IF(@has_waived = 0,
    'ALTER TABLE request_flows ADD COLUMN fee_waived TINYINT(1) NOT NULL DEFAULT 0 AFTER id_payment',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_waiting_payment := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transfers'
      AND COLUMN_NAME = 'status' AND COLUMN_TYPE LIKE '%waiting_payment%');
SET @sql := IF(@has_waiting_payment = 0,
    'ALTER TABLE transfers MODIFY COLUMN status ENUM(''accepted'',''rejected'',''waiting'',''waiting_club_from'',''waiting_club_to'',''waiting_payment'') NULL DEFAULT ''waiting_club_from''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
