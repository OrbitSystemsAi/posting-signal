# PostingSignal Architecture

PostingSignal is a Next.js App Router application deployed on Vercel. Server
Components read directly from repositories. UI mutations use Server Actions.
OAuth callbacks, social webhooks, and scheduled-worker invocations use Route
Handlers.

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
- Cloudflare stores only the worker URL and shared cron secret; provider tokens
  remain inside PostingSignal's server-side boundary.
- Platform adapters receive decrypted tokens only for one request.
- Logs never contain tokens, authorization codes, or secrets.

## Publishing lifecycle

1. A user creates and approves a draft.
2. Scheduling creates one job per selected connection.
3. A Cloudflare Cron Trigger calls `/api/cron/publish` once per minute.
4. A durable worker atomically claims due jobs using an idempotency key and lease.
5. The adapter validates content, uploads media, and creates the post.
6. The worker records the platform ID/URL or sanitized retry information.
7. Temporary failures retry with backoff. Permanent failures require attention;
   successful jobs cannot be replayed.

## Scheduling trigger

Cloudflare Workers is the external clock for automatic publishing. A free Cron
Trigger invokes the production worker endpoint every minute. Neon remains the
durable queue and source of truth, so a missed or repeated trigger does not lose
or duplicate a scheduled post. Vercel Cron is not used for frequent scheduling.

Cloudflare does not receive post content, LinkedIn credentials, or database
credentials. It sends an authenticated request to the Vercel Route Handler, which
finds and processes due jobs.

The current browser workspace still reads the `signal-posts` key so prototype
content remains available. Neon is already provisioned and migrated; it becomes
authoritative for posts after the approval-to-schedule workflow and explicit
import flow are implemented.
