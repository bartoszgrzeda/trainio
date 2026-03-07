---
id: exercise-new
name: ExerciseNewView
route: /settings/exercises/new
auth: true
layout: mobile
title: New Exercise
description: Form screen for creating a custom exercise with a required name.
---

# New Exercise

## Purpose

Allow the trainer to create a new custom exercise by entering a name and saving it.

## User

Authenticated trainer managing the exercise library.

## Main Goals

- Enter exercise name.
- Validate name before submit.
- Save exercise and return to exercises list.

## Sections

### 1. Name

- Purpose: Capture the custom exercise name.
- Fields/Data Shown: `name`.
- Components: Single-line text input labeled `Name`.
- Behavior:
  - Autofocus input on screen open.
  - Update local draft on each change.
  - Validate on blur and on submit.
- Rules:
  - Required.
  - Trim leading and trailing whitespace on submit.
  - Length after trim: `2-80` characters.
- Empty State: Placeholder `Enter exercise name`.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadExerciseNewForm | n/a | Screen opens | Initialize empty form state |
| changeName | n/a | User types in name input | Update `name` and clear field error |
| submitExercise | Save | Tap primary button | Validate and create custom exercise via API |
| cancelCreateExercise | Back | Tap back with unsaved changes | Show discard confirmation and navigate back if confirmed |

## Data Model

```json
{
  "name": "Incline Dumbbell Press",
  "isDirty": true,
  "isSaving": false,
  "errors": {}
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| POST | /exercises/create | Create custom exercise | `{ name }` | `{ id, name, source }` |

## States

### default

Name input is editable. `Save` is visible and enabled only when form is valid and not saving.

### loading

Show active loading indicator on `Save` while request is in progress and disable all inputs.

### empty

Initial state with blank name input and placeholder visible. `Save` is disabled.

### error

Show inline validation error for name and show top-level banner for API errors.

### success (optional)

Show toast `Exercise created` and navigate back to `/settings/exercises`.

### disabled (optional)

Disable `Save` when name is empty, invalid, unchanged, or request is in progress.

### offline (optional)

Show header warning indicator `!`; on tap show `No internet connection`. Keep typed name in local state and disable `Save` until connection is restored.

## Validation

- Field: `name`
- Rule: required, length `2-80` after trim.
- Error message: `Exercise name is required.`

- Field: `name`
- Rule: must be unique among existing custom exercises (case-insensitive).
- Error message: `Exercise with this name already exists.`

## Edge Cases

- User enters only spaces; trimmed value is empty and validation error is shown.
- API returns duplicate-name conflict; keep input value and show conflict message.
- User leaves screen with unsaved value; show discard confirmation.
- Name longer than `80` characters is rejected and input remains editable for correction.

## Navigation

- Entry: from `/settings/exercises` via `+` add action.
- Back: return to `/settings/exercises` (with discard confirmation when form is dirty).
- On successful save: return to `/settings/exercises` and refresh exercises list.

## Notes

### Assumptions (if any)

- This screen creates only custom exercises; seeded exercises are read-only.
- Backend enforces final uniqueness validation for `name`.
