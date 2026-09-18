-- Mobile-app fields for news (blogs) and matches.

ALTER TABLE blogs
  ADD COLUMN category    VARCHAR(50)  NULL AFTER status,
  ADD COLUMN author_name VARCHAR(100) NULL AFTER category,
  ADD COLUMN views_count INT NOT NULL DEFAULT 0 AFTER author_name;

ALTER TABLE matches
  ADD COLUMN venue  VARCHAR(150) NULL,
  ADD COLUMN minute VARCHAR(10)  NULL;
