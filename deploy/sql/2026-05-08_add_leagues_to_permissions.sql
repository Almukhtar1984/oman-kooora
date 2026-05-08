-- Adds the "leagues" (البطولات) permission slot to the permissions table.
-- The column is nullable so existing rows are unaffected; new permissions
-- written by the updated UI will populate it.
--
-- Apply manually on production:
--   mysql -u <user> -p tomoh < 2026-05-08_add_leagues_to_permissions.sql
--
-- Idempotent: safe to re-run; ALTER fails harmlessly if the column already
-- exists, so wrap in a procedure if you want a clean re-run.

ALTER TABLE permissions ADD COLUMN leagues VARCHAR(25) NULL AFTER expenses;
