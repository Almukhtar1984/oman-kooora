-- AI connection settings (singleton, super-admin managed). API keys stored
-- encrypted by the app. Idempotent — safe to re-run.
CREATE TABLE IF NOT EXISTS ai_settings (
  id              VARCHAR(32) NOT NULL PRIMARY KEY,
  active_provider ENUM('openai','gemini') NOT NULL DEFAULT 'gemini',
  enabled         TINYINT(1) NOT NULL DEFAULT 0,
  openai_api_key  TEXT NULL,
  openai_model    VARCHAR(100) NULL,
  gemini_api_key  TEXT NULL,
  gemini_model    VARCHAR(100) NULL,
  createdAt       DATETIME NULL,
  updatedAt       DATETIME NULL
);
