-- Mobile app: club page + stadium booking fields.
--   clubs.founded_year          سنة التأسيس
--   players.number              رقم القميص (يُعرض في نجوم النادي)
--   reservations.full_name      اسم صاحب الحجز
--   stadiums.badge_label        بادج الملعب (مثال: "الأكثر حجزًا")
--   stadiums.features_label     مميزات الملعب (نص حر)
--   stadiums.min_booking_minutes الحد الأدنى لمدة الحجز (فارغ = 60 دقيقة)
--
-- الحقول المشتقّة (president_name, head_coach_name, affiliated_team_label,
-- star_players, duration_minutes, total_price) لا تحتاج أعمدة — تُحسب في الـAPI.
--
-- Safe to re-run: each column is added only when it is missing. MySQL has no
-- ADD COLUMN IF NOT EXISTS, so every step is guarded through information_schema
-- + a prepared statement (works on MySQL and MariaDB, no stored procedures).
--
-- Apply on production:
--   mysql -u <user> -p <db> < 2026-09-19_mobile_club_stadium_fields.sql

-- clubs.founded_year
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clubs' AND COLUMN_NAME = 'founded_year');
SET @sql := IF(@exists = 0, 'ALTER TABLE `clubs` ADD COLUMN `founded_year` VARCHAR(10) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- players.number
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'players' AND COLUMN_NAME = 'number');
SET @sql := IF(@exists = 0, 'ALTER TABLE `players` ADD COLUMN `number` VARCHAR(10) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- reservations.full_name
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservations' AND COLUMN_NAME = 'full_name');
SET @sql := IF(@exists = 0, 'ALTER TABLE `reservations` ADD COLUMN `full_name` VARCHAR(150) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- stadiums.badge_label
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stadia' AND COLUMN_NAME = 'badge_label');
SET @sql := IF(@exists = 0, 'ALTER TABLE `stadia` ADD COLUMN `badge_label` VARCHAR(100) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- stadiums.features_label
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stadia' AND COLUMN_NAME = 'features_label');
SET @sql := IF(@exists = 0, 'ALTER TABLE `stadia` ADD COLUMN `features_label` VARCHAR(255) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- stadiums.min_booking_minutes
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stadia' AND COLUMN_NAME = 'min_booking_minutes');
SET @sql := IF(@exists = 0, 'ALTER TABLE `stadia` ADD COLUMN `min_booking_minutes` INT NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
