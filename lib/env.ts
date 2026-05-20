export function getSessionHashSecret(): string {
  return process.env.SESSION_HASH_SECRET ?? "local-development-session-secret";
}

export function getAdminSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "local-development-admin-secret";
}
