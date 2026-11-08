-- «تسجيل عضو جديد»: بابٌ واحد بدل ثلاثة (العميل، 2026-11-08).
--
-- الفريق يسجّل العضو فيدخل «العضوية» مباشرة وينتظر النادي، والنادي يعتمد
-- العضوية — ورسوم العضوية السنوية — على الطريق نفسه الذي تسلكه بقية الطلبات.
-- وبعد الاعتماد يختار الفريق تصنيفه: لاعب أو جهاز فني أو مجلس إدارة، أو يبقى عضواً.
--
-- assemblies.status  — NULL لكل عضو قائم (سُجّل قبل أن يكون للعضوية اعتماد،
--                      فهو معتمد)، و waiting_club / accepted / rejected لمن يُسجَّل
--                      من الباب الجديد.
-- fee_type           — نوع رسوم جديد member_registration («رسوم العضوية السنوية»)
--                      في قائمة أسعار النادي وفي مطالباته.
-- request_type       — نوع طلب جديد member_registration على طريق الطلبات.
--
-- Additive and idempotent — safe to re-run. No row changes.

SET @has_status := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assemblies' AND COLUMN_NAME = 'status');
SET @sql := IF(@has_status = 0,
    'ALTER TABLE assemblies ADD COLUMN status ENUM(''waiting_club'',''accepted'',''rejected'') NULL DEFAULT NULL AFTER type',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fees_ready := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'club_fees'
      AND COLUMN_NAME = 'fee_type' AND COLUMN_TYPE LIKE '%member_registration%');
SET @sql := IF(@fees_ready = 0,
    'ALTER TABLE club_fees MODIFY COLUMN fee_type ENUM(''player_registration'',''player_registration_under18'',''transfer'',''transfer_external'',''loan'',''loan_external'',''team_registration'',''player_release'',''competition_registration'',''member_registration'') NOT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @pay_ready := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'request_payments'
      AND COLUMN_NAME = 'fee_type' AND COLUMN_TYPE LIKE '%member_registration%');
SET @sql := IF(@pay_ready = 0,
    'ALTER TABLE request_payments MODIFY COLUMN fee_type ENUM(''player_registration'',''player_registration_under18'',''transfer'',''transfer_external'',''loan'',''loan_external'',''team_registration'',''player_release'',''competition_registration'',''member_registration'') NOT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @flows_ready := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'request_flows'
      AND COLUMN_NAME = 'request_type' AND COLUMN_TYPE LIKE '%member_registration%');
SET @sql := IF(@flows_ready = 0,
    'ALTER TABLE request_flows MODIFY COLUMN request_type ENUM(''player_registration'',''transfer'',''loan'',''player_release'',''team_registration'',''member_registration'') NOT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
