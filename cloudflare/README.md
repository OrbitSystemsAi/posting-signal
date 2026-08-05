# PostingSignal Cloudflare scheduler

This Worker is the free minute-level clock for automatic publishing. It sends an
authenticated request to the durable publishing worker hosted on Vercel. It does
not store posts, LinkedIn tokens, or database credentials.

## Deploy

From this directory, authenticate Wrangler and store the shared secret:

```bash
npx wrangler login
npx wrangler secret put CRON_SECRET
npx wrangler deploy
```

Enter the same `CRON_SECRET` value configured in Vercel Production. Do not add the
secret to `wrangler.jsonc` or commit it to the repository.

After deployment, inspect Cloudflare Workers & Pages → `posting-signal-scheduler`
→ Settings → Triggers. The Cron Trigger should show `* * * * *`.

Do not deploy the trigger until `/api/cron/publish` has been deployed and tested.
