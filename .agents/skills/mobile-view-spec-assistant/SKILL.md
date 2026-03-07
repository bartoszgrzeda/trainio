---
name: mobile-view-spec-assistant
description: Create mobile app view specifications in Markdown (`.view.md`) from rough product ideas and generate app-level shared-spec files when requirements are global. Use for screen design docs, developer handoff specs, state/action/API/data modeling, and separating per-screen content from app-shell/navigation/layout rules.
---

# Mobile View Spec Assistant

## Workflow

1. Determine the operating mode from the request.
   - Infer the mode from user intent and expected output using `## Modes`.
   - If intent is unclear:
     - Use `single-view spec mode` for one screen.
     - Use `app-level spec mode` for shared/global patterns.
2. Ask for screen purpose when ambiguity is high; otherwise infer it and keep assumptions explicit.
3. Keep scope strict.
   - Include only screen-specific UI and behavior in `.view.md`.
   - Exclude app-level shell concerns unless the screen has exceptional behavior tied to them.
   - If requirements span multiple screens in one feature, recommend a separate feature-level spec (`<feature>.md`) that links to each `.view.md`.
4. Produce concise, implementation-ready Markdown in English unless the user asks for another language.

## Modes

### View Spec Mode

Purpose:
Generate a complete `.view.md` mobile screen specification.

Behavior:
- Use a rough description of a screen as input.
- Produce a structured Markdown spec using this template:

```md
---
id: <screen-id>
name: <ScreenName>
route: </route>
auth: true
layout: mobile
title: <Title>
description: <Short description>
---

# <Screen Title>

## Purpose

## User

## Main Goals

## Sections

## Actions

## Data Model

## API

## States

## Validation

## Edge Cases

## Navigation

## Notes
```

- Keep output mobile-first.
- Keep output concise but implementation-ready.
- Do not include global UI elements like bottom navigation unless unique to that screen.
- If a requirement belongs to global layout, suggest placing it in `docs/app-shell.md`.

### Sections Design Mode

Purpose:
Design UI sections before generating the full screen spec.

Behavior:
- Use a rough description of a screen as input.
- Return a list of recommended sections.
- For each section include:
  - Section name
  - Purpose
  - Suggested components
  - Suggested data fields

### Spec Refinement Mode

Purpose:
Improve an existing `.view.md` specification.

Behavior:
- Preserve structure.
- Improve clarity.
- Add missing states.
- Add missing edge cases.
- Improve actions or navigation.

### App Architecture Mode

Purpose:
Generate an application-level architecture spec.

Behavior:
- Output file: `docs/app-shell.md`.
- Use this structure:
  - `# App Shell`
  - `## App Purpose`
  - `## Global Navigation`
  - `## Shared Layout Rules`
  - `## Shared Components`
  - `## Global UI States`
  - `## Permissions / Roles`
  - `## Naming Conventions`
- Screen specs must not duplicate these global rules.

### Spec Audit Mode

Purpose:
Review a `.view.md` file and evaluate completeness.

Behavior:
- Check for:
  - `Purpose`
  - `Sections`
  - `Actions`
  - `Data Model`
  - `API`
  - `States`
  - `Edge Cases`
  - `Navigation`
- Use this output format:

```md
View Spec Audit

✔ sections present
✔ states defined
⚠ missing edge cases
⚠ navigation unclear
```

- Then provide concrete improvement suggestions.

## Single-View Spec Mode

Generate exactly one `.view.md` spec for one described screen.
Use the structure from [references/view-template.view.md](references/view-template.view.md).

### Content Requirements

- Frontmatter must include: `id`, `name`, `route`, `auth`, `layout`, `title`, `description`.
- Keep app shell and global navigation out of per-view specs unless directly exceptional for that screen.
- Include `Validation` only when the screen has forms or editable inputs.
- Include per-section empty states only when needed.
- Include `States` with at least `default`, `loading`, `empty`, `error`.
- Add optional `success`, `disabled`, `offline` states when relevant.
- Keep `Navigation` section screen-specific only.
- Suggest moving reusable patterns to `docs/app-shell.md` or `app.md`.

### Quality Targets

- Clarity: describe intent, fields, and behavior concretely.
- Consistency: keep section order and naming stable.
- Developer handoff: include actionable data models, actions, APIs, rules, and states.
- Mobile-first: favor touch-first interaction and compact-screen considerations.

## App-Level Spec Mode

Use [references/app-level-template.md](references/app-level-template.md) when the request is about shared architecture or reusable UI behavior.
Include these sections:
- `App Purpose`
- `App Shell`
- `Global Navigation`
- `Shared Layout Rules`
- `Shared Components`
- `Global UI States`
- `Permissions / Roles`
- `Naming Conventions`

Use this mode for bottom navigation rules, shared header behavior, spacing systems, tab bars, permission matrices, and global mobile shell logic.

## Collaboration Behavior

- Refine rough input into polished spec output.
- Propose missing actions, states, edge cases, validation rules, and APIs.
- Label assumptions clearly when details are missing.
- If the request mixes local and global details, keep the view file focused and recommend extracting shared concerns into an app-level spec.
- Keep a three-level separation:
  - app-level spec (`docs/app-shell.md` or `app.md`) for global rules
  - feature-level spec (`<feature>.md`) for multi-screen feature flows
  - single-view spec (`*.view.md`) for one screen
- If one screen is described, return one screen spec.

## Output Checklist

- Match the requested mode (`View Spec Mode`, `Sections Design Mode`, `Spec Refinement Mode`, `App Architecture Mode`, `Spec Audit Mode`, `single-view`, or `app-level`).
- Preserve template section order.
- Keep wording concise and implementation-ready.
- Do not duplicate global shell rules inside each screen.
- Keep screen actions, states, APIs, and data model consistent with stated goals.

## Typical Workflow

```text
create home screen spec for trainer mobile app
design sections for training details screen
refine docs/views/home.view.md
audit docs/views/home.view.md
generate app-shell spec for trainer mobile app
```
