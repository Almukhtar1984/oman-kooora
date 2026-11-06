-- أنواع رسوم جديدة: تسجيل لاعب تحت 18 سنة، انتقال وإعارة خارجيان، التسجيل في المسابقات.
-- (طلب العميل 2026-11-05). الأنواع القائمة تبقى بأسمائها: «تسجيل لاعب» صار فوق 18
-- سنة، و«انتقال» و«إعارة» صارا الداخليين.

SET @fees_ready := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'club_fees'
      AND COLUMN_NAME = 'fee_type' AND COLUMN_TYPE LIKE '%competition_registration%');
SET @sql := IF(@fees_ready = 0,
    'ALTER TABLE club_fees MODIFY COLUMN fee_type ENUM(''player_registration'',''player_registration_under18'',''transfer'',''transfer_external'',''loan'',''loan_external'',''team_registration'',''player_release'',''competition_registration'') NOT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @pay_ready := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'request_payments'
      AND COLUMN_NAME = 'fee_type' AND COLUMN_TYPE LIKE '%competition_registration%');
SET @sql := IF(@pay_ready = 0,
    'ALTER TABLE request_payments MODIFY COLUMN fee_type ENUM(''player_registration'',''player_registration_under18'',''transfer'',''transfer_external'',''loan'',''loan_external'',''team_registration'',''player_release'',''competition_registration'') NOT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- لا يتغيّر على نادٍ سعّر خدماته شيء يوم النشر: النوع الجديد يبدأ بسعر الذي انقسم
-- منه وحالته، حتى يعدّله النادي. يُضيف صفوفاً ولا يمسّ القائم، ويُعاد بلا أثر.
INSERT INTO club_fees (id, fee_type, amount, active, createdAt, updatedAt, id_club)
SELECT UUID(), 'player_registration_under18', f.amount, f.active, NOW(), NOW(), f.id_club
FROM club_fees f
WHERE f.fee_type = 'player_registration' AND f.deletedAt IS NULL
  AND NOT EXISTS (SELECT 1 FROM (SELECT id_club, fee_type FROM club_fees) x
                  WHERE x.id_club = f.id_club AND x.fee_type = 'player_registration_under18');

INSERT INTO club_fees (id, fee_type, amount, active, createdAt, updatedAt, id_club)
SELECT UUID(), 'transfer_external', f.amount, f.active, NOW(), NOW(), f.id_club
FROM club_fees f
WHERE f.fee_type = 'transfer' AND f.deletedAt IS NULL
  AND NOT EXISTS (SELECT 1 FROM (SELECT id_club, fee_type FROM club_fees) x
                  WHERE x.id_club = f.id_club AND x.fee_type = 'transfer_external');

INSERT INTO club_fees (id, fee_type, amount, active, createdAt, updatedAt, id_club)
SELECT UUID(), 'loan_external', f.amount, f.active, NOW(), NOW(), f.id_club
FROM club_fees f
WHERE f.fee_type = 'loan' AND f.deletedAt IS NULL
  AND NOT EXISTS (SELECT 1 FROM (SELECT id_club, fee_type FROM club_fees) x
                  WHERE x.id_club = f.id_club AND x.fee_type = 'loan_external');
