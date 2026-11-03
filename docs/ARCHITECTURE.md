# Fund — Architecture

## Architectural direction

Fund is a model-independent personal memory and decision-support system. Its durable records and deterministic retrieval belong to Fund; language models and agents are replaceable clients.

Start as a private, single-user application with a clean separation between:
- durable user-authored records,
- AI/agent-generated proposals,
- deterministic retrieval and relationship services,
- and user-approved lessons or policies.

The repository may be public, but personal records must live only in private storage and must never be included in source code, fixtures, logs, or commits.

## No embedded model dependency

- Do not hardcode a model name, provider, SDK, or inference endpoint into the core domain.
- Do not require or store OpenAI, Anthropic, Google, or other model-provider API keys.
- Fund's core capture, CRUD, search, linking, export, and policy retrieval must work without an AI model.
- AI analysis is performed by an external agent or client chosen by the user.
- The external agent submits proposed structured reflections, lessons, links, and policies through Fund's interfaces.
- Every generated proposal records provenance where available (agent/client identity, provider/model supplied by the caller, timestamp), but provenance fields are optional and must not create a provider dependency.
- User approval is required before a proposed lesson or policy becomes an active personal rule.

## Interface strategy: REST core + MCP adapter

Use a versioned, agent-facing REST API as the canonical application interface. Build an MCP server as a thin adapter over the same application services.

Why both:
- REST provides a stable contract for web clients, scripts, automation, and any agent framework.
- MCP makes Fund's capabilities discoverable and convenient for MCP-compatible agents.
- Both interfaces call the same domain services and enforce the same authorization and validation rules.
- Do not implement business logic separately in MCP handlers.

Initial REST capability groups:
- Events: create, retrieve, update, list, archive/delete.
- Decisions: create, retrieve, link to events, record rationale and outcomes.
- Reflections: submit and review AI/agent-generated analysis.
- Lessons: propose, approve, revise, retire.
- Policies: propose, approve, retrieve, revise, retire.
- Retrieval: search memories and assemble a decision brief for a current situation.
- Data portability: export records and request deletion.

Initial MCP tools should mirror the high-value workflows:
- `capture_event`
- `get_event`
- `search_memories`
- `record_decision`
- `propose_reflection`
- `propose_lesson`
- `propose_policy`
- `review_decision`
- `record_outcome`

MCP tools are not a second database or a second source of truth. They call the same REST/domain service layer.

## Authentication and keys

"No model API keys" does not mean "no authentication."

- Human access should use a secure session-based sign-in.
- Agent access should use a standard, revocable, narrowly scoped credential or OAuth authorization appropriate to the deployment.
- Never expose an unauthenticated endpoint that can read or mutate personal records.
- Do not reuse model-provider credentials as Fund credentials.
- Keep credentials out of URLs, logs, source code, and client-side bundles.
- Support credential rotation and immediate revocation.
- Start with one private user/tenant, but include ownership boundaries in the data model from the beginning.

## Suggested first implementation

- Next.js App Router for the web application and versioned API routes.
- PostgreSQL for durable records.
- A typed domain/service layer shared by REST and MCP.
- Schema migrations and explicit data ownership.
- Server-side authentication before storing real personal records.
- PostgreSQL full-text search first; semantic retrieval can be added later without changing the record contract.
- An MCP endpoint that delegates to the same services.
- No model SDK or inference provider required for the first release.

Exact framework and hosting choices should be confirmed against the repository and deployment environment before implementation.

## Data integrity

- Store the original event narrative separately from structured summaries.
- Distinguish user-authored facts/account from user interpretation, agent hypothesis, and unknown information.
- Generated reflections and proposals retain provenance and approval state.
- Lessons and policies reference their supporting events.
- Policy revisions retain prior versions and rationale.
- Deleting an event must clearly explain the effect on linked reflections, lessons, and policies.
- Keep an audit trail for important edits and approvals.
- Never silently convert an agent suggestion into a user's belief or active policy.

## Retrieval pipeline

1. Accept a current situation or decision question from the user or authorized agent.
2. Extract or accept structured topics, context, decision type, and constraints; extraction may be performed by the external agent.
3. Retrieve candidates using full-text search, tags, explicit links, and structured filters.
4. Rank by contextual relevance, recency, importance, and outcome relevance.
5. Include counterexamples, conflicting policies, and unresolved questions.
6. Return source-linked records and explain why each item was retrieved.
7. Let the user or agent inspect the original event and reasoning.
8. Do not claim relevance merely because two records share a keyword.

## Initial entities

- Event
- Decision
- Reflection
- Lesson
- Policy
- Outcome
- Tag
- RecordLink
- User/Tenant
- AgentCredential (or equivalent authorization principal)

## Security and privacy requirements before real use

- Authentication and authorization on every data route and MCP tool.
- Private database; no personal records in Git.
- No personal event text in application logs or analytics.
- Database backups and a tested export path.
- Rate limiting and abuse protection on write/search interfaces.
- Clear retention and deletion behaviour.
- External agents receive only the records needed for the requested task.
- Do not send sensitive event details to external AI providers without explicit, informed user control.
- Test authorization boundaries, revocation, export, and deletion.
