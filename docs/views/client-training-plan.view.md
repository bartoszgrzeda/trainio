---
id: client-training-plan
name: ClientTrainingPlanView
route: /clients/{clientId}/training-plan
auth: true
layout: mobile
title: Client Training Plan
description: Set and edit a client-specific training plan with optional copy from the default plan template configured in settings.
---

# Client Training Plan

## Purpose

Allow the trainer to set and maintain a client-specific training plan.

## User

Authenticated trainer managing one client from client details.

## Main Goals

- Open `client-training-plan` from the client details screen.
- Copy plan structure from the default plan template configured in settings into form draft only.
- Edit client plan name, days, exercises, and sets.
- Save the client plan using the standard save action.

## Sections

### 1. Header

- Purpose: Provide screen context and return path to client details.
- Fields/Data Shown: `clientName`.
- Components:
  - Header title `Client Training Plan`.
  - Subtitle with client full name.
  - Left back button.
- Behavior:
  - On tap back button, navigate to `/clients/{clientId}`.
  - If draft is dirty, show discard confirmation before leaving.
- Rules:
  - Header is visible in all states.
  - Back button is disabled only during blocking save operations.
- Empty State: n/a.

### 2. Copy From Settings Template

- Purpose: Quickly initialize or replace the client plan from the default template defined in settings.
- Fields/Data Shown: `defaultTemplate.id`, `defaultTemplate.name`, `isCopying`.
- Components:
  - Secondary button `Copy from template`.
  - Helper text with default template name when available.
- Behavior:
  - On tap `Copy from template`, show confirmation if current draft is non-empty.
  - On confirm, load template details and replace local draft form data (`name`, `days`) with copied values.
  - Set draft as dirty after copy so user must explicitly save.
- Rules:
  - Show helper `No default plan template configured in settings.` when template is not configured.
  - Disable `Copy from template` when template is unavailable or request is in progress.
  - Copy action updates only local client training plan form data; it must not persist any client plan changes.
  - Copy action must not call client training plan update/save API.
  - Source plan template is never modified by copy action.
- Empty State: n/a.

### 3. Plan Name

- Purpose: Define readable name for this client's plan.
- Fields/Data Shown: `name`.
- Components:
  - Single-line text input labeled `Plan Name`.
- Behavior:
  - Update local draft on every change.
  - Validate on blur and before save.
- Rules:
  - Required.
  - Trim leading/trailing whitespace on submit.
  - Length after trim: `1-200`.
- Empty State:
  - Placeholder `Enter client plan name`.

### 4. Days Tabs and Active Day Editor

- Purpose: Edit plan structure day by day.
- Fields/Data Shown: `days[]`, `activeDayIndex`.
- Components:
  - Horizontal day tabs.
  - Compact add-day button `+`.
  - Embedded `plan-day` editor rendered below tabs for active day only.
- Behavior:
  - On screen open, load existing client plan.
  - On tap tab, update `activeDayIndex`.
  - On tap `+`, append day and switch to it.
  - Edits in embedded `plan-day` update local client plan draft.
- Rules:
  - Tapping day tabs must not navigate away.
  - At least one day must exist before save.
  - Exercise search and row editing reuse `plan-day` and `plan-day-exercise` behavior.
- Empty State:
  - If plan has no days, show `Add your first day.` and focus add-day action.

### 5. Save Action

- Purpose: Persist client training plan.
- Fields/Data Shown: `isSaving`, `errors`.
- Components:
  - Primary button `Save` in persistent bottom action section above bottom menu.
- Behavior:
  - On tap `Save`, validate draft and call update API.
  - Save flow and payload are identical for manually edited and copied draft data.
  - On success, keep user on this view and show confirmation toast.
- Rules:
  - Keep button visible in all states except `notFound`.
  - Disable when request is in progress, draft is invalid, or unchanged.
- Empty State: n/a.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| openClientTrainingPlan | Client training plan | Tap button in `Training Plan` section on client view | Navigate to `/clients/{clientId}/training-plan` |
| loadClientTrainingPlan | n/a | Screen opens | Load client training plan and default template metadata |
| copyFromSettingsTemplate | Copy from template | Tap secondary copy button and confirm | Fill local draft form data from default template without saving |
| changeClientPlanName | n/a | User types in name input | Update `name` and clear field error |
| selectClientPlanDayTab | Day tab | Tap tab | Update `activeDayIndex` and render selected day below tabs (no navigation) |
| addClientPlanDay | + | Tap add-day button | Append day and set it active |
| editActiveClientPlanDay | n/a | User edits embedded `plan-day` section | Update nested `days[activeDayIndex]` draft |
| submitClientTrainingPlan | Save | Tap Save | Validate and persist client plan |
| cancelClientTrainingPlanEdit | Back | Tap back button | Navigate back or confirm discard if dirty |

## Data Model

```json
{
  "clientId": "cl_001",
  "clientName": "Jan Kowalski",
  "name": "Jan - Starter Plan",
  "defaultTemplate": {
    "id": "pt_001",
    "name": "Full Body Starter",
    "isConfigured": true
  },
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
  "isDirty": false,
  "isSaving": false,
  "isCopying": false,
  "errors": {}
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/clients/training-plan/get?clientId={clientId} | Load client plan and default-template metadata | n/a | `{ clientId, clientName, name, days, defaultTemplate: { id, name, isConfigured } }` |
| GET | /api/plan-templates/get?id={defaultTemplateId} | Load source template data used to fill form draft on copy action | n/a | `{ id, name, days: [{ name, exercises: [{ exerciseId, series: [{ repeatsCount }] }] }] }` |
| GET | /api/exercises/list?query={query}&includeSeeded=true | Resolve/search exercises used by nested rows | n/a | `{ exercises: [{ id, name, source }] }` |
| POST | /api/clients/training-plan/update | Persist client training plan | `{ clientId, name, days: [{ name, exercises: [{ exerciseId, series: [{ repeatsCount }] }] }] }` | `{ clientId, name, days, updatedAt }` |

## States

### default

Client plan is loaded and editable. `Copy from template` and `Save` are visible.

### loading

Show skeleton for header, name, tabs, and day editor; disable edit and action buttons.

### empty

Client has no stored plan yet. Show empty message with enabled `Copy from template` (if available) and manual add-day path.

### error

Show top-level banner for API failures and inline field errors for validation issues.

### success (optional)

After save, show toast `Client training plan saved`.
After copy, show toast `Plan copied to form` (no save performed).

### notFound (optional)

If client is not found, show `Client not found.` with one action `Back to client list`.

### disabled (optional)

Disable `Save` when draft is invalid, unchanged, or request is in progress.

### offline (optional)

Show header warning indicator `!`; on tap show `No internet connection`. Keep local edits, disable `Copy from template` and `Save`.

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

- Default template is not configured in settings; disable copy action and show helper message.
- Default template is removed after screen load; copy request fails and keeps existing draft unchanged.
- Copy action would overwrite unsaved draft; require explicit confirmation.
- Client gets deleted on another device; load/save returns not found and screen switches to `notFound`.
- Update conflict occurs; keep local draft and show retry banner.

## Navigation

- Entry: from `/clients/{clientId}` via button `Client training plan` placed in dedicated `Training Plan` section.
- Back: `/clients/{clientId}` (with discard confirmation when draft is dirty).
- Save success: stay on `/clients/{clientId}/training-plan`.
- Tabs are local-only UI state and never trigger route changes.

## Notes

### Reusable Component Opportunities

- Reuse `plan-day`, `plan-day-exercise`, and `exercise-set` embedded editors to keep plan structure behavior consistent.

### Assumptions (if any)

- Default template used by copy action is selected in settings and exposed through client training plan APIs.
- Client details view (`client`) adds a dedicated `Training Plan` section with button labeled `Client training plan`.
