-- A url friendly slug per blog, so an article reads
-- /recipes/articles/what-is-kaima-rice rather than /recipes/articles/blog-4.
--
-- Nullable so the column can be added to a table that already has rows, then
-- backfilled. Unique because it is what the site looks a blog up by, and two
-- blogs sharing one would make a url ambiguous. New rows get a slug derived
-- from the title, with -2, -3 and so on appended if that slug is taken.
--
-- Safe to re-run.

ALTER TABLE blogs
  ADD COLUMN slug VARCHAR(255) NULL AFTER title,
  ADD UNIQUE KEY uq_blogs_slug (slug);
