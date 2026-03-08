---
name: rn-view-generator
description: Generate implementation-ready React Native TypeScript screen code from markdown view specifications by combining shared app rules from `docs/app-shell.md` with one screen spec from `docs/views/*.view.md`. Use when asked to turn view specs into production-grade RN screens, including state handling, actions, navigation, typed models, and shell-consistent layout behavior.
---

# Purpose

Generate production-ready React Native TypeScript screen implementations from one view spec plus app-shell rules, preserving declared behavior, API contracts, and navigation semantics.

# When to Use

- Implementing a screen from `docs/views/*.view.md`.
- Converting view specs into typed RN screen code with state handling and actions.
- Aligning generated screen behavior with shared shell rules in `docs/app-shell.md`.

Example prompts:
- "Generate `HomeScreen` from `docs/app-shell.md` and `docs/views/home.view.md`."
- "Implement `docs/views/clients-list.view.md` as a React Native TypeScript screen."
- "Create `TrainingDetailsScreen` from this view spec and app-shell rules."

# Workflow

1. Resolve required input files.
2. Extract global rules from `docs/app-shell.md`.
3. Extract screen-specific requirements from the selected `docs/views/*.view.md`.
4. Merge with explicit precedence (shell global, view local).
5. Generate one implementation-ready RN TypeScript screen.
6. Return output in the required format.

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

Do not invent product features not present in specs.

# Checklist

- One target view file was selected correctly.
- Shell rules were inherited, not duplicated.
- Screen behavior matches view spec exactly.
- API paths and methods match spec exactly.
- Actions, disabled/hidden behavior, and navigation targets match spec.
- Output contains exactly one main code block after `Interpretation`.

# Output Format

Return in this order:

1. `Interpretation` section.
2. One main code block with the generated screen implementation.
3. Optional `Assumptions` section for minimal explicit assumptions.
4. Optional `Suggested companion files` section.

# Rules

- Prefer best-effort generation over blocking questions.
- Keep assumptions minimal and explicit.
- Preserve route names, messages, labels, and state names exactly when specified.
- Respect hidden vs disabled semantics exactly when declared.
- Do not regenerate app-shell code unless explicitly requested.
- Do not add sorting/filtering/refresh behaviors unless specified.

# Examples

- `home.view.md` request -> produce `HomeScreen` implementation with state rendering and shell-aligned layout.
- list screen request with API table -> produce typed list screen preserving exact API routes and query behavior.

# References

- Input artifacts: `docs/app-shell.md` and `docs/views/*.view.md`.
