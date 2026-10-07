-- Mobile-app fields for news (blogs) and matches.
--
-- Made idempotent (each ADD COLUMN guarded by information_schema) so the
-- migration runner can apply it safely even where it already ran.

-- blogs.category
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blogs' AND COLUMN_NAME = 'category');
SET @sql := IF(@c = 0,
    'ALTER TABLE blogs ADD COLUMN category VARCHAR(50) NULL AFTER status',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- blogs.author_name
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blogs' AND COLUMN_NAME = 'author_name');
SET @sql := IF(@c = 0,
    'ALTER TABLE blogs ADD COLUMN author_name VARCHAR(100) NULL AFTER category',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- blogs.views_count
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blogs' AND COLUMN_NAME = 'views_count');
SET @sql := IF(@c = 0,
    'ALTER TABLE blogs ADD COLUMN views_count INT NOT NULL DEFAULT 0 AFTER author_name',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- matches.venue
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'matches' AND COLUMN_NAME = 'venue');
SET @sql := IF(@c = 0,
    'ALTER TABLE matches ADD COLUMN venue VARCHAR(150) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- matches.minute
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'matches' AND COLUMN_NAME = 'minute');
SET @sql := IF(@c = 0,
    'ALTER TABLE matches ADD COLUMN minute VARCHAR(10) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
