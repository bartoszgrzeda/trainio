---
id: exercise
name: ExerciseView
route: /settings/exercises/{exerciseId}
auth: true
layout: mobile
title: Exercise
description: Form screen for updating or deleting an existing exercise.
---

# Exercise

## Purpose

Allow the trainer to edit an existing exercise name or delete the exercise.

## User

Authenticated trainer managing the exercise library.

## Main Goals

- Open selected exercise from the exercises list.
- Update exercise name with validation.
- Delete the exercise with confirmation.

## Sections

### 1. Name

- Purpose: Edit selected exercise name.
- Fields/Data Shown: `name`.
- Components: Single-line text input labeled `Name`.
- Behavior:
  - On screen open, load selected exercise by `exerciseId`.
  - Input updates local draft on every change.
  - Validate on blur and before update submit.
- Rules:
  - Required.
  - Trim leading and trailing whitespace on submit.
  - Length after trim: `2-80` characters.
- Empty State: Placeholder `Enter exercise name`.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadExercise | n/a | Screen opens | Load selected exercise draft by `exerciseId` |
| changeName | n/a | User types in name input | Update `name` and clear field error |
| submitExerciseUpdate | Save | Tap primary button | Validate and update exercise via API |
| submitExerciseDelete | X | Tap destructive button | Show confirmation and delete exercise via API |
| cancelEditExercise | Back | Tap back with unsaved changes | Show discard confirmation and navigate back if confirmed |

## Data Model

```json
{
  "id": "ex_usr_021",
  "name": "Cable Chest Fly",
  "source": "custom",
  "isDirty": false,
  "isSaving": false,
  "isDeleting": false,
  "errors": {}
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /exercises/list?query={query}&includeSeeded=true | Load exercises list and resolve selected `exerciseId` | n/a | `{ exercises: [{ id, name, source }] }` |
| POST | /exercises/update | Update exercise name | `{ id, name }` | `{ id, name, source }` |
| POST | /exercises/delete | Delete exercise | `{ id }` | `{ success: true }` |

## States

### default

Name input is editable. `Save` and `X` buttons are visible in one row. `Save` is enabled only when form is valid and changed.

### loading

Show loading indicator during load/update/delete and disable all inputs/actions.

### empty

Not used in normal flow. If exercise is missing after load, show fallback error state.

### error

Show inline validation error for name and top-level error banner for API failures.

### success (optional)

After update: show toast `Exercise updated` and return to `/settings/exercises`.
After delete: show toast `Exercise deleted` and return to `/settings/exercises`.

### disabled (optional)

Disable `Save` when name is empty, invalid, unchanged, or request is in progress.

### offline (optional)

Show header warning indicator `!`; on tap show `No internet connection`. Disable update and delete actions until connection is restored.

## Validation

- Field: `name`
- Rule: required, length `2-80` after trim.
- Error message: `Exercise name is required.`

- Field: `name`
- Rule: must be unique among existing custom exercises (case-insensitive), excluding current exercise.
- Error message: `Exercise with this name already exists.`

## Edge Cases

- Exercise was deleted on another device before opening details; show `Exercise not found.` and allow back navigation.
- User enters only spaces; trimmed value is empty and validation error is shown.
- API returns duplicate-name conflict on update; keep input value and show conflict message.
- User attempts to leave with unsaved changes; show discard confirmation.

## Navigation

- Entry: from `/settings/exercises` by tapping an exercise row.
- Back: return to `/settings/exercises` (with discard confirmation when form is dirty).
- On successful update/delete: return to `/settings/exercises` and refresh exercises list.

## Notes

### Assumptions (if any)

- Update and delete operations are intended for custom exercises.
- Backend enforces final uniqueness and update/delete authorization rules.
