import { describe, expect, it } from "vitest";
import {
  createAdminSessionToken,
  hashAdminPassword,
  verifyAdminPassword,
  verifyAdminSessionToken
} from "@/lib/auth";

describe("admin auth", () => {
  it("hashes shared admin passwords instead of storing plaintext", async () => {
    const hash = await hashAdminPassword("mindful-admin", "fixed-salt");

    expect(hash).not.toContain("mindful-admin");
    await expect(verifyAdminPassword("mindful-admin", hash)).resolves.toBe(true);
    await expect(verifyAdminPassword("wrong", hash)).resolves.toBe(false);
  });

  it("signs and verifies expiring admin session tokens", () => {
    const token = createAdminSessionToken("admin", "secret", 1_800_000_000);

    expect(verifyAdminSessionToken(token, "secret", 1_700_000_000)).toEqual({
      username: "admin",
      expiresAt: 1_800_000_000
    });
    expect(verifyAdminSessionToken(token, "wrong", 1_700_000_000)).toBeNull();
    expect(verifyAdminSessionToken(token, "secret", 1_900_000_000)).toBeNull();
  });
});
