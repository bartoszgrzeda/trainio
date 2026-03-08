---
id: plan-day
name: PlanDayView
route: /settings/plan-templates/{planTemplateContextId}/days/{dayIndex}
auth: true
layout: mobile
title: Plan Day
description: Embedded day editor used by plan template create and edit flows.
---

# Plan Day

## Purpose

Allow trainers to edit one day inside a plan template, including day name and exercises.

## User

Authenticated trainer editing a day in a plan template draft.

## Main Goals

- Enter a valid day name.
- Manage day exercises list.
- Keep at least one exercise in the day.

## Sections

### 1. Day Name

- Purpose: Edit `days[dayIndex].name`.
- Fields/Data Shown: `name`.
- Components:
  - Single-line text input labeled `Day name`.
- Behavior:
  - Update local day draft on every change.
  - Validate on blur and before parent save.
- Rules:
  - Required.
  - Trim leading and trailing whitespace before parent submit.
  - Length after trim: `1-128`.
- Empty State:
  - Placeholder `Enter day name`.

### 2. Exercises List

- Purpose: Display and edit exercises for selected day.
- Fields/Data Shown: `exercises[]`.
- Components:
  - Vertical list of embedded `plan-day-exercise` rows.
  - Optional drag handle for reordering.
- Behavior:
  - Render all exercises in stored order.
  - Edits in a row update nested day draft immediately.
- Rules:
  - Must keep at least one exercise row.
  - Preserve order unless explicitly reordered.
- Empty State:
  - Not used in valid draft; show fallback `Add at least one exercise.` if row list becomes empty.

### 3. Add Exercise

- Purpose: Append another exercise row.
- Fields/Data Shown: none.
- Components:
  - Compact add button `+` in exercises section header.
- Behavior:
  - On tap `+`, append a new empty `plan-day-exercise` row with one default set row.
- Rules:
  - Button visible in all non-blocking states.
  - Disable only when parent is in hard loading state.
- Empty State: n/a.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| changePlanDayName | n/a | User types in day name input | Update `days[dayIndex].name` |
| addPlanDayExercise | + | Tap add exercise button | Append new exercise row |
| editPlanDayExercise | n/a | User edits embedded `plan-day-exercise` row | Update nested exercise draft |
| removePlanDayExercise | X | Tap remove exercise row | Remove exercise and reindex rows |

## Data Model

```json
{
  "dayIndex": 0,
  "name": "Day 1",
  "exercises": [
    {
      "exerciseId": "de8d2b94-6f9f-4f7f-8f5c-8601b6f3e928",
      "series": [
        { "repeatsCount": 10 },
        { "repeatsCount": 8 }
      ]
    }
  ],
  "errors": {}
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/exercises/list?query={query}&includeSeeded=true | Search/select exercises inside embedded exercise rows | n/a | `{ exercises: [{ id, name, source }] }` |

## States

### default

Day name and exercise rows are editable.

### loading

Parent-level save/load can temporarily disable all day controls.

### empty

If no exercises are present, show inline empty prompt and force add action.

### error

Show inline error under day name and row-level errors under invalid exercise/set fields.

### disabled (optional)

Disable all controls when parent screen is in hard loading state.

### offline (optional)

Show parent header warning indicator; keep local edits but block network-backed exercise search refresh.

## Validation

- Field: `name`
- Rule: required, trim before submit, max length `128`.
- Error message: `Plan day name is invalid.`

- Field: `exercises`
- Rule: must contain at least one item.
- Error message: `At least one exercise is required in each day.`

## Edge Cases

- Duplicate day names are valid and must not be auto-renamed.
- Removing an exercise should keep remaining rows in deterministic order.
- If exercise catalog cannot be loaded, preserve existing `exerciseId` values and allow manual retry.

## Navigation

- This view is rendered as an embedded block in `plan-template-new` and `plan-template`.
- Day tab taps in parent view only switch which `plan-day` block is visible below tabs.
- No route change is triggered by selecting a day tab.

## Notes

### Assumptions (if any)

- `planTemplateContextId` can be an existing template id or `new` during create flow.
