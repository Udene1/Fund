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

## Provision Neon Postgres

The Neon Marketplace integration is already installed on the Vercel team, but no database resource is connected to Fund yet.

1. Open the [Fund project in Vercel](https://vercel.com/udenes-projects-8089646b/fund).
2. Open **Storage** and choose **Create Database** / **Neon**. Alternatively, open the [Neon Marketplace product](https://vercel.com/marketplace/neon/neon).
3. Choose the Vercel-managed Neon Postgres product and the Free plan.
4. Choose region `lhr1` (London), close to the Vercel Functions region.
5. Connect the database to the `fund` project for **Production**, **Preview**, and **Development**. Let Vercel inject the connection variables; do not paste database credentials into GitHub.
6. Confirm that `DATABASE_URL` exists in the Fund project's Vercel environment variables.

The project uses Prisma with `DATABASE_URL`. Use Neon's pooled connection string for the application. Keep database credentials in Vercel's encrypted environment-variable store.

## First database initialization

After Neon is connected:

1. Verify `DATABASE_URL` is present in the intended environments.
2. Run `npx prisma generate`.
3. Run `npx prisma db push` against the new, empty Fund database.
4. Deploy the current `main` branch and wait for a successful build.
5. Open the production URL, sign in, capture a test event, and confirm it appears after refresh.
6. Download a JSON export and verify it contains the test event, then remove the test event using the eventual deletion workflow (not implemented yet). Until deletion exists, use only a clearly marked test event and do not add sensitive records.

## Vercel environment variables already configured

These sensitive variables have been created for Production, Preview, and Development:

- `FUND_OWNER_PASSWORD`
- `FUND_SESSION_SECRET`
- `FUND_AGENT_TOKEN`

Their values are intentionally not stored in this repository. The owner password was generated for initial access and should be rotated after first sign-in.

## Current status

- [x] Vercel project created and linked to GitHub repository.
- [x] Next.js framework and Node.js 22 configured.
- [x] Function region set to London (`lhr1`).
- [x] Vercel Authentication retained for Preview; production relies on Fund's own login.
- [x] Owner and agent secrets configured in Vercel.
- [ ] Neon database resource connected to the Fund project.
- [ ] `DATABASE_URL` provisioned by Neon.
- [ ] Prisma schema pushed to Neon.
- [ ] First successful Vercel deployment.
- [ ] Production capture/retrieval smoke test.
