-- Removes duplicate questions, keeping the earliest row of each pair.
--
-- Only needed on a database where an unguarded seed was run more than once.
-- Safe to run on a clean table, it deletes nothing.

DELETE f FROM faqs f
JOIN (
  SELECT page_key, question, MIN(id) AS keep_id
  FROM faqs
  GROUP BY page_key, question
  HAVING COUNT(*) > 1
) d
  ON f.page_key = d.page_key
 AND f.question = d.question
 AND f.id > d.keep_id;
