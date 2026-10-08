-- Mobile-app FCM device tokens, keyed to the person (portal member), so push
-- notifications reach members who sign in with phone + civil id and have no
-- dashboard User row. One row per device token; `token` is unique so a
-- re-registering device updates in place.
--
-- `token` is ascii (FCM tokens are ascii) so the UNIQUE index fits the InnoDB
-- key-length limit regardless of the server's default charset. UUID FK columns
-- are CHAR(36) utf8/utf8_bin to match people.id — switch to utf8mb4_bin if the
-- target DB uses utf8mb4.
--
-- Back up first (new table, so nothing to lose, but keep the habit):
--   mysql -u <user> -p <db> < 2026-10-08_device_tokens.sql
--
-- Idempotent: CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS device_tokens (
  id         CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  id_person  CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  token      VARCHAR(512) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  platform   VARCHAR(20) NULL,
  createdAt  DATETIME NOT NULL,
  updatedAt  DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_device_tokens_token (token),
  KEY idx_device_tokens_person (id_person)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
