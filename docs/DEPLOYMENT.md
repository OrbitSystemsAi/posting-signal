# Production Deployment

## Current production state

- GitHub repository: created and linked.
- Vercel project: linked as `posting-signal`.
- Production URL: `https://posting-signal.vercel.app`.
- Neon: provisioned through Vercel; initial migration verified in Development
  and Production.
- Private Blob storage: provisioned through Vercel.
- Clerk: configured for local, Preview, and Production environments.
- LinkedIn Developer application: created with the required product requests
  submitted.
- LinkedIn production callback: registered as
  `https://posting-signal.vercel.app/api/linkedin/callback`.
- LinkedIn Client ID and Client Secret: configured in Vercel.
- Cloudflare Worker: deployed as `posting-signal-scheduler` with encrypted
  `CRON_SECRET`, the Production `PUBLISH_URL`, and a one-minute Cron Trigger.
- Production scheduling safety test: passed by creating a durable pending job,
  confirming its scheduled state, and cancelling it before publication.

## Environment verification

Vercel Production must contain the required values from `.env.example`, including
`DATABASE_URL`, `TOKEN_ENCRYPTION_KEY`, `CRON_SECRET`, Clerk configuration, Blob
credentials, and LinkedIn credentials. Verify configuration without printing
secret values by checking:

```text
https://posting-signal.vercel.app/api/health
```

Local environment files currently contain database configuration but do not need
to mirror production LinkedIn credentials unless local OAuth testing is required.
Never commit `.env.local`, `.env.development.local`, or provider credentials.

## Automatic publishing rollout

Production status for these steps:

1. Deploy the Neon-backed approval-to-schedule workflow.
2. Deploy `/api/cron/publish`, which conditionally claims due jobs, publishes them,
   records results, and safely retries definitive rate-limit failures.
3. Verify the worker against a Preview deployment using a non-production
   test post.
4. Create a Cloudflare Worker whose scheduled handler calls
   `https://posting-signal.vercel.app/api/cron/publish`.
5. Store `PUBLISH_URL` and `CRON_SECRET` as Cloudflare Worker secrets. The
   `CRON_SECRET` value must match Vercel Production.
6. Configure the free Cloudflare Cron Trigger as `* * * * *` (every minute, UTC).
7. The production schedule-and-cancel safety test is complete. Run an end-to-end
   LinkedIn publishing test only after the LinkedIn product requests are approved,
   and confirm the job cannot be published twice.
8. Verify retry, expired-token, cancellation, and permanent-failure behavior before
   enabling automatic publishing for normal use.

Cloudflare is only the clock. Neon owns job state, and the Vercel worker performs
publishing. Do not place LinkedIn tokens, database credentials, or post content in
Cloudflare.

## Remaining dependencies

- Confirm the LinkedIn product requests have been approved before relying on
  production automatic publishing.
- Confirm Cloudflare scheduled invocations remain healthy in Worker Observability.
- Run the final end-to-end LinkedIn publish test after product approval.
