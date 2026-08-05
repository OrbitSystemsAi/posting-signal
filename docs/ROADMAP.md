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
- [ ] Provision Blob through Vercel.
- [x] Apply and verify the initial database migration in Development.
- [ ] Apply the reviewed initial migration to Production before database-backed features launch.
- [ ] Configure production authentication.

## Beta 2 — LinkedIn publishing

- LinkedIn OAuth connect, reconnect, and revoke.
- Encrypted token lifecycle and refresh handling.
- Personal-profile text, image, and document publishing.
- Approval-to-schedule workflow backed by Neon.
- Idempotent worker execution, retries, and notifications.
- LinkedIn developer review and access approval.

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
