# Delegation Contracts

This skill orchestrates two sub-skills in strict order.

## Stage Order

1. `mobile-view-spec-assistant`
2. `rn-view-generator`

Never run Stage 2 until Stage 1 output passes backend-constraint checks.

## Stage 1: `mobile-view-spec-assistant`

### Input Contract (minimum)

- mode: `single_view` (or `refinement` if target spec already exists)
- target file path in `docs/views/*.view.md`
- backend contract digest:
  - endpoint list (`METHOD + path`)
  - field constraints and validation rules
  - backend state model and transitions
  - error mapping
  - actions and navigation implications
- requirement to include:
  - loading/empty/success/failure states
  - validation and error presentation
  - reusable component suggestions

### Prompting Rules

- Explicitly state: backend feature is source of truth.
- Explicitly forbid inventing unrelated endpoints or actions.
- Require state mapping consistency with backend lifecycle.
- Require notes for hidden/disabled controls derived from backend rules.

### Acceptance Gates

- Spec includes endpoint references with exact `METHOD + path`.
- States section includes full required UI states plus feature-specific states.
- Validation and edge-case sections reflect backend constraints.
- Actions and navigation are consistent with backend outcomes.

If gates fail, run one refinement pass with targeted corrections.

## Stage 2: `rn-view-generator`

### Input Contract (minimum)

- `docs/app-shell.md`
- finalized target `docs/views/*.view.md` from Stage 1
- optional target code paths (screen/e2e/helper files)
- constraints:
  - preserve exact API methods/paths from spec
  - preserve validation and error semantics
  - preserve state and navigation behavior

### Prompting Rules

- Explicitly state: do not invent product behavior.
- Require full handling for declared states and actions.
- Require stable `testID` usage for key controls/states.
- Require RN best practices (typed data contracts, hooks, clear state boundaries).

### Acceptance Gates

- Generated files align to view spec actions/states.
- API placeholders/calls match contract pairs.
- Validation/error handling is implemented in UI.
- Navigation outcomes match spec-defined behavior.

If gates fail, run one correction pass or report exact blocker.

## Reporting Requirements

Include in final report:
- inputs sent to each delegated skill (summarized)
- output file paths from each stage
- any refinement/correction pass executed
- constraint-preservation verdict
