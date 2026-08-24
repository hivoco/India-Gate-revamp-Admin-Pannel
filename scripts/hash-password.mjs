// prints a bcrypt hash for a password, in the same format and cost the login
// route expects. usage:
//   node scripts/hash-password.mjs 'my-password'
import bcrypt from "bcrypt";

const password = process.argv[2];

if (!password) {
  console.error("usage: node scripts/hash-password.mjs '<password>'");
  process.exit(1);
}

console.log(await bcrypt.hash(password, 10));
