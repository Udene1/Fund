# Fund — Initial Architecture

## Architectural direction

Start as a private, single-user web application with a clean separation between:
- durable user-authored records,
- AI-generated analysis,
- retrieval/indexing,
- and user-approved lessons or policies.

The repository may be public, but personal records must live only in a private database and must never be included in source code, fixtures, logs, or commits.

## Suggested first implementation

- Next.js App Router for the web application and server routes.
- PostgreSQL for durable records.
- A typed data-access layer and schema migrations.
- Server-side authentication before storing real personal records.
- Full-text search first; semantic retrieval can follow after the core record model is reliable.
- AI provider behind a replaceable interface. The app must remain usable for capture, browsing, editing, and search without an AI provider.

Exact framework and provider choices should be confirmed against the repository and deployment environment before implementation.

## Data integrity

- Store the original event narrative separately from structured summaries.
- Every generated reflection has provenance, model/provider metadata when available, creation time, and approval status.
- Lessons and policies reference their supporting events.
- Policy revisions retain prior versions.
- Deleting an event must clearly explain the effect on linked reflections, lessons, and policies.
- Keep an audit trail for important edits and approvals.

## Retrieval pipeline

1. Parse the current situation into topics, actors/roles, context, and decision type.
2. Retrieve candidates using full-text search and structured tags.
3. Rank by contextual similarity, recency, importance, and outcome relevance.
4. Include counterexamples and conflicting policies.
5. Return source-linked excerpts and explain why each item was retrieved.
6. Ask the user to confirm relevance where the match is uncertain.

## Initial entities

- Event
- Decision
- Reflection
- Lesson
- Policy
- Outcome
- Tag
- RecordLink

## Security requirements before real use

- Authentication and authorization on every data route.
- Secrets only in environment variables.
- No personal event text in application logs or analytics.
- Database backups and a tested export path.
- Rate limiting on AI endpoints.
- Clear retention and deletion behaviour.
- Avoid sending sensitive event details to external AI providers without explicit, informed user control.
