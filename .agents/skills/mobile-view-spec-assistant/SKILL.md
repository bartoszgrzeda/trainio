---
name: mobile-view-spec-assistant
description: Create mobile app view specifications in Markdown (`.view.md`) from rough product ideas and generate app-level shared-spec files when requirements are global. Use for screen design docs, developer handoff specs, state/action/API/data modeling, and separating per-screen content from app-shell/navigation/layout rules.
---

# Purpose

Turn rough mobile product ideas into implementation-ready Markdown specifications while keeping a strict boundary between screen-level specs and app-level shell rules.

# When to Use

- Creating a new screen spec (`*.view.md`) from a rough feature idea.
- Refining an existing screen spec for developer handoff.
- Designing sections before full screen specification.
- Producing app-level shared rules in `docs/app-shell.md`.
- Auditing a view spec for completeness gaps.

Example prompts:
- "Create a home screen spec for a trainer mobile app."
- "Refine `docs/views/clients-list.view.md` and fill missing states and edge cases."
- "Generate `docs/app-shell.md` with global navigation and shared layout rules."
- "Audit this `.view.md` and tell me what is missing."

# Workflow

1. Detect mode from the request.
2. Gather missing context with minimal assumptions.
3. Apply the mode-specific template and constraints.
4. Keep app-level vs feature-level vs single-screen boundaries explicit.
5. Return concise, implementation-ready Markdown.

## Modes

### Single-View Spec Mode

Generate exactly one `*.view.md` using [references/view-template.view.md](references/view-template.view.md).

Requirements:

- Frontmatter: `id`, `name`, `route`, `auth`, `layout`, `title`, `description`.
- Include sections for purpose, goals, sections, actions, data model, API, states, edge cases, navigation, notes.
- Include `Validation` only when inputs/forms exist.
- Include `States` with at least `default`, `loading`, `empty`, `error` and add others only when relevant.

### Sections Design Mode

Return recommended sections before full spec generation, including:

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

- concise pass/warn audit summary
- concrete improvements

# Checklist

- Selected mode matches user intent.
- Output stays within requested scope (screen-level vs app-level).
- Template section order is preserved.
- Actions, states, API, and data model are consistent.
- Assumptions are clearly labeled when context is missing.
- Global shell rules are not duplicated in per-view specs unless explicitly exceptional.

# Output Format

Return one of:

1. Full `*.view.md` spec (single-screen mode).
2. Section design list (sections mode).
3. Revised `*.view.md` content (refinement mode).
4. Full `docs/app-shell.md` (app-level mode).
5. Audit summary + concrete fix list (audit mode).

Keep output concise and implementation-ready.

# Rules

- Keep per-screen specs focused on that screen only.
- Move shared app-shell concerns to `docs/app-shell.md`.
- Prefer best-effort inference over blocking questions.
- If one screen is requested, output exactly one screen spec.
- Preserve stable section naming and ordering.
- Do not invent unrelated features.

# Examples

- Rough screen idea -> produce one complete `.view.md` spec using repository template.
- Mixed global + screen requirements -> keep screen spec focused and recommend extracting shared rules to `docs/app-shell.md`.

# References

- [references/view-template.view.md](references/view-template.view.md)
- [references/app-level-template.md](references/app-level-template.md)
