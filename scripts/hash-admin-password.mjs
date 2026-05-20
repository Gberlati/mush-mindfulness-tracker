import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const password = process.argv[2];

if (!password) {
  console.error("Usage: pnpm run hash-admin-password <password>");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const key = await scrypt(password, salt, 64);

console.log(`scrypt:${salt}:${key.toString("hex")}`);
