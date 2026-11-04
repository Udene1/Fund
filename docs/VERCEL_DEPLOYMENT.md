# Vercel deployment

## Vercel project

- Team: Udene's projects
- Project: `fund`
- Project ID: `prj_hom2BZAPDCIx2YygALxIk7ig2bdu`
- Repository: `Udene1/Fund` (`main`)
- Framework: Next.js
- Node.js: 22.x
- Function region: `lhr1` (London)
- Preview deployments: Vercel Authentication enabled
- Production: application-level Fund sign-in; Vercel Authentication is preview-only

## Database architecture

Fund uses its own Vercel-managed Neon Postgres resource. It must not use the legacy shared `DATABASE_URL`.

- Dedicated Neon resource: `fund-database`
- Vercel Neon store ID: `store_9wAMh0GfsJtbfgAg`
- Neon region: London / `eu-west-2`
- Prisma datasource environment variable: `FUND_DB_DATABASE_URL`
- Vercel environment targets: Production and Preview

The Neon integration injects the connection string into Vercel's encrypted environment-variable store. Do not copy database credentials into GitHub, source files, logs, or chat. The legacy `DATABASE_URL` belongs to a separate shared Neon resource and must not be used by Fund.

## Prisma schema lifecycle

The Prisma schema is in `prisma/schema.prisma`. The application build generates the Prisma client; it does not automatically change the database schema.

For a new or intentionally reset Fund database:

1. Confirm the Vercel environment variable `FUND_DB_DATABASE_URL` is attached to the dedicated store above.
2. Verify the database identity and inspect its existing public tables before writing.
3. Run `npm run db:bootstrap`. This checks the database identity and refuses to proceed unless the database is empty or already has the exact Fund table set; it then applies the Prisma schema.
4. Run the application build and tests.
5. Smoke-test sign-in, event capture, retrieval after refresh, and export using clearly marked non-sensitive test data.

Do not run `db push` against the legacy shared database. Do not make schema changes automatically on every production deployment. For future production schema evolution, introduce reviewed Prisma migrations and use `prisma migrate deploy`.

## Environment variables

The following application secrets are configured in Vercel for Production, Preview, and Development:

- `FUND_OWNER_PASSWORD`
- `FUND_SESSION_SECRET`
- `FUND_AGENT_TOKEN`

Their values are intentionally not stored in this repository. Rotate the initial owner password after first sign-in. Database connection values are managed by the Neon integration and remain encrypted in Vercel.

## Current deployment state

- [x] Vercel project connected to `Udene1/Fund`.
- [x] Function region set to London (`lhr1`).
- [x] Preview protection enabled; production uses Fund's own sign-in.
- [x] Owner and agent secrets configured.
- [x] Dedicated Neon resource provisioned in London.
- [x] Dedicated Neon resource connected to Fund's Production and Preview environments.
- [x] Prisma datasource switched from the legacy shared `DATABASE_URL` to `FUND_DB_DATABASE_URL`.
- [x] Production deployment for the datasource change completed successfully.
- [x] Verify the dedicated database is empty and initialize the Prisma schema (9 expected tables verified).
- [x] Deploy the initialized application successfully to Production in London (`lhr1`).
- [ ] Run owner sign-in and browser/API smoke tests with a real owner session.
