# PostingSignal — Beta 2

Production-oriented social content planning, approval, scheduling, publishing,
and engagement workspace. The production foundation is deployed on Vercel with
Neon, private Blob storage, Clerk authentication, and LinkedIn OAuth. Beta 2 is
connecting the browser-based planning experience to durable scheduling and
automatic LinkedIn publishing.

## Local development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3004`. Existing browser content continues to use the
`signal-posts` local-storage key until the approval-to-schedule workflow is moved
to Neon. Development provider credentials belong in uncommitted local environment
files; production credentials are managed in Vercel.

## Deployment

The production deployment is `https://posting-signal.vercel.app`. Follow
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for environment verification, migrations,
LinkedIn OAuth configuration, and the Cloudflare scheduler rollout.

## Commands

- `npm run dev` — local Next.js server on port 3004
- `npm run build` — production build
- `npm run typecheck` — TypeScript validation
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:migrate` — apply reviewed Drizzle migrations to the selected database

## Safety model

- No social-network passwords are collected.
- OAuth tokens belong encrypted in Neon, never browser storage.
- Publishing jobs use unique idempotency keys.
- Webhooks fail closed until signature verification exists.
- Scheduled publishing uses a free Cloudflare Cron Trigger to call the protected
  Vercel worker route once per minute.
- Scheduler calls require a shared bearer secret stored in both Vercel and Cloudflare.
- Human approval remains required by default.
