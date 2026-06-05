import bcrypt from "bcrypt";
const password = process.argv[2];
if (!password) {
  console.error("Usage: npm run hash-password -- <password>");
  process.exit(1);
}
const hash = await bcrypt.hash(password, 10);
console.log(hash);
