# muSH Mindfulness Tracker

Mobile-first bilingual mindfulness event logging application built from [docs/SPEC.md](docs/SPEC.md).

## Local Development

```bash
pnpm install
pnpm run dev
```

The app uses local JSON persistence by default. Set the Supabase environment variables in `.env.local` to use Supabase-backed persistence.

Admin development login defaults to:

- Username: `admin`
- Password: `mindful-admin`

Production should set `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, and `SESSION_HASH_SECRET`.

## Verification

```bash
pnpm test
pnpm run build
pnpm run test:e2e
```
