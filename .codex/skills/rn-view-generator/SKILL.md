---
name: rn-view-generator
description: Generate implementation-ready React Native TypeScript screens from markdown view specifications, including matching Detox E2E tests and executed verification. Use when turning `docs/views/*.view.md` into production-grade RN screens with testIDs, state/actions, navigation, and validated user flows.
---

# Purpose

Generate production-ready React Native TypeScript screen implementations from one view spec plus app-shell rules, including matching Detox E2E tests and verification that executes E2E commands.

# When to Use

- Implementing a screen from `docs/views/*.view.md`.
- Converting view specs into typed RN screen code with state handling and actions.
- Aligning generated screen behavior with shared shell rules in `docs/app-shell.md`.
- Adding or updating E2E coverage for the implemented screen flow.

Example prompts:
- "Generate `HomeScreen` from `docs/app-shell.md` and `docs/views/home.view.md`."
- "Implement `docs/views/clients-list.view.md` as a React Native TypeScript screen."
- "Create `TrainingDetailsScreen` plus Detox tests from this view spec and app-shell rules."

# Workflow

1. Resolve required input files.
2. Extract global rules from `docs/app-shell.md`.
3. Extract screen-specific requirements from the selected `docs/views/*.view.md`.
4. Build a selector map (`testID`s) and E2E scenario list from the view states/actions.
5. Generate one implementation-ready RN TypeScript screen (with stable `testID`s where needed).
6. Generate or update companion Detox E2E test(s) for the main happy path and list visibility/result checks.
7. Run verification commands, including E2E execution.
8. Return output in the required format.

## Input Resolution Rules

- Always read `docs/app-shell.md` and one target `docs/views/*.view.md`.
- If no target screen is explicitly named, infer from request context.
- Ask a clarifying question only when file selection is impossible.

## Merge Precedence Rules

- `docs/app-shell.md` is source of truth for global layout/navigation/conventions.
- Target `docs/views/*.view.md` is source of truth for screen content, actions, states, and navigation outcomes.
- Do not duplicate shell-level logic in the screen unless explicitly required.

## Code Generation Rules

Generate with:

- React Native + TypeScript.
- Functional components + hooks.
- React Navigation style APIs.
- Types/interfaces derived from view data model.
- Full handling for all declared screen states.
- Action handlers aligned to spec-defined behaviors.
- API placeholders/calls preserving exact `METHOD + path` (including `/api` prefix).
- Mobile-first layout constraints and shell safe-area/bottom-nav behavior.
- Stable `testID` attributes for controls required by E2E.

Do not invent product features not present in specs.

## E2E Generation Rules

- Use Detox + TypeScript.
- Place tests under `app/e2e/tests/` unless repository conventions differ.
- Prefer `by.id(...)` selectors first; use text/label only as fallback.
- Ensure each generated flow asserts final user-visible result, not only navigation.
- For list-creation flows, assert that the newly created entity appears in the list.
- Add or update helper/page-object files under `app/e2e/screens/` when it reduces duplication.

## Verification Command Policy

- Verification is incomplete unless an E2E command was executed.
- Run commands from the mobile app root (`app/` in this repository).
- Preferred command order:
  1. `npm run lint`
  2. `npx tsc --noEmit` (or project-equivalent typecheck)
  3. `npm test -- --watchAll=false` (if unit tests exist)
  4. E2E (mandatory): first available from
     - `npm run e2e:test:ios`
     - `npm run e2e:test`
     - `npx detox test --configuration ios.sim.debug`
- If E2E execution is blocked, report the exact blocking command/error and what is missing.

# Checklist

- One target view file was selected correctly.
- Shell rules were inherited, not duplicated.
- Screen behavior matches view spec exactly.
- API paths and methods match spec exactly.
- Actions, disabled/hidden behavior, and navigation targets match spec.
- E2E test was generated or updated for the implemented flow.
- At least one E2E command was executed during verification (or blocker reported explicitly).

# Output Format

Return in this order:

1. `Interpretation` section.
2. `Generated/Updated Files` section (screen + E2E + helpers).
3. One main code block with the generated screen implementation.
4. One code block with generated/updated E2E test.
5. `Verification` section listing executed commands and pass/fail outcomes (including E2E).
6. Optional `Assumptions` section for minimal explicit assumptions.
7. Optional `Suggested companion files` section.

# Rules

- Prefer best-effort generation over blocking questions.
- Keep assumptions minimal and explicit.
- Preserve route names, messages, labels, and state names exactly when specified.
- Respect hidden vs disabled semantics exactly when declared.
- Do not regenerate app-shell code unless explicitly requested.
- Do not add sorting/filtering/refresh behaviors unless specified.
- Do not finish with "verified" status without running an E2E command.
- Prefer `testID` selectors in generated E2E tests; avoid brittle text-only selectors.

# Examples

- `home.view.md` request -> produce `HomeScreen` + matching smoke/happy-path Detox test.
- list screen request with create action -> produce screen + E2E test that verifies the new item appears in the list.

# References

- Input artifacts: `docs/app-shell.md` and `docs/views/*.view.md`.
- [references/e2e-generation-rules.md](references/e2e-generation-rules.md)
- [references/verification-policy.md](references/verification-policy.md)
- [references/input-schema.example.yaml](references/input-schema.example.yaml)
- [references/output-schema.example.yaml](references/output-schema.example.yaml)
- [references/examples/clients-list.screen.tsx](references/examples/clients-list.screen.tsx)
- [references/examples/clients-list.add-client.e2e.ts](references/examples/clients-list.add-client.e2e.ts)
- [references/examples/testid-map.md](references/examples/testid-map.md)
