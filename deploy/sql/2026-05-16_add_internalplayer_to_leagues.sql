-- Adds the `internalplayer` column to the leagues table to track the
-- maximum number of INTERNAL professional players allowed per league.
-- (Sibling of the existing `externalplayer` column, which tracks the
-- maximum number of EXTERNAL professional players.)
--
-- Apply manually on production:
--   mysql -u <user> -p tomoh < 2026-05-16_add_internalplayer_to_leagues.sql
--
-- Idempotent intent: ALTER fails harmlessly if the column already exists;
-- wrap in a procedure if you want a clean re-run.

ALTER TABLE leagues ADD COLUMN internalplayer INT NULL DEFAULT 0 AFTER externalplayer;
