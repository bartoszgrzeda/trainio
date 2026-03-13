---
name: complex-user-flow-designer
description: Generate structured end-to-end user flow specs for complex app journeys with branching, decision points, edge cases, backend dependencies, and validation/error handling. Use when requests involve onboarding, conversion, retention, transactional, cross-feature, or cross-role journeys that need product/UX/engineering alignment.
---

# Purpose

Convert a product idea, feature concept, or problem statement into a practical, end-to-end user flow specification that covers the happy path plus realistic alternate, exception, and failure paths.

# When to Use

- The flow includes multiple user goals, branches, or decision points.
- You need non-happy paths (empty, validation, error, fallback) to be explicit.
- Backend dependencies, system actions, and async states affect UX decisions.
- The flow spans multiple features, surfaces, or user roles.
- The output must support product planning, UX design, engineering handoff, and stakeholder communication.

Example prompts:
- "Design a detailed end-to-end onboarding-to-activation flow with drop-off recovery."
- "Create a transactional checkout flow with fraud review, payment retries, and fallback options."
- "Map a cross-role approval journey between requester, manager, and finance."
- "Turn this product problem statement into a high-level flow for stakeholder review."
- "Generate a detailed UX flow with validation states and backend dependencies."

## Required Inputs

- Product idea, feature concept, or problem statement.
- Target journey scope (onboarding, conversion, retention, transactional, or custom).
- Primary actor(s) and desired outcome (or enough context to infer them).

## Optional Inputs

- Known entry points, constraints, policies, or business rules.
- Known backend services/endpoints/events and system limitations.
- Existing pain points, failure scenarios, and edge cases.
- Preferred detail level (`high_level`, `detailed_ux`, or `auto`).

# Workflow

1. Normalize request into the structure from [references/input-schema.example.yaml](references/input-schema.example.yaml).
2. Select detail level using [references/detail-level-selection.md](references/detail-level-selection.md).
3. Extract actors, goals, entry points, preconditions, and success outcomes.
4. Decompose the experience into stages and subflows using [references/flow-stage-framework.md](references/flow-stage-framework.md).
5. Draft the main flow as a step-by-step progression with explicit actor intent, system response, validation state, and dependency.
6. Add alternative flows for decision branches, role differences, and feature handoffs.
7. Add error, edge, empty, and fallback paths with recovery actions and terminal outcomes.
8. Capture assumptions, external dependencies, and open product questions.
9. Validate completeness with [references/quality-checks.md](references/quality-checks.md).
10. Return output in the required format and selected detail level.

## Detail-Level Rules

### High-Level Flow

Use for discovery, roadmap, or stakeholder alignment:

- Stage-focused flow summary.
- Key decision branches and outcomes.
- Key dependencies and unresolved questions.

### Detailed UX Flow

Use for design/engineering handoff:

- Atomic step-by-step flow with validation states.
- Explicit backend/service dependencies per critical step.
- Full alternate/error handling with recovery behavior.

# Checklist

- Actor(s), goals, and success outcomes are explicit.
- Entry points, triggers, and preconditions are clear.
- Main flow is sequential and executable.
- Decision points include branch conditions and outcomes.
- Alternative, exception, and failure paths are covered.
- Validation, empty, and error states are concrete.
- System actions and backend dependencies are mapped.
- Cross-role and cross-feature interactions are included when relevant.
- Assumptions and open questions are explicit and actionable.
- Output depth matches selected detail level.

# Output Format

Return one flow specification with these sections in order:

1. `# Flow Name: <name>`
2. `## Goal`
3. `## Actors`
4. `## Preconditions`
5. `## Trigger / Entry Point`
6. `## Success Outcomes`
7. `## Stages and Subflows`
8. `## Main Flow`
9. `## Alternative Flows`
10. `## Error / Edge Cases`
11. `## System Responses and Dependencies`
12. `## Notes / Open Questions`
13. Optional `## Assumptions`

Use schemas:
- [references/input-schema.example.yaml](references/input-schema.example.yaml)
- [references/output-schema.example.yaml](references/output-schema.example.yaml)

# Rules

- Keep tone and structure product-oriented, UX-focused, and implementation-practical.
- Prioritize clarity, completeness, and real-world applicability over brainstorming breadth.
- Always include more than a linear happy path.
- Tie user-visible behavior to system/backend behavior where relevant.
- Keep flow steps concrete, testable, and implementation-oriented.
- State assumptions instead of inventing unknown policies or APIs.
- Keep scope to the requested journey; avoid unrelated feature design.
- Do not generate UI mockups or visual design systems.
- Do not generate implementation code unless explicitly requested.

# Examples

- Product problem statement -> high-level onboarding-to-activation flow for stakeholder alignment.
- Checkout concept -> detailed transactional UX flow with retries, fallback payment, and fraud/manual-review branch.
- Cross-role process -> request, approval, and fulfillment flow with branch conditions and exception handling.

# References

- [references/detail-level-selection.md](references/detail-level-selection.md)
- [references/flow-stage-framework.md](references/flow-stage-framework.md)
- [references/quality-checks.md](references/quality-checks.md)
- [references/input-schema.example.yaml](references/input-schema.example.yaml)
- [references/output-schema.example.yaml](references/output-schema.example.yaml)
- [references/examples/product-brief.input.example.yaml](references/examples/product-brief.input.example.yaml)
- [references/examples/high-level-onboarding-flow.example.md](references/examples/high-level-onboarding-flow.example.md)
- [references/examples/detailed-transaction-flow.example.md](references/examples/detailed-transaction-flow.example.md)
