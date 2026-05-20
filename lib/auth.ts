import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;

export const ADMIN_SESSION_COOKIE_NAME = "mush_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export async function hashAdminPassword(password: string, fixedSalt?: string): Promise<string> {
  const salt = fixedSalt ?? randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, keyLength)) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function verifyAdminPassword(password: string, storedHash: string): Promise<boolean> {
  const [scheme, salt, keyHex] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !keyHex) {
    return false;
  }
  const expected = Buffer.from(keyHex, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const expectedUsername = process.env.ADMIN_USERNAME ?? "admin";
  if (username !== expectedUsername) {
    return false;
  }

  if (process.env.ADMIN_PASSWORD_HASH) {
    return verifyAdminPassword(password, process.env.ADMIN_PASSWORD_HASH);
  }

  if (process.env.NODE_ENV !== "production") {
    return password === (process.env.ADMIN_PASSWORD ?? "mindful-admin");
  }

  return false;
}

export function createAdminSessionToken(username: string, secret: string, expiresAt: number): string {
  const payload = `${username}.${expiresAt}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now()
): { username: string; expiresAt: number } | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [username, expiresAtText, signature] = parts;
  const expiresAt = Number(expiresAtText);
  if (!username || !Number.isFinite(expiresAt) || expiresAt <= now) {
    return null;
  }

  const expected = createHmac("sha256", secret).update(`${username}.${expiresAt}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  return { username, expiresAt };
}
