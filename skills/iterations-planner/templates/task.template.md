# Iteration <NN> - <Concise Title>

**Status**: todo
**Suggested owner**: <solo | team member>
**Due date**: <YYYY-MM-DD | n/a for internal infrastructure>

<!-- Do not add effort estimates or t-shirt sizes. -->

## Original brief

> <Copy the original client brief verbatim without editing or paraphrasing. Preserve bullets as bullets and paragraphs as paragraphs.>

## Goal

<One to three operational sentences describing the completed outcome.>

## Tasks

- [ ] <atomic task>
- [ ] <atomic task>
- [ ] <atomic task>

## Product copy

<Include only when relevant. Use exact user-facing strings in the product language.>

- Title: "..."
- CTA: "..."
- Empty state: "..."

## Already complete

<List work that must not be repeated, with commit references when available.>

## Affected files

- `<path/to/file>` - <five-word change summary>

## Dependencies

- [ ] <earlier iteration, external input, or asset>

## Constraints

<Project rules that materially constrain this work.>

## Definition of done

- [ ] <verifiable acceptance criterion>
- [ ] <verifiable acceptance criterion>
- [ ] Any data created for a user, administrator, or developer has an appropriate read path: UI, endpoint, or export.
- [ ] Relevant type, build, and test checks pass.
- [ ] Durable project documentation is updated when architecture or conventions change.

## Completion pass

Before marking the iteration complete, inspect the changed surface through the relevant lenses:

- Frontend: loading, empty, error, success, permissions, navigation, responsive behavior, and understandable product copy.
- Backend: input validation, authorization, error contracts, edge cases, atomicity, pagination, and tests.
- Data: constraints, indexes, idempotency, and model consistency.
- End-to-end flow: execute a real public path, including at least one relevant failure path. An API smoke test is not a UI test for a UI feature.

Close every discovered completeness gap or state it explicitly. Do not add unrelated new features during this pass.

## Final report

| Requirement | Layer | Status | Evidence |
| --- | --- | --- |
| <requirement> | frontend / backend / data | pass / partial / fail | `file:line`, test, or output |

Do not mark the iteration complete while a required row is partial or failing; state the remaining work explicitly.
