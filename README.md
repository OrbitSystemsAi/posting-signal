# PostingSignal — Beta 1

Production-oriented social content planning, approval, scheduling, publishing,
and engagement workspace. Beta 1 preserves the original browser workspace while
introducing server-side boundaries for Vercel, Neon, OAuth connections, scheduled
publishing, and controlled replies.

## Local development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3004`. Existing browser content continues to use the
`signal-posts` local-storage key until Neon is provisioned and migrations run.

## Production bootstrap

Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Provider setup order is GitHub,
Vercel linkage, Neon integration, environment verification, migration, deployment.

## Commands

- `npm run dev` — local Next.js server on port 3004
- `npm run build` — production build
- `npm run typecheck` — TypeScript validation
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:migrate` — migrate after Vercel/Neon configuration

## Safety model

- No social-network passwords are collected.
- OAuth tokens belong encrypted in Neon, never browser storage.
- Publishing jobs use unique idempotency keys.
- Webhooks fail closed until signature verification exists.
- Publishing cron calls require a bearer secret.
- Human approval remains required by default.
