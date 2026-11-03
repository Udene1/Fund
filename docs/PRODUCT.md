# Fund — Product Requirements

## Problem

Human memory is incomplete and reconstructive. A person may forget an event entirely, remember what they decided but forget why, or fail to recognize that a current situation resembles an earlier one. A conventional notes app stores information but does not reliably return the right experience and reasoning when it matters.

Fund externalizes this continuity.

## Primary user job

"When I face a situation, help me remember the relevant things that have happened before, understand why I reached earlier conclusions, and decide whether those conclusions still apply."

## Core records

### Event
A dated account of something that happened.

Fields:
- occurred_at (when it happened; may be approximate)
- captured_at (when it was recorded)
- title
- original_account (verbatim user narrative)
- context (people/setting/situation, only as supplied)
- tags
- importance
- privacy classification

### Decision
A choice the user made or is considering.

Fields:
- decision
- options considered
- rationale (the user's reasoning, not an AI reconstruction)
- constraints
- confidence
- linked events

### Reflection
An analysis attached to an event or decision.

Fields:
- observations
- interpretation
- alternative explanations
- what went well
- what could be improved
- unresolved questions
- author/source (user or AI)
- approval state

### Lesson
A conclusion the user wants to retain.

Fields:
- statement
- supporting events
- limitations
- confidence
- status (proposed, accepted, revised, retired)

### Policy
A user-approved intended response for a recurring trigger.

Fields:
- trigger conditions
- response
- rationale
- exceptions
- safety considerations
- supporting lessons/events
- status
- last reviewed

### Outcome
What happened after a decision or policy was applied.

Fields:
- linked decision/policy
- observed outcome
- expected versus actual
- follow-up date

## First-run workflow

1. User writes or dictates a rough event.
2. Fund saves the original account immediately.
3. Fund asks only for missing details that materially affect interpretation.
4. Fund drafts structured observations, lessons, and possible policies.
5. User edits/accepts or rejects each proposed lesson/policy.
6. Fund links accepted records to their source event.
7. Future decision review retrieves relevant records and displays why they may apply.

## Decision review

Input: a current situation, question, or choice.

Output:
1. Relevant past events (with dates and source links)
2. Previous decisions and the user's original rationale
3. Relevant accepted lessons and policies
4. Similarities and differences between past and present
5. Conflicts or counterexamples
6. Questions the user should consider
7. A recommendation only when requested, with uncertainty stated

Fund must not claim that a past event is relevant merely because two records share a keyword. The user must be able to inspect the connection and correct it.

## Capture principles

- Support short, messy, voice-transcribed narratives.
- Never require a complete form before saving an event.
- Unknown dates and details remain unknown; do not invent them.
- Distinguish event date from recording date.
- Preserve edits as history or revisions where practical.

## Safety and trust

- No diagnosis or personality labeling.
- No treating one-sided accounts as independently verified facts.
- No automatic conversion of an event into a permanent rule.
- No coercive or shaming language.
- For situations involving threats or physical danger, prioritize practical safety and de-escalation.
- Provide data export and deletion controls before broad use.

## Success criteria

- A user can capture an event in under one minute.
- A user can recover the original reasoning behind a past decision.
- A decision review shows both supporting and conflicting history.
- Every AI-generated claim is distinguishable from user-authored material.
- The user can correct, reject, export, and delete their records.
