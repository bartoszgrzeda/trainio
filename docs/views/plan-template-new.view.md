---
id: plan-template-new
name: PlanTemplateNewView
route: /settings/plan-templates/new
auth: true
layout: mobile
title: New Plan Template
description: Create a reusable plan template with nested days, exercises, and sets.
---

# New Plan Template

## Purpose

Allow trainers to create a reusable plan template that can later be assigned to trainings.

## User

Authenticated trainer managing reusable plan templates.

## Main Goals

- Enter a valid template name.
- Build at least one day with at least one exercise and one set.
- Save the new plan template.

## Sections

### 1. Header

- Purpose: Provide context and return path to plan templates list.
- Fields/Data Shown: none.
- Components:
  - Header title `New Plan Template`.
  - Left back button.
- Behavior:
  - On tap back button, navigate to `/settings/plan-templates`.
  - If form is dirty, show discard confirmation before leaving.
- Rules:
  - Header is visible in all states.
  - Back button is disabled only during hard submit loading.
- Empty State: n/a.

### 2. Template Name

- Purpose: Capture plan template `name`.
- Fields/Data Shown: `name`.
- Components:
  - Single-line text input labeled `Name`.
- Behavior:
  - Input updates local draft on every change.
  - Validate on blur and before submit.
- Rules:
  - Required.
  - Trim leading and trailing whitespace on submit.
  - Length after trim: `1-200` characters.
- Empty State:
  - Placeholder `Enter plan template name`.

### 3. Days Tabs and Active Day Editor

- Purpose: Build days and edit one selected day at a time.
- Fields/Data Shown: `days[]`, `activeDayIndex`.
- Components:
  - Horizontal day tabs (`Day 1`, `Day 2`, ... or day name).
  - Compact add-day button `+` in tabs row.
  - Embedded `plan-day` editor rendered below tabs for active day only.
- Behavior:
  - On screen open, initialize one day.
  - On tap tab, update `activeDayIndex`.
  - On tap `+`, append day and switch to it.
- Rules:
  - Tapping a day tab must not navigate to another route.
  - Tapping a day tab only switches local tab state and displays selected day below.
  - At least one day must exist at all times.
- Empty State: n/a.

### 4. Save Action

- Purpose: Persist the new template.
- Fields/Data Shown: `isSaving`, `errors`.
- Components:
  - Primary `Save` button in persistent bottom action section above bottom menu.
- Behavior:
  - On tap `Save`, validate nested payload and call create API.
  - On success, navigate to created plan template details.
- Rules:
  - Keep button visible in all states.
  - Disable while request is in progress or form is invalid.
- Empty State: n/a.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadPlanTemplateNewForm | n/a | Screen opens | Initialize draft with one day/exercise/set |
| changePlanTemplateName | n/a | User types in name input | Update `name` and clear field error |
| selectDayTab | Day tab | Tap tab | Update `activeDayIndex` and render selected day below tabs (no navigation) |
| addPlanDay | + | Tap add-day button | Append a day and set it active |
| editActiveDay | n/a | User edits embedded `plan-day` section | Update nested `days[activeDayIndex]` draft |
| submitCreatePlanTemplate | Save | Tap Save | Validate and call create API |
| cancelCreatePlanTemplate | Back | Tap back button | Navigate back or confirm discard if dirty |

## Data Model

```json
{
  "name": "Push Pull Legs",
  "activeDayIndex": 0,
  "days": [
    {
      "name": "Day 1",
      "exercises": [
        {
          "exerciseId": "de8d2b94-6f9f-4f7f-8f5c-8601b6f3e928",
          "series": [
            { "repeatsCount": 10 },
            { "repeatsCount": 8 }
          ]
        }
      ]
    }
  ],
  "isDirty": true,
  "isSaving": false,
  "errors": {}
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/exercises/list?query={query}&includeSeeded=true | Search exercises used by day exercise picker | n/a | `{ exercises: [{ id, name, source }] }` |
| POST | /api/plan-templates/create | Create plan template | `{ name, days: [{ name, exercises: [{ exerciseId, series: [{ repeatsCount }] }] }] }` | `{ id, name, days: [{ name, exercises: [{ exerciseId, series: [{ repeatsCount }] }] }] }` |

## States

### default

Name input, day tabs, active day editor, and `Save` are visible. Controls are enabled when draft is valid.

### loading

During submit, disable editable controls and show loading indicator on `Save`.

### empty

Not used. Initial state always contains one day with one exercise and one set row.

### error

Show inline field errors and top-level banner for API/domain errors (for example `Plan name is invalid.`).

### success (optional)

Show toast `Plan template created` and navigate to `/settings/plan-templates/{planTemplateId}`.

### disabled (optional)

Disable `Save` when any validation rule fails or submit is in progress.

### offline (optional)

Show header warning indicator `!`; on tap show `No internet connection`. Keep local draft editable and disable `Save`.

## Validation

- Field: `name`
- Rule: required, trim before submit, max length `200`.
- Error message: `Plan name is invalid.`

- Field: `days`
- Rule: must contain at least one item.
- Error message: `At least one day is required.`

- Field: `days[].name`
- Rule: required, trim before submit, max length `128`.
- Error message: `Plan day name is invalid.`

- Field: `days[].exercises`
- Rule: must contain at least one item.
- Error message: `At least one exercise is required in each day.`

- Field: `days[].exercises[].exerciseId`
- Rule: required valid non-empty GUID.
- Error message: `Exercise selection is invalid.`

- Field: `days[].exercises[].series`
- Rule: must contain at least one item.
- Error message: `At least one set is required for each exercise.`

- Field: `days[].exercises[].series[].repeatsCount`
- Rule: integer `1-1000`.
- Error message: `Repeats count must be between 1 and 1000.`

## Edge Cases

- Duplicate day names are allowed (backend does not enforce uniqueness).
- The same exercise can appear multiple times in one day; preserve order.
- Removing the active day should move focus to the nearest remaining day.
- If create succeeds but route transition fails, keep created payload and allow retry navigation.

## Navigation

- Entry: `/settings/plan-templates/new` from `plan-template-list` add action.
- Back: `/settings/plan-templates` (with discard confirmation when draft is dirty).
- Success: `/settings/plan-templates/{planTemplateId}`.
- Day tabs are in-place only and never navigate.

## Notes

### Reusable Component Opportunities

- Reuse `GlobalHeader`, `StatusBanner`, and persistent bottom `Save` layout from existing form screens.
- Reuse `plan-day` as embedded child block.

### Assumptions (if any)

- Day initialization defaults to one day with one exercise and one set to satisfy minimum-count constraints.
