---
id: plan-template-list
name: PlanTemplateListView
route: /settings/plan-templates
auth: true
layout: mobile
title: Plans Templates
description: Searchable plan templates list with quick add action and back navigation to settings.
---

# Plans Templates

## Purpose

Allow trainers to quickly find plan templates, open template details, and start creating a new template.

## User

Authenticated trainer managing reusable training plan templates.

## Main Goals

- Go back to settings.
- Add a new plan template.
- Search plan templates by name.
- Open a selected template in `plan-template` view.

## Sections

### 1. Header

- Purpose: Provide context and fast return to settings.
- Fields/Data Shown: none.
- Components:
  - Header title `Plans Templates`.
  - Left back button.
- Behavior:
  - On tap back button, navigate to `/settings`.
- Rules:
  - Back button is always visible and enabled.
  - Header stays visible in all states.
- Empty State: n/a.

### 2. Add Plan Template

- Purpose: Provide immediate action to create a new template.
- Fields/Data Shown: none.
- Components: Compact add action button `+` (small button, `15%` width in the search/add row).
- Behavior:
  - On tap, navigate to new plan template creation flow.
- Rules:
  - Button is always visible at the top of the screen in the same row as search input.
  - Row width split: search input `85%`, add button `15%`.
  - Button remains enabled in all non-loading states.
- Empty State: n/a.

### 3. Plan Templates List and Search

- Purpose: Let trainer find and open a template quickly.
- Fields/Data Shown: `searchQuery`, `planTemplates[].id`, `planTemplates[].name`.
- Components:
  - Search input with placeholder `Search templates`.
  - Vertical list of tappable rows.
  - Each row shows only `name`.
- Behavior:
  - On screen open, fetch plan templates list.
  - Typing in search filters list by `name` (case-insensitive, partial match).
  - Tapping a row navigates to `plan-template` view for selected `planTemplateId`.
  - Pull-to-refresh reloads templates list.
- Rules:
  - Do not display extra row metadata (exercise count, tags, owner).
  - Sort visible rows by `name` ascending.
  - Preserve current `searchQuery` when returning from `plan-template` view in the same session.
- Empty State:
  - No plan templates in system: `No plan templates yet. Add your first template.`
  - No search matches: `No plan templates found.`

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadPlanTemplates | n/a | Screen opens or pull-to-refresh | Fetch templates list |
| goBackToSettings | Back | Tap header back button | Navigate to `/settings` |
| openAddPlanTemplate | + | Tap add button | Navigate to `/settings/plan-templates/new` |
| updatePlanTemplateSearch | n/a | User types in search input | Filter visible templates list |
| openPlanTemplateDetails | Template row | Tap row | Navigate to `plan-template` view with selected `planTemplateId` |

## Data Model

```json
{
  "searchQuery": "starter",
  "planTemplates": [
    { "id": "pt_001", "name": "Full Body Starter" },
    { "id": "pt_002", "name": "Push Pull Legs" },
    { "id": "pt_003", "name": "Strength Base" }
  ]
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/plan-templates/list?query={query} | Load or search plan templates list | n/a | `{ planTemplates: [{ id, name }] }` |

## States

### default

Back button and `+` add button are visible. Search input and non-empty templates list are interactive.

### loading

Show header with back button, search input, `+` add button, and loading skeleton rows for list content.

### empty

No templates available. Show empty-state message and keep back and `+` buttons visible and enabled.

### error

Show inline error banner: `Could not load plan templates. Try again.` Keep search visible and allow pull-to-refresh retry.

### offline (optional)

Show header warning indicator `!`; on tap show `No internet connection`. If cached templates exist, render cached list; otherwise show empty-state fallback. Disable pull-to-refresh until connectivity returns.

## Validation

- Field: `searchQuery`
- Rule: Trim leading/trailing spaces before filtering.
- Error message: n/a (sanitized automatically, no blocking validation).

- Field: `searchQuery`
- Rule: Max length `80` characters.
- Error message: `Search can contain up to 80 characters.`

## Edge Cases

- Two templates can have the same `name`; rows remain distinct by `id`.
- Very long names should truncate visually but remain fully readable in accessibility label.
- Template is removed on another device; refresh removes stale row and keeps user on current screen.
- Search query with diacritics should still match normalized names when supported by backend/API.

## Navigation

- Entry point: `/settings/plan-templates` from settings view.
- Header back button -> `/settings`.
- `+` add button -> `/settings/plan-templates/new`.
- Template row tap -> `plan-template` view (for example `/settings/plan-templates/{planTemplateId}`).

## Notes

### Assumptions (if any)

- `plan-template` and `plan-template-new` views are defined in separate specs.
