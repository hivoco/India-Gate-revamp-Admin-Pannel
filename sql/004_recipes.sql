-- Recipe videos shown on /recipes under the Recipes tab.
--
-- Only the youtube watch url is stored. The embed url and the thumbnail are
-- both derived from the video id on the site, which is what the hardcoded
-- data did too, so there is nothing to keep in sync by hand.
--
-- The badge columns are the small labels on the card. All of them are
-- optional, a card just drops the ones that are empty.
--
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS recipes (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(512) NOT NULL,
  youtube_url VARCHAR(512) NOT NULL,
  duration    VARCHAR(32) NULL,
  category    VARCHAR(64) NULL,
  difficulty  VARCHAR(32) NULL,
  serves      VARCHAR(64) NULL,
  cook_time   VARCHAR(64) NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_recipes_active (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
