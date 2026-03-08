# Spec Quality Checks

Run these checks before returning output.

## Core Completeness

- Frontmatter is present and complete (`id`, `name`, `route`, `auth`, `layout`, `title`, `description`) for `*.view.md`.
- Required sections are present in template order.
- `Validation` section appears only when forms/editing exists.

## Consistency Checks

- Actions map to sections and expected user flows.
- Data model fields support the described UI behavior.
- API method/path pairs align with action outcomes.
- States include at least `default`, `loading`, `empty`, `error`.
- Navigation details are screen-scoped and do not duplicate app-shell behavior.

## Scope and Safety

- No unrelated features, entities, or endpoints were introduced.
- App-level rules are only in `docs/app-shell.md`.
- Assumptions are explicit when source requirements were incomplete.

## Audit Grading (Spec Audit Mode)

Use `pass`, `warn`, or `fail` for each area:

- Frontmatter and structure
- Goals and sections clarity
- Action/API/data alignment
- States and edge cases
- Navigation and boundary discipline

Prioritize fixes as:

- `P1`: Blocking implementation handoff.
- `P2`: Important clarity/consistency improvements.
