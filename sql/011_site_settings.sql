-- Editable bits of the home page and the footer.
--
-- A flat key/value table rather than a column per field, because these are
-- one-off strings that change shape as the design does. A key with no row
-- simply falls back to what the site ships with, same contract as page_meta.
--
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(64) NOT NULL,
  value       TEXT NULL,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
