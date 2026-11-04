# Implementation status

## Implemented

- Next.js App Router dashboard shell.
- PostgreSQL persistence through Prisma.
- Event create/list/read/update/archive API with immutable narrative snapshots on edits.
- Decision create/list API with optional source event and preserved rationale.
- Reflection, lesson, policy and outcome data models.
- Reflection, lesson and policy proposal APIs with explicit accept/revise/retire review actions.
- Deterministic text-and-tag event search.
- Decision brief endpoint that returns source-linked event history and accepted lessons/policies.
- Agent requests use a bearer token; owner browser sessions are also accepted by the private REST API. No model provider or model API key is required.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `FUND_DB_DATABASE_URL` to a private PostgreSQL connection string. In Vercel, this is injected by Fund's dedicated Neon integration; do not use the legacy shared `DATABASE_URL`.
3. Generate a long random `FUND_AGENT_TOKEN`, `FUND_SESSION_SECRET` (at least 32 characters), and a unique `FUND_OWNER_PASSWORD`.
4. Run `npm install`.
5. Run `npx prisma generate`.
6. Run `npx prisma db push` only after verifying the target is Fund's dedicated, empty Neon database.
7. Run `npm run dev`.

The dashboard requires a working database at render time. The owner password and session secret must be configured in the hosting environment; never commit `.env`. API routes accept the signed owner session or `Authorization: Bearer $FUND_AGENT_TOKEN`, except the MCP endpoint, which requires the agent token. The browser dashboard requires a valid signed session cookie. Browser capture uses `POST /api/v1/capture`. Event detail pages support owner-authored decisions and reflections; `/review` is the approval queue for agent reflections, lessons and policies.

## API

- `GET/POST /api/v1/events` (owner session or agent token)
- `POST /api/v1/capture` (owner session or agent token)
- `POST /api/auth/login` and `POST /api/auth/logout`
- `GET/PATCH/DELETE /api/v1/events/:id`
- `GET/POST /api/v1/decisions`
- `GET/POST /api/v1/reflections`
- `POST /api/v1/reflections/:id/review`
- `GET/POST /api/v1/outcomes`
- `GET/POST /api/v1/lessons`
- `POST /api/v1/lessons/:id/review`
- `GET/POST /api/v1/policies`
- `POST /api/v1/policies/:id/review`
- `POST /api/v1/search`
- `POST /api/v1/decision-briefs`
- `GET /api/v1/export` (full JSON backup, owner session or agent token)

MCP endpoint: `POST /mcp` (stateless MCP HTTP, JSON response mode with legacy Streamable HTTP compatibility). Send the same `Authorization: Bearer $FUND_AGENT_TOKEN` header.

Agent reflection, lesson and policy proposals remain `PROPOSED` until explicitly accepted. Source event IDs are mandatory for both.

## Known gaps before production

- Single-owner password sign-in, random signed 14-day HTTP-only sessions, sign-out, protected dashboard and browser event capture are implemented. Configure `FUND_OWNER_PASSWORD` and `FUND_SESSION_SECRET`.
- Reflection and outcome read/write routes are implemented. Owner reflections are marked `USER` and accepted as the owner's own account; agent reflections remain proposed and can be reviewed.
- A general audit log and policy revision history need implementation.
- Search is lexical and deterministic, not semantic; decision briefs can miss paraphrases and counterexamples.
- Full JSON export is implemented; deletion controls remain outstanding.
- No migrations have been generated or applied yet; the initial schema is intended to be applied once to the verified, empty Fund database with `prisma db push`. Future production schema changes should use reviewed Prisma migrations and `prisma migrate deploy`.
- Unit tests and CI validation are configured; check the latest GitHub Actions run before treating the build as verified.
- Before production use with sensitive personal records, add rate limiting/login throttling, backup storage and restore tests, deletion controls, and validate the app in a real deployment. The owner password is a simple single-owner gate, not multi-user identity management.
