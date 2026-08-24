-- Same guard as 014, for recipes.
--
-- INSERT IGNORE only ignores a row that collides with a unique key, so without
-- this the recipe seed still doubles its rows on a second run. Identity here is
-- the video: the same youtube url listed twice is a mistake, not a use case.
--
-- Run 017 first if the table already has duplicates.

ALTER TABLE recipes
  ADD UNIQUE KEY uq_recipes_video (youtube_url(191));
