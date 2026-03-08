---
id: exercise-set
name: ExerciseSetView
route: /settings/plan-templates/{planTemplateContextId}/days/{dayIndex}/exercises/{exerciseIndex}/sets/{setIndex}
auth: true
layout: mobile
title: Exercise Set
description: Embedded set row editor for repeats count in plan template day exercises.
---

# Exercise Set

## Purpose

Allow trainers to edit a single set repeats count value.

## User

Authenticated trainer editing set values inside a plan template draft.

## Main Goals

- Enter a valid repeats count.
- Remove a set row when needed.

## Sections

### 1. Set Header

- Purpose: Show set index and destructive remove action.
- Fields/Data Shown: `setIndex`.
- Components:
  - Label `Set {setIndex + 1}`.
  - Compact destructive remove button `X`.
- Behavior:
  - On tap remove, delete current set row.
- Rules:
  - Parent row must enforce at least one set remains.
- Empty State: n/a.

### 2. Repeats Count

- Purpose: Edit `repeatsCount`.
- Fields/Data Shown: `repeatsCount`.
- Components:
  - Numeric input labeled `Repeats`.
- Behavior:
  - Update local value on change.
  - Validate on blur and before parent submit.
- Rules:
  - Required.
  - Integer only.
  - Value range: `1-1000`.
- Empty State:
  - Placeholder `Enter repeats`.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| changeRepeatsCount | n/a | User edits repeats input | Update `repeatsCount` and clear field error |
| removeExerciseSetRow | X | Tap remove set button | Remove set row from parent `series[]` |

## Data Model

```json
{
  "setIndex": 0,
  "repeatsCount": 10,
  "errors": {}
}
```

## API

No direct API call. Data is persisted through parent submit endpoints:
- `POST /api/plan-templates/create`
- `POST /api/plan-templates/update`

## States

### default

Repeats input and remove action are visible and editable.

### error

Show inline validation error under repeats input.

### disabled (optional)

Disable row controls when parent view is in hard loading state.

## Validation

- Field: `repeatsCount`
- Rule: required integer in range `1-1000`.
- Error message: `Repeats count must be between 1 and 1000.`

## Edge Cases

- Empty input on blur should show validation error and keep previous valid value until corrected.
- Pasted decimal or non-numeric input should be rejected and highlighted.
- Very large values (`>1000`) should not be submitted.

## Navigation

- Rendered as an embedded row inside `plan-day-exercise`.
- No standalone navigation.

## Notes

### Assumptions (if any)

- UI input layer can sanitize non-numeric characters before submit, but backend remains source of truth for final validation.
