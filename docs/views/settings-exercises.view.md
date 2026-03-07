---
id: settings-exercises
name: SettingsExercisesView
route: /settings/exercises
auth: true
layout: mobile
title: Exercises
description: Searchable exercises list with seeded and custom entries, quick add action, and back navigation to settings.
---

# Exercises

## Purpose

Allow trainers to quickly find exercises (seeded and custom), open exercise details, and add a new custom exercise.

## User

Authenticated trainer managing the exercise library used in training plans.

## Main Goals

- Go back to settings.
- Add a new custom exercise.
- Search exercises by name.
- Open a selected exercise in `settings-exercise-details` view.

## Sections

### 1. Header

- Purpose: Provide clear context and fast return to settings.
- Fields/Data Shown: none.
- Components:
  - Header title `Exercises`.
  - Left back button.
- Behavior:
  - On tap back button, navigate to `/settings`.
- Rules:
  - Back button is always visible and enabled.
  - Header stays visible in all states.
- Empty State: n/a.

### 2. Add Exercise

- Purpose: Provide immediate action to create a new custom exercise.
- Fields/Data Shown: none.
- Components: Compact add action button `+` (small button, `15%` width in the search/add row).
- Behavior:
  - On tap, navigate to new exercise creation flow.
- Rules:
  - Button is always visible at the top of the screen in the same row as search input.
  - Row width split: search input `85%`, add button `15%`.
  - Button remains enabled in all non-loading states.
- Empty State: n/a.

### 3. Exercises List and Search

- Purpose: Let trainer find and open an exercise quickly.
- Fields/Data Shown: `searchQuery`, `exercises[].id`, `exercises[].name`, `exercises[].source`.
- Components:
  - Search input with placeholder `Search exercises`.
  - Vertical list of tappable rows.
  - Each row shows only `name`.
- Behavior:
  - On screen open, fetch exercise list (seeded and custom).
  - Typing in search filters list by `name` (case-insensitive, partial match).
  - Tapping a row navigates to `settings-exercise-details` for selected `exerciseId`.
  - Pull-to-refresh reloads exercise list.
- Rules:
  - Include seeded and custom entries in one merged list.
  - Do not display extra row metadata (muscle group, equipment, tags).
  - Sort visible rows by `name` ascending.
  - Preserve current `searchQuery` when returning from `settings-exercise-details` in the same session.
- Empty State:
  - No exercises in system: `No exercises yet. Add your first exercise.`
  - No search matches: `No exercises found.`

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadExercises | n/a | Screen opens or pull-to-refresh | Fetch exercises list |
| goBackToSettings | Back | Tap header back button | Navigate to `/settings` |
| openAddExercise | + | Tap add button | Navigate to `/settings/exercises/new` |
| updateExerciseSearch | n/a | User types in search input | Filter visible exercises list |
| openExerciseDetails | Exercise row | Tap row | Navigate to `settings-exercise-details` with selected `exerciseId` |

## Data Model

```json
{
  "searchQuery": "press",
  "exercises": [
    { "id": "ex_seed_001", "name": "Bench Press", "source": "seeded" },
    { "id": "ex_seed_002", "name": "Overhead Press", "source": "seeded" },
    { "id": "ex_usr_021", "name": "Cable Chest Fly", "source": "custom" }
  ]
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/exercises?query={query}&includeSeeded=true | Load or search seeded + custom exercises list | n/a | `{ exercises: [{ id, name, source }] }` |

## States

### default

Back button and `+` add button are visible. Search input and non-empty exercises list are interactive.

### loading

Show header with back button, search input, `+` add button, and loading skeleton rows for list content.

### empty

No exercises available. Show empty-state message and keep back and `+` buttons visible and enabled.

### error

Show inline error banner: `Could not load exercises. Try again.` Keep search visible and allow pull-to-refresh retry.

### offline (optional)

Show header warning indicator `!`; on tap show `No internet connection`. If cached exercises exist, render cached list; otherwise show empty-state fallback. Disable pull-to-refresh until connectivity returns.

## Validation

- Field: `searchQuery`
- Rule: Trim leading/trailing spaces before filtering.
- Error message: n/a (sanitized automatically, no blocking validation).

- Field: `searchQuery`
- Rule: Max length `80` characters.
- Error message: `Search can contain up to 80 characters.`

## Edge Cases

- Two exercises can have the same `name`; rows remain distinct by `id`.
- Same `name` can exist in seeded and custom sources; both rows must be shown.
- Very long names should truncate visually but remain fully readable in accessibility label.
- Exercise is deleted on another device; refresh removes stale row and keeps user on current screen.
- Search query with diacritics should still match normalized names when supported by backend/API.

## Navigation

- Entry point: `/settings/exercises` from settings view.
- Header back button -> `/settings`.
- `+` add button -> `/settings/exercises/new`.
- Exercise row tap -> `settings-exercise-details` view (for example `/settings/exercises/{exerciseId}`).

## Notes

### Assumptions (if any)

- API returns seeded and custom exercises in one list when `includeSeeded=true`.
- `settings-exercise-details` and exercise creation views are defined in separate specs.
