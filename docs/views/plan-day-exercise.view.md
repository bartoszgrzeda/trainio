---
id: plan-day-exercise
name: PlanDayExerciseView
route: /settings/plan-templates/{planTemplateContextId}/days/{dayIndex}/exercises/{exerciseIndex}
auth: true
layout: mobile
title: Plan Day Exercise
description: Embedded exercise row editor for one day in a plan template.
---

# Plan Day Exercise

## Purpose

Allow trainers to select one exercise and manage its sets (series) inside a day.

## User

Authenticated trainer editing day exercise details in a plan template draft.

## Main Goals

- Select a valid exercise.
- Keep at least one set row.
- Edit set repeats counts.

## Sections

### 1. Exercise Selector

- Purpose: Set `exerciseId` for the row.
- Fields/Data Shown: `exerciseId`, `exerciseName`.
- Components:
  - Search input for exercise lookup.
  - Select list (inline or sheet) populated from exercises API.
- Behavior:
  - Typing updates search query and refreshes options.
  - Selecting option updates `exerciseId` and display name.
- Rules:
  - `exerciseId` is required for submit.
  - Selected value must be a non-empty GUID.
- Empty State:
  - `No exercises found.` when search has no matches.

### 2. Sets List

- Purpose: Display and edit `series[]`.
- Fields/Data Shown: `series[]`.
- Components:
  - Vertical list of embedded `exercise-set` rows.
- Behavior:
  - Render set rows in order.
  - Changes update local exercise draft immediately.
- Rules:
  - At least one set must exist.
  - Preserve set order unless explicitly reordered.
- Empty State:
  - Fallback message `Add at least one set.`

### 3. Add Set

- Purpose: Append set row.
- Fields/Data Shown: none.
- Components:
  - Compact add button `+` in sets section header.
- Behavior:
  - On tap, append set with default `repeatsCount` value (`1`).
- Rules:
  - Button visible in non-blocking states.
  - Disable when parent is in hard loading state.
- Empty State: n/a.

### 4. Remove Exercise

- Purpose: Remove entire exercise row from day.
- Fields/Data Shown: none.
- Components:
  - Destructive button `X` on row header.
- Behavior:
  - On tap, remove row after optional confirmation.
- Rules:
  - Removing last exercise in day is blocked by parent validation.
- Empty State: n/a.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| searchExerciseOptions | n/a | User types in exercise search | Fetch options from exercises API |
| selectExerciseOption | Exercise option | Tap option | Set `exerciseId` and clear selector error |
| addExerciseSet | + | Tap add set button | Append set row |
| editExerciseSet | n/a | User edits embedded `exercise-set` row | Update `series[setIndex]` |
| removeExerciseSet | X | Tap remove set row | Remove set and reindex rows |
| removePlanDayExerciseRow | X | Tap exercise remove button | Remove exercise row from day |

## Data Model

```json
{
  "exerciseIndex": 0,
  "exerciseId": "de8d2b94-6f9f-4f7f-8f5c-8601b6f3e928",
  "exerciseName": "Bench Press",
  "exerciseSearchQuery": "bench",
  "series": [
    { "repeatsCount": 10 },
    { "repeatsCount": 8 }
  ],
  "errors": {}
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/exercises/list?query={query}&includeSeeded=true | Search/select exercise for row | n/a | `{ exercises: [{ id, name, source }] }` |

## States

### default

Exercise selector and set rows are editable.

### loading

Show lightweight loader while fetching exercise options.

### empty

Show empty options message when search has no matching exercises.

### error

Show inline selector and set validation errors. Show row-level banner when options fetch fails.

### disabled (optional)

Disable controls when parent view is in blocking save/delete state.

### offline (optional)

Keep current selected exercise and set rows editable. Disable remote search refresh and show parent offline indicator.

## Validation

- Field: `exerciseId`
- Rule: required valid non-empty GUID.
- Error message: `Exercise selection is invalid.`

- Field: `series`
- Rule: must contain at least one item.
- Error message: `At least one set is required for each exercise.`

- Field: `series[].repeatsCount`
- Rule: integer `1-1000`.
- Error message: `Repeats count must be between 1 and 1000.`

## Edge Cases

- Selected exercise no longer returned by API; keep stored `exerciseId` and show `Unknown exercise`.
- Duplicate exercise rows are allowed and preserved.
- Deleting a middle set row should preserve order of remaining set rows.

## Navigation

- Rendered as an embedded row inside `plan-day`.
- No standalone navigation on selector or set edits.

## Notes

### Assumptions (if any)

- Exercise search uses existing exercises endpoint and includes seeded entries (`includeSeeded=true`).
