# PostingSignal Architecture

PostingSignal is a Next.js App Router application intended for Vercel. Server
Components read directly from repositories. UI mutations use Server Actions.
OAuth callbacks, social webhooks, and cron invocations use Route Handlers.

Neon Postgres is the durable system of record. Drizzle owns schema and migrations.
Large media belongs in Vercel Blob or equivalent object storage; Postgres stores
metadata and a durable URL.

Core entities are users, workspaces, posts, social connections, publishing jobs,
and engagement items.

## Security boundaries

- OAuth tokens are server-only and encrypted with a dedicated key.
- Every database query must be scoped to the authenticated workspace.
- Webhooks verify raw-body signatures before persistence.
- Cron routes require `CRON_SECRET` and remain idempotent.
- Platform adapters receive decrypted tokens only for one request.
- Logs never contain tokens, authorization codes, or secrets.

## Publishing lifecycle

1. A user creates and approves a draft.
2. Scheduling creates one job per selected connection.
3. A durable worker claims due jobs using an idempotency key.
4. The adapter validates content, uploads media, and creates the post.
5. The worker records the platform ID/URL or sanitized retry information.
6. Permanent failures require attention; successful jobs cannot be replayed.

Beta 1 still reads the browser `signal-posts` key so prototype content remains
available. Neon becomes authoritative after provisioning, authentication,
migrations, and an explicit import flow.
