# Fund Agent Interface

## Contract

Fund exposes one domain capability surface through two transports:

1. Versioned REST API — canonical machine interface.
2. MCP server — discoverable adapter for MCP-compatible agents.

Both transports must call the same domain services. Neither transport may bypass authorization, validation, provenance, or approval rules.

## Agent operating model

An agent is an external reasoning client, not the owner of memory.

- The user chooses which agent to use.
- The agent may read only records authorized for the current user.
- The agent can submit analysis as a proposal.
- The user remains the authority on personal lessons, values, and active policies.
- The agent must cite record IDs when using prior experiences in a decision brief.
- The agent must distinguish direct user statements from interpretations and hypotheses.
- The agent must not invent missing events, dates, motives, or outcomes.

## REST resource outline

Base path: `/api/v1`

| Resource | Initial operations |
| --- | --- |
| `/events` | POST, GET, PATCH, DELETE |
| `/events/{id}` | GET, PATCH, DELETE |
| `/decisions` | POST, GET |
| `/reflections` | POST proposal, GET, review |
| `/lessons` | POST proposal, GET, approve/revise/retire |
| `/policies` | POST proposal, GET, approve/revise/retire |
| `/search` | POST structured memory search |
| `/decision-briefs` | POST current situation; return source-linked relevant history |
| `/outcomes` | POST, GET |
| `/export` | POST export request, GET export status |

Exact HTTP methods and response schemas should be formalized alongside implementation. Mutating operations must be idempotent where practical.

## MCP tool outline

- `capture_event`: save a rough narrative immediately, preserving the original wording.
- `get_event`: retrieve the complete event and its linked records.
- `search_memories`: find events, decisions, lessons, policies, and outcomes.
- `record_decision`: record a choice and the user's stated rationale.
- `propose_reflection`: submit analysis, clearly marked as agent-authored.
- `propose_lesson`: suggest a lesson with supporting event IDs and limitations.
- `propose_policy`: suggest a future response with triggers, rationale, and exceptions.
- `review_decision`: retrieve relevant history, counterexamples, conflicts, and open questions for a current situation.
- `record_outcome`: record what happened after a decision or policy was applied.

Tool schemas must require source IDs for claims about prior events. Approval actions should be separate, explicit operations.

## Decision brief response

A decision brief should include:
- current situation as submitted,
- relevant event IDs and dates,
- short evidence excerpts,
- the user's original reasoning,
- accepted lessons and active policies,
- conflicting or superseded records,
- differences between historical and current circumstances,
- uncertainties and questions,
- a transparent explanation of retrieval relevance.

## Authentication

The API and MCP endpoint are private. Use secure user sessions for the web app and scoped, revocable authorization for agents. Do not put credentials in URLs. Never create a public anonymous endpoint for personal memory.

## No inference dependency

The interface contract must not require a specific LLM, provider, model identifier, SDK, or provider API key. An external agent may use any model or no model at all. Fund remains useful for capture, storage, search, linking, export, and review without inference.
