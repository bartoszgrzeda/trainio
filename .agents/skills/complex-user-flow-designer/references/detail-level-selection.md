# Detail Level Selection

Use this guide to select the right depth for the flow output.

## Modes

- `high_level`: Stage-oriented map for strategy and stakeholder communication.
- `detailed_ux`: Step-level flow for UX/engineering execution and risk handling.
- `auto`: Infer level from request intent and complexity signals.

## Decision Rules

1. Use `high_level` when the user asks for exploration, vision alignment, or early product framing.
2. Use `detailed_ux` when the user asks for implementation readiness, edge-case handling, or team handoff.
3. If request includes backend contracts, validation states, or explicit error paths, prefer `detailed_ux`.
4. If request includes multiple roles or cross-feature orchestration, prefer `detailed_ux` unless the user explicitly asks for summary only.
5. In `auto`, default to `detailed_ux` when at least two complexity signals are present:
   - multiple actor roles
   - transactional or compliance-sensitive journey
   - asynchronous backend operations
   - decision branching with business rules
   - multiple fallback paths

## Expected Depth

### High-Level

- 4-8 stages with concise step summaries.
- Major branches and outcomes only.
- Dependency view at service/domain level.
- Open questions emphasized for product decisions.

### Detailed UX

- Atomic step progression with actor intent + system response.
- Branch conditions for each key decision point.
- Validation, empty, failure, and recovery states.
- Endpoint/event/service dependencies per critical interaction.

## Ambiguous Inputs

- Choose a reasonable mode from intent and constraints.
- Continue with explicit assumptions.
- Ask a clarifying question only if the requested deliverable is impossible without mode confirmation.
