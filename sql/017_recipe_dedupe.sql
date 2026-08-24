-- Removes duplicate recipes, keeping the earliest row of each pair.
-- Safe to run on a clean table, it deletes nothing.

DELETE r FROM recipes r
JOIN (
  SELECT youtube_url, MIN(id) AS keep_id
  FROM recipes
  GROUP BY youtube_url
  HAVING COUNT(*) > 1
) d
  ON r.youtube_url = d.youtube_url
 AND r.id > d.keep_id;
