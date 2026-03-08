---
name: mobile-view-spec-assistant
description: Generate and refine mobile view specification markdown (`docs/views/*.view.md`) plus app-level shared rules (`docs/app-shell.md`) from rough requirements. Use when requests mention screen spec drafting, spec refinement, section planning, spec audits, or extracting global shell/navigation rules.
---

# Purpose

Convert rough mobile requirements into implementation-ready Markdown specs while strictly separating per-screen behavior from app-level shell rules.

# When to Use

- Creating one new screen spec in `docs/views/*.view.md`.
- Refining an existing `.view.md` for implementation handoff.
- Designing recommended sections before full spec generation.
- Producing app-level shared rules in `docs/app-shell.md`.
- Auditing a view spec for completeness and consistency gaps.

Example prompts:
- "Create `docs/views/home.view.md` for a coach dashboard."
- "Refine `docs/views/clients-list.view.md` and fill missing states and edge cases."
- "List recommended sections for a training-details screen before writing the full spec."
- "Generate `docs/app-shell.md` with global navigation and shared layout rules."
- "Audit this `.view.md` and tell me what is missing."

# Workflow

1. Detect mode using [references/mode-selection.md](references/mode-selection.md).
2. Resolve target inputs and gather missing context with best-effort assumptions.
3. Apply the appropriate template:
   - Single-view or refinement mode: [references/view-template.view.md](references/view-template.view.md)
   - App-level mode: [references/app-level-template.md](references/app-level-template.md)
4. Generate output while enforcing screen-level vs app-level boundary rules.
5. Validate quality with [references/spec-quality-checks.md](references/spec-quality-checks.md).
6. Return output in the required mode-specific format.

## Mode Rules

### Single-View Spec Mode

Generate exactly one `*.view.md` using [references/view-template.view.md](references/view-template.view.md).

Requirements:

- Frontmatter: `id`, `name`, `route`, `auth`, `layout`, `title`, `description`.
- Include sections for purpose, goals, sections, actions, data model, API, states, edge cases, navigation, notes.
- Include `Validation` only when inputs/forms exist.
- Include `States` with at least `default`, `loading`, `empty`, `error` and add others only when relevant.

### Sections Design Mode

Return recommended sections only (do not output a full spec), including:

- section name
- purpose
- suggested components
- suggested data fields

### Spec Refinement Mode

Update an existing `.view.md` while preserving structure and improving:

- clarity
- missing states
- missing edge cases
- action/navigation precision
- consistency of data model/API/actions

### App-Level Spec Mode

Generate `docs/app-shell.md` using [references/app-level-template.md](references/app-level-template.md).

Cover:

- app purpose
- global navigation
- shared layout rules/components
- global states
- permissions/roles
- naming conventions

### Spec Audit Mode

Assess presence/quality of core sections and return:

- concise pass/warn/fail audit summary
- prioritized concrete improvements (`P1`, `P2`)

# Checklist

- Selected mode matches user intent.
- Output stays within requested scope (screen-level vs app-level).
- Template section order is preserved.
- Required frontmatter keys are present when output is a `*.view.md`.
- Actions, states, API, and data model are consistent.
- Assumptions are clearly labeled when context is missing.
- No unrelated features or endpoints are invented.
- Global shell rules are not duplicated in per-view specs unless explicitly exceptional.

# Output Format

Return one of:

1. Full `*.view.md` spec (single-screen mode).
2. Section design list (sections mode) with `section`, `purpose`, `components`, and `data fields`.
3. Revised `*.view.md` content (refinement mode).
4. Full `docs/app-shell.md` (app-level mode).
5. Audit summary + prioritized fix list (audit mode), using:
   - `## Audit Summary`
   - `## Findings (P1/P2)`
   - `## Suggested Fixes`

Keep output concise and implementation-ready.

# Rules

- Keep per-screen specs focused on that screen only.
- Move shared app-shell concerns to `docs/app-shell.md`.
- Prefer best-effort inference over blocking questions.
- If one screen is requested, output exactly one screen spec.
- Preserve stable section naming and ordering.
- Preserve provided `METHOD + path` API pairs exactly.
- Do not invent unrelated features.
- Do not generate implementation code (React Native, backend, tests); this skill defines specs only.

# Examples

- Rough screen idea -> produce one complete `.view.md` spec using repository template.
- Mixed global + screen requirements -> keep screen spec focused and recommend extracting shared rules to `docs/app-shell.md`.
- Existing `.view.md` with missing states -> return refined content with stronger state and edge-case coverage.
- Spec audit request -> return pass/warn/fail findings and concrete prioritized fixes.

# References

- [references/mode-selection.md](references/mode-selection.md)
- [references/spec-quality-checks.md](references/spec-quality-checks.md)
- [references/view-template.view.md](references/view-template.view.md)
- [references/app-level-template.md](references/app-level-template.md)
- [references/input-schema.example.yaml](references/input-schema.example.yaml)
- [references/output-schema.example.yaml](references/output-schema.example.yaml)
- [references/examples/home.view.md](references/examples/home.view.md)
- [references/examples/app-shell.md](references/examples/app-shell.md)
- [references/examples/audit-summary.md](references/examples/audit-summary.md)
