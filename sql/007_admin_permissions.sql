-- Per admin section access.
--
-- A superadmin always has everything and carries no permissions of its own.
-- An admin gets a JSON array of section keys, eg ["faqs","contacts"], and only
-- those tabs appear for them.
--
-- NULL means "everything", which is what every admin had before this column
-- existed, so existing accounts keep working exactly as they did. Assigning
-- sections to an admin replaces the NULL with an explicit list.
--
-- Safe to re-run.

ALTER TABLE admins
  ADD COLUMN permissions JSON NULL AFTER password;
