---
name: backend-feature-to-mobile-view
description: Generate mobile view specs and React Native implementations from existing backend features by treating backend contracts and business rules as source of truth. Use when requests start from API/domain behavior and need `docs/views/*.view.md` plus RN screen generation through `mobile-view-spec-assistant` and `rn-view-generator`.
---

# Purpose

Transform an existing backend feature into a mobile-ready implementation in two enforced phases: (1) backend-constrained view spec generation, then (2) React Native screen generation aligned to that spec.

# When to Use

- A request starts with existing backend endpoints/contracts and needs a mobile screen.
- The UX flow must be inferred from backend behavior and state transitions.
- Field-level validation, error semantics, and business constraints must be preserved in UI.
- You want explicit orchestration that runs `mobile-view-spec-assistant` first and `rn-view-generator` second.

Example prompts:
- "Use backend contracts for workout plan creation and generate the mobile screen end to end."
- "From this backend feature, create `docs/views/attendance-checkin.view.md` and then implement it in RN."
- "Map backend approval states into UI states, then generate view spec and React Native code."

## Required Inputs

- Backend source-of-truth artifacts for one feature:
  - endpoint list with exact `METHOD + path`
  - request/response contracts (field types, required flags, constraints)
  - business rules and state transitions
- Target mobile scope:
  - feature/view name (and route intent if known)
  - auth context (public/authenticated/role-bound)
- Project file context:
  - output target in `docs/views/*.view.md`
  - `docs/app-shell.md` path (required before RN generation stage)

## Optional Inputs

- Existing partial `docs/views/*.view.md` to refine.
- Existing RN screen file path (update instead of create).
- Navigation map and role/permission matrix.
- Design-system/reusable component constraints.
- Localization keys/messages and analytics requirements.

# Workflow

1. Normalize request into the structure from [references/input-schema.example.yaml](references/input-schema.example.yaml).
2. Analyze backend contracts and behavior using [references/backend-analysis-checklist.md](references/backend-analysis-checklist.md):
   - endpoint/contract inventory
   - business constraints and validation rules
   - backend states/events/transitions
   - error codes/messages and recovery expectations
3. Infer mobile UX flow from backend behavior:
   - map backend states to UI states (`default`, `loading`, `empty`, `success`, `failure`, plus domain-specific states)
   - map user actions to backend operations
   - map operation outcomes to navigation results
4. Prepare a structured spec-brief that includes:
   - field validation rules and error presentation strategy
   - loading/empty/success/failure state behavior
   - available user actions and disabled/hidden conditions
   - reusable component opportunities
5. Delegate to `mobile-view-spec-assistant` using [references/delegation-contracts.md](references/delegation-contracts.md). This stage must produce or refine the target `docs/views/*.view.md`.
6. Validate generated spec against backend constraints. If mismatches exist, run one targeted refinement pass through `mobile-view-spec-assistant`.
7. Delegate to `rn-view-generator` with `docs/app-shell.md` + finalized `docs/views/*.view.md`, following delegation rules.
8. Verify generated RN output preserves backend contracts, constraints, state mapping, action semantics, navigation outcomes, and RN best practices.
9. Return output in the required format plus explicit assumptions or blockers.

## Delegation Rules

Apply orchestration rules from [references/delegation-contracts.md](references/delegation-contracts.md):

- `mobile-view-spec-assistant`
  - Runs before RN generation.
  - Receives backend-derived UX/state/validation/navigation brief.
  - Must output a structured `docs/views/*.view.md` with full state coverage.
- `rn-view-generator`
  - Runs only after the spec passes constraint checks.
  - Consumes `docs/app-shell.md` and the finalized target view spec.
  - Must preserve exact API contract references and backend-driven UI behavior.

## Failure Handling

Use [references/failure-handling.md](references/failure-handling.md) and report stage-specific failures (`analysis`, `spec_generation`, `rn_generation`, `verification`):

- missing backend contracts -> stop and report missing required inputs
- ambiguous state machine -> proceed with explicit assumptions and risk notes
- delegated output missing required sections -> rerun once with correction instructions
- missing `docs/app-shell.md` at RN stage -> block RN stage and report required path/action
- verification blocked -> include exact command/error and unblock recommendation

# Checklist

- Backend artifacts were treated as primary source of truth.
- Endpoint/contract analysis was completed before UI generation.
- Backend states were mapped to explicit UI states.
- Validation rules and error messages are represented in spec and RN output.
- Loading/empty/success/failure states are fully covered.
- User actions and navigation outcomes align with backend behavior.
- Reusable component suggestions are present.
- RN best practices are applied (typed props/state, hooks, stable testIDs, clear state boundaries).
- Delegation order was respected (`mobile-view-spec-assistant` -> `rn-view-generator`).
- Output includes a constraint-preservation audit.

# Output Format

Return sections in this order:

1. `Interpretation`
2. `Backend Contract Digest`
3. `UX Mapping`
4. `Delegation Summary`
5. `Generated/Updated Files`
6. `Constraint Preservation Report`
7. `Verification`
8. Optional `Assumptions`
9. Optional `Failure Handling Notes`

Use schemas:
- [references/input-schema.example.yaml](references/input-schema.example.yaml)
- [references/output-schema.example.yaml](references/output-schema.example.yaml)

# Rules

- Always generate/refine the view spec first, RN code second.
- Never invent backend endpoints, fields, or business rules.
- Preserve exact `METHOD + path` pairs from backend artifacts.
- Preserve backend-driven validation, error, hidden/disabled, and transition semantics.
- Keep scope narrow: one backend feature to one primary mobile view flow unless user asks for decomposition.
- Prefer best-effort inference only when backend details are missing; label assumptions explicitly.
- Do not bypass delegated skills when they are available.
- Do not redesign backend contracts.
- Do not produce unrelated app-shell rewrites unless explicitly requested.

# Examples

- Backend "Create Client" contracts + domain rules -> generate `docs/views/client-create.view.md`, then RN implementation and constraint-preservation report.
- Backend approval workflow (`draft`, `submitted`, `approved`, `rejected`) -> generate state-mapped mobile spec, then RN UI with matching transitions and errors.
- Role-restricted backend actions -> generate UI action visibility/disabled rules and navigation implications aligned with permissions.

# References

- [references/backend-analysis-checklist.md](references/backend-analysis-checklist.md)
- [references/delegation-contracts.md](references/delegation-contracts.md)
- [references/failure-handling.md](references/failure-handling.md)
- [references/input-schema.example.yaml](references/input-schema.example.yaml)
- [references/output-schema.example.yaml](references/output-schema.example.yaml)
- [references/examples/backend-feature.input.example.yaml](references/examples/backend-feature.input.example.yaml)
- [references/examples/generated-mobile-view-spec.example.md](references/examples/generated-mobile-view-spec.example.md)
- [references/examples/backend-feature-to-mobile-view.report.example.md](references/examples/backend-feature-to-mobile-view.report.example.md)
