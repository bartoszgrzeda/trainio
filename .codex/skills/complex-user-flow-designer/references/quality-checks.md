# Quality Checks

Run these checks before finalizing a flow.

## Completeness Checks

- At least one primary actor and clear goal are present.
- Trigger/entry point and preconditions are explicit.
- Success outcomes are measurable and unambiguous.
- Main flow has ordered, non-duplicative progression.

## Complexity Coverage Checks

- Decision points include branch conditions and outcomes.
- Alternative flows cover non-trivial branches (not just "cancel").
- Edge cases include at least one empty-state and one exception path.
- Error handling includes recovery and terminal behavior.

## System Alignment Checks

- System responses are mapped to user-critical steps.
- Backend/service dependencies are explicitly listed.
- Validation states include client-side and server-side where relevant.
- Async states (pending/retry/timeout) are defined when needed.

## Practicality Checks

- Steps are actionable for product, UX, and engineering teams.
- Open questions are decision-oriented and assigned context.
- Assumptions are clearly labeled and risk-aware.
- Detail level matches request intent (`high_level` vs `detailed_ux`).

## Final Gate

Do not finalize until:

- happy path + at least one meaningful branch are covered
- failure path coverage exists for critical stages
- dependencies and unresolved decisions are visible to stakeholders
