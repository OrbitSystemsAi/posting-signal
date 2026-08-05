# PostingSignal Roadmap

## Beta 1 — Production foundation

- [x] Preserve the planning, calendar, composer, and preview experience.
- [x] Migrate the runtime to Next.js App Router.
- [x] Define typed Vercel/Neon environment contracts.
- [x] Model users, workspaces, posts, OAuth connections, jobs, and engagement.
- [x] Add secure webhook, health, and scheduled-worker boundaries.
- [x] Add deployment and architecture documentation.
- [x] Create and link the private GitHub and Vercel projects.
- [x] Provision Neon through Vercel.
- [x] Provision and connect private Blob storage through Vercel.
- [x] Apply and verify the initial database migration in Development.
- [x] Apply and verify the reviewed initial migration in Production.
- [x] Configure Clerk authentication for local, Preview, and Production environments.

## Beta 2 — LinkedIn publishing

- [x] Implement LinkedIn OAuth connect, reconnect, and revoke routes.
- [x] Encrypt LinkedIn access tokens at rest.
- [x] Implement human-confirmed personal-profile text publishing.
- [x] Create the LinkedIn Developer application and submit the required product requests.
- [x] Register the production OAuth callback and configure LinkedIn credentials in Vercel.
- [ ] Add personal-profile image and document publishing.
- [x] Back the approval-to-schedule workflow with Neon.
- [x] Select Cloudflare Workers as the free minute-level scheduling trigger.
- [x] Create the Cloudflare account.
- [x] Implement conditional job claiming, duplicate protection, safe retries, and in-app job status.
- [ ] Deploy the Cloudflare Worker and one-minute Cron Trigger.
- [ ] Verify LinkedIn product-request approval and complete any remaining review.
- [ ] Pass an end-to-end automatic publishing test in Production.

## Beta 3 — Multi-platform publishing

- Threads, Instagram professional accounts, and Facebook Pages.
- Bluesky and Mastodon.
- X after API pricing review.
- Platform-specific variants and previews.

## Beta 4 — Engagement inbox

- Comments and mentions ingestion.
- Unified conversation threads.
- Suggested replies with human approval.
- Spam, sentiment, and risk classification.

## Beta 5 — Controlled autopilot

- Approved-answer knowledge base and safe reply rules.
- Confidence, risk, rate, delay, and repetition limits.
- Account-level kill switches.
- TikTok after media pipeline and platform audit.

## Production release criteria

- Provider security reviews completed.
- Restore, token-rotation, and incident procedures tested.
- End-to-end publishing tests pass for every enabled platform.
- Observability covers auth, webhooks, jobs, retries, and quotas.
- Privacy, retention, and account-deletion processes are operational.
