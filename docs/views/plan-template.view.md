---
id: plan-template
name: PlanTemplateView
route: /settings/plan-templates/{planTemplateId}
auth: true
layout: mobile
title: Plan Template
description: Edit or delete an existing plan template with inline day tabs.
---

# Plan Template

## Purpose

Allow trainers to update or delete an existing plan template.

## User

Authenticated trainer managing reusable plan templates.

## Main Goals

- Load template by `planTemplateId`.
- Edit template name and nested days/exercises/sets.
- Save updates or delete the template.

## Sections

### 1. Header

- Purpose: Provide context and return path to plan templates list.
- Fields/Data Shown: none.
- Components:
  - Header title `Plan Template`.
  - Left back button.
- Behavior:
  - On tap back button, navigate to `/settings/plan-templates`.
  - If draft is dirty, show discard confirmation before leaving.
- Rules:
  - Header stays visible in all states.
  - Back button disabled only during blocking load/delete/update.
- Empty State: n/a.

### 2. Template Name

- Purpose: Edit template `name`.
- Fields/Data Shown: `name`.
- Components:
  - Single-line text input labeled `Name`.
- Behavior:
  - On screen open, preload existing value from get API.
  - Validate on blur and before update submit.
- Rules:
  - Required.
  - Trim leading and trailing whitespace on submit.
  - Length after trim: `1-200` characters.
- Empty State:
  - Placeholder `Enter plan template name`.

### 3. Days Tabs and Active Day Editor

- Purpose: Switch between day editors without changing route.
- Fields/Data Shown: `days[]`, `activeDayIndex`.
- Components:
  - Horizontal day tabs.
  - Compact `+` add-day button.
  - Embedded `plan-day` editor rendered below tabs for active day only.
- Behavior:
  - On tap tab, update `activeDayIndex`.
  - On tap `+`, append day and switch to it.
- Rules:
  - Tapping a day tab must not navigate to any other view.
  - Tapping a day tab only updates local active tab state and displays selected day below.
  - At least one day must exist at all times.
- Empty State: n/a.

### 4. Delete Action

- Purpose: Remove the entire plan template.
- Fields/Data Shown: `isDeleting`.
- Components:
  - Destructive button `X`.
- Behavior:
  - On tap `X`, show confirmation modal.
  - On confirm, call delete API.
- Rules:
  - Disable while loading/updating/deleting.
  - Hide destructive action only when record is missing (`notFound` state).
- Empty State: n/a.

### 5. Save Action

- Purpose: Persist template updates.
- Fields/Data Shown: `isSaving`, `errors`.
- Components:
  - Primary `Save` button in persistent bottom action section above bottom menu.
- Behavior:
  - On tap `Save`, validate nested payload and call update API.
- Rules:
  - Keep button visible in all states except `notFound`.
  - Disable while request is in progress or draft is invalid.
- Empty State: n/a.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadPlanTemplate | n/a | Screen opens | Fetch template by `planTemplateId` |
| changePlanTemplateName | n/a | User types in name input | Update `name` and clear field error |
| selectDayTab | Day tab | Tap tab | Update `activeDayIndex` and render selected day below tabs (no navigation) |
| addPlanDay | + | Tap add-day button | Append day and set it active |
| editActiveDay | n/a | User edits embedded `plan-day` section | Update nested `days[activeDayIndex]` draft |
| submitPlanTemplateUpdate | Save | Tap Save | Validate and call update API |
| submitPlanTemplateDelete | X | Tap destructive button and confirm | Delete template and navigate to list |
| cancelPlanTemplateEdit | Back | Tap back button | Navigate back or confirm discard if dirty |

## Data Model

```json
{
  "id": "4e497fd2-b5ee-4c7a-b0f6-339ac126f2d2",
  "name": "Upper Lower",
  "activeDayIndex": 1,
  "days": [
    {
      "name": "Upper",
      "exercises": [
        {
          "exerciseId": "d6fcc05c-e95c-4f79-98ec-e586e63ea85f",
          "series": [
            { "repeatsCount": 10 },
            { "repeatsCount": 8 }
          ]
        }
      ]
    },
    {
      "name": "Lower",
      "exercises": [
        {
          "exerciseId": "d16ec98e-5307-48d1-8f81-032f9013c497",
          "series": [
            { "repeatsCount": 12 }
          ]
        }
      ]
    }
  ],
  "isDirty": false,
  "isSaving": false,
  "isDeleting": false,
  "errors": {}
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/plan-templates/get?id={planTemplateId} | Load selected template | n/a | `{ id, name, days: [{ name, exercises: [{ exerciseId, series: [{ repeatsCount }] }] }] }` |
| GET | /api/exercises/list?query={query}&includeSeeded=true | Resolve/search exercise options used by nested rows | n/a | `{ exercises: [{ id, name, source }] }` |
| POST | /api/plan-templates/update | Save template changes | `{ id, name, days: [{ name, exercises: [{ exerciseId, series: [{ repeatsCount }] }] }] }` | `{ id, name, days: [...] }` |
| POST | /api/plan-templates/delete | Delete template | `{ id }` | `{ success: true }` |

## States

### default

Loaded template data is editable. Day tabs and active day panel are interactive without route changes.

### loading

During initial load, show skeleton for name and day editor; disable actions.

### empty

Not expected because backend requires at least one day. If malformed payload with empty days is returned, show blocking error and disable save until corrected.

### error

Show inline field errors plus top-level banner for API/domain errors.

### success (optional)

After update, show toast `Plan template updated` and keep user on current screen.
After delete, show toast `Plan template deleted` and navigate to `/settings/plan-templates`.

### notFound (optional)

If get/update/delete returns not found, show `Plan template not found.` with single `Back to list` action.

### disabled (optional)

Disable `Save` when validation fails, data is unchanged, or request is in progress.

### offline (optional)

Show header warning indicator `!`; on tap show `No internet connection`. Keep local draft editable; disable `Save` and `X`.

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

- Template deleted on another device before save; update returns not found and screen switches to `notFound`.
- Duplicate day names are allowed and must be preserved as entered.
- Two exercises in one day can point to the same `exerciseId`; keep both rows.
- If a stored `exerciseId` is no longer listed by exercises API, show fallback label `Unknown exercise`.

## Navigation

- Entry: from `plan-template-list` row tap (`/settings/plan-templates/{planTemplateId}`).
- Back: `/settings/plan-templates` (with discard confirmation when draft is dirty).
- Delete success: `/settings/plan-templates`.
- Day tab taps stay on the same route and only swap content below tabs.

## Notes

### Reusable Component Opportunities

- Reuse `plan-day` child block for active day editor.
- Reuse shared confirmation modal for delete and discard-confirm patterns.

### Assumptions (if any)

- Save and delete permissions match current authenticated trainer role without additional per-template authorization UI.
