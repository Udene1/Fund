# Implementation status

## First vertical slice

The initial application layer contains:
- Next.js App Router shell and a minimal event-capture dashboard.
- PostgreSQL persistence through Prisma.
- Event create/list/read/update/archive endpoints.
- Authenticated agent-facing event and search APIs.
- Deterministic text-and-tag search (not semantic search).
- Initial relational models for decisions, reflections, lessons, policies and outcomes.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set a private PostgreSQL `DATABASE_URL`.
3. Generate a long random `FUND_AGENT_TOKEN`.
4. Run `npm install`.
5. Run `npx prisma generate`.
6. Run `npx prisma db push`.
7. Run `npm run dev`.

The web dashboard currently requires a working database at render time. The agent API requires `Authorization: Bearer $FUND_AGENT_TOKEN`.

## API

- `GET /api/v1/events`
- `POST /api/v1/events`
- `GET /api/v1/events/:id`
- `PATCH /api/v1/events/:id`
- `DELETE /api/v1/events/:id` (soft archive)
- `POST /api/v1/search`

Example event payload:

```json
{
  "title": "A difficult conversation",
  "originalAccount": "My original account, in my own words.",
  "occurredAtNote": "Sometime last week",
  "tags": ["communication"],
  "importance": 3
}
```

Example request:

```bash
curl -X POST "$FUND_URL/api/v1/events" \
  -H "Authorization: Bearer $FUND_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"A difficult conversation","originalAccount":"My original account."}'
```

## Known gaps before production

- Human sign-in/session UX is not implemented.
- The dashboard capture form is a visual shell; use the authenticated REST API for capture until the form action is wired.
- Decision/reflection/lesson/policy/outcome CRUD routes are not implemented yet.
- MCP adapter is not implemented yet.
- No migrations have been generated or applied.
- No automated tests or deployment validation have been run.
- Do not deploy with real personal data until human authentication, rate limiting, backups, and privacy controls are complete.
