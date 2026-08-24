-- Blogs get a category, the same way recipes and hub faqs have one.
--
-- It is the label on the blog card and it drives the filter list on the Blogs
-- tab of /recipes. There is no separate category table: the categories that
-- exist are the distinct ones the blogs carry, so typing a new one on a blog
-- adds the filter, and dropping the last blog using one removes it.
--
-- Safe to re-run.

ALTER TABLE blogs
  ADD COLUMN category VARCHAR(64) NULL AFTER subtitle;
