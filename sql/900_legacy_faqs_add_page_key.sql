-- Adds the page a FAQ belongs to.
--
-- Every existing row falls to 'home' via the column default, so the site keeps
-- rendering what it renders today, then rows get moved to their real page in
-- the admin panel (or by running 002_faqs_seed.sql on a fresh table).
--
-- category is only read for page_key = 'faqs-hub', which is the one page that
-- groups its questions under tabs. It stays NULL everywhere else.
--
-- Run once.

ALTER TABLE faqs
  ADD COLUMN page_key VARCHAR(64) NOT NULL DEFAULT 'home' AFTER answer,
  ADD COLUMN category VARCHAR(64) NULL AFTER page_key,
  ADD INDEX idx_faqs_page_active (page_key, is_active, sort_order);
