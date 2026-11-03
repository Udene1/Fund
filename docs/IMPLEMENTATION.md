# Implementation status

## Implemented

- Next.js App Router dashboard shell.
- PostgreSQL persistence through Prisma.
- Event create/list/read/update/archive API with immutable narrative snapshots on edits.
- Decision create/list API with optional source event and preserved rationale.
- Reflection, lesson, policy and outcome data models.
- Lesson and policy proposal APIs with explicit accept/revise/retire actions.
- Deterministic text-and-tag event search.
- Decision brief endpoint that returns source-linked event history and accepted lessons/policies.
- Agent API requests are protected by a bearer token; no model provider or model API key is required.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set a private PostgreSQL `DATABASE_URL`.
3. Generate a long random `FUND_AGENT_TOKEN`.
4. Run `npm install`.
5. Run `npx prisma generate`.
6. Run `npx prisma db push`.
7. Run `npm run dev`.

The dashboard currently requires a working database at render time. The API requires `Authorization: Bearer $FUND_AGENT_TOKEN`.

## API

- `GET/POST /api/v1/events`
- `GET/PATCH/DELETE /api/v1/events/:id`
- `GET/POST /api/v1/decisions`\n- `GET/POST /api/v1/reflections`\n- `GET/POST /api/v1/outcomes`
- `GET/POST /api/v1/lessons`
- `POST /api/v1/lessons/:id/review`
- `GET/POST /api/v1/policies`
- `POST /api/v1/policies/:id/review`
- `POST /api/v1/search`
- `POST /api/v1/decision-briefs`\n\nMCP endpoint: `POST /mcp` (Streamable HTTP, JSON response mode). Send the same `Authorization: Bearer $FUND_AGENT_TOKEN` header.

Lesson and policy proposals remain `PROPOSED` until explicitly accepted. Source event IDs are mandatory for both.

## Known gaps before production

- Human sign-in/session UX and browser event capture are not implemented.
- Reflection and outcome read/write routes are implemented. Agent reflections remain proposed and carry optional provenance.
- Policy revision history and a general audit log need implementation.
- Stateless Streamable HTTP MCP endpoint at `/mcp`, protected by the same bearer token as REST. Tools cover event capture/read/search, decision recording/review, reflection proposals, lesson/policy proposals and approvals, and outcome recording.
- Search is lexical and deterministic, not semantic; decision briefs can miss paraphrases and counterexamples.
- No migrations have been generated or applied.
- No automated tests or deployment validation have been run.
- Do not deploy with real personal data until human authentication, rate limiting, backups, export and privacy controls are complete.
