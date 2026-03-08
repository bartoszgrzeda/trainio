# Mode Selection Guide

Use this decision flow to pick one mode quickly and avoid mixed outputs.

## Decision Rules

1. If the user asks for a new screen spec file, use `Single-View Spec Mode`.
2. If the user asks to improve an existing `.view.md`, use `Spec Refinement Mode`.
3. If the user asks for section ideas before full drafting, use `Sections Design Mode`.
4. If the user asks for global navigation/layout/shared rules, use `App-Level Spec Mode`.
5. If the user asks what is missing or to review quality, use `Spec Audit Mode`.

## Boundary Rules

- `docs/views/*.view.md` is for one screen only.
- `docs/app-shell.md` is for cross-screen rules only.
- Never merge app-shell and screen content into one output unless explicitly asked.
- If user intent mixes global and screen asks, produce requested primary output and recommend extracting shared rules to `docs/app-shell.md`.

## Ambiguous Requests

- Prefer a best-effort assumption when intent is likely.
- State assumptions in an `Assumptions` section.
- Ask a clarifying question only if mode selection is impossible.
