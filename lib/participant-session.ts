import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import {
  ANONYMOUS_SESSION_COOKIE_MAX_AGE_SECONDS,
  ANONYMOUS_SESSION_COOKIE_NAME
} from "@/lib/domain";
import { getSessionHashSecret } from "@/lib/env";
import { getLocalDataStore } from "@/lib/store";

export async function getOrCreateParticipantSession() {
  const cookieStore = await cookies();
  let rawKey = cookieStore.get(ANONYMOUS_SESSION_COOKIE_NAME)?.value;

  if (!rawKey) {
    rawKey = randomBytes(32).toString("base64url");
    cookieStore.set(ANONYMOUS_SESSION_COOKIE_NAME, rawKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ANONYMOUS_SESSION_COOKIE_MAX_AGE_SECONDS,
      path: "/"
    });
  }

  return getLocalDataStore().ensureAnonymousSession(rawKey, getSessionHashSecret(), new Date().toISOString());
}
