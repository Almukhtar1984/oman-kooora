-- Mobile-app fields for news and matches (referenced by
-- omkoora-backend--main/docs/mobile-api-fields.md).
--   blogs.category      news | competitions | players | clubs
--   blogs.author_name   اسم الكاتب
--   blogs.views_count   عدد المشاهدات (incrementBlogViews)
--   matches.venue       اسم الملعب
--   matches.minute      الدقيقة الحالية للمباراة
--
-- Safe to re-run: each column is added only when it is missing. MySQL has no
-- ADD COLUMN IF NOT EXISTS, so every step is guarded through information_schema
-- + a prepared statement (works on MySQL and MariaDB, no stored procedures).
--
-- Apply on production:
--   mysql -u <user> -p <db> < 2026-09-18_blog_match_mobile_fields.sql

-- blogs.category
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blogs' AND COLUMN_NAME = 'category');
SET @sql := IF(@exists = 0, 'ALTER TABLE `blogs` ADD COLUMN `category` VARCHAR(50) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- blogs.author_name
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blogs' AND COLUMN_NAME = 'author_name');
SET @sql := IF(@exists = 0, 'ALTER TABLE `blogs` ADD COLUMN `author_name` VARCHAR(100) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- blogs.views_count
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blogs' AND COLUMN_NAME = 'views_count');
SET @sql := IF(@exists = 0, 'ALTER TABLE `blogs` ADD COLUMN `views_count` INT NOT NULL DEFAULT 0', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- matches.venue
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'matches' AND COLUMN_NAME = 'venue');
SET @sql := IF(@exists = 0, 'ALTER TABLE `matches` ADD COLUMN `venue` VARCHAR(150) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- matches.minute
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'matches' AND COLUMN_NAME = 'minute');
SET @sql := IF(@exists = 0, 'ALTER TABLE `matches` ADD COLUMN `minute` VARCHAR(10) NULL', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
