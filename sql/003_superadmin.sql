-- The first superadmin, so there is something to log in with. A superadmin is
-- the only role that can reach /admins and manage other admins.
--
-- NO PASSWORD OR HASH IS COMMITTED HERE ON PURPOSE. A working credential in a
-- repository is a credential everyone with repo access has, and it outlives
-- whoever set it up.
--
-- Generate one, then paste it below before running this file:
--
--   node scripts/hash-password.mjs 'the-password-you-want'
--
-- Change the email too. After the first login, rotate the password from
-- My Account in the panel so the value never has to live in a file at all.

INSERT INTO superadmins (email, password)
VALUES (
  'admin@example.com',
  'PASTE_THE_BCRYPT_HASH_HERE'
)
ON DUPLICATE KEY UPDATE email = email;
