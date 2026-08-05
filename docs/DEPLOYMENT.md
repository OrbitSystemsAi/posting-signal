# Production Deployment

## Required order

1. Authenticate GitHub and push the private repository.
2. Install/authenticate Vercel CLI and link the project.
3. Provision Neon and Blob through Vercel integrations.
4. Add production, preview, and development environment keys.
5. Pull development keys into `.env.local` without printing values.
6. Verify every key in `.env.example` is present.
7. Generate and review the initial migration.
8. Run `npm run db:migrate`.
9. Deploy a preview and verify `/api/health`.
10. Configure OAuth callbacks using the production domain.
11. Deploy production after auth, deletion, and publishing tests pass.

Do not run migrations before Vercel linkage and environment verification. Never
commit `.env.local` or provider credentials.

## Current external blockers

- GitHub CLI authentication must be renewed.
- Vercel CLI is not installed or authenticated.
- No Vercel project is linked.
- Neon, Blob, authentication, and social provider apps are not provisioned.
