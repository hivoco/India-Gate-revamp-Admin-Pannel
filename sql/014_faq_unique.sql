-- Stops the same question being stored twice on the same page.
--
-- This is the real guard. A seed file can be re-run by mistake, and an editor
-- can paste the same question twice, and both used to go straight in. The site
-- then renders two identical entries, which React flags as a duplicate key
-- because the question text is what it keys the list on.
--
-- A prefix length is required: question is VARCHAR(512) and utf8mb4 is 4 bytes
-- a character, so the whole column will not fit in an index. 191 characters is
-- the usual safe prefix and is far longer than any real question.
--
-- Run the dedupe in 015 first if the table already has duplicates, this will
-- fail while they exist.

ALTER TABLE faqs
  ADD UNIQUE KEY uq_faqs_page_question (page_key, question(191));
