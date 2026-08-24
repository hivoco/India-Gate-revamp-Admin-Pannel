-- Per page seo, editable from the admin panel.
--
-- One row per route that renders a document, keyed the same way faqs are
-- keyed: the key mirrors the site path, with "home" for "/". A page with no
-- row here simply keeps the title and description hardcoded in its own file,
-- so this table is an override layer rather than the source of truth.
--
-- og_image is a full url. Leave it empty and the page writes no share card,
-- which is what most routes do today.
--
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS page_meta (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_key    VARCHAR(128) NOT NULL,
  title       VARCHAR(255) NULL,
  description VARCHAR(500) NULL,
  og_image    VARCHAR(512) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_page_meta_key (page_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
