---
id: training-new
name: TrainingNewView
route: /trainings/new
auth: true
layout: mobile
title: New Training
description: Form screen for creating a planned training with client selection, start/end date-time, optional notes, and pre-save scheduling warning confirmation.
---

# New Training

## Purpose

Allow the trainer to schedule a new training by selecting a client, defining start/end date-time, and saving optional notes.

## User

Authenticated trainer adding a training from the home schedule flow.

## Main Goals

- Select one client for the training.
- Set `startAt` and `endAt` with date and time (for example `2025-01-01 11:00`).
- Add optional notes.
- Run warning check on `Save`, then confirm and save when warnings are detected.

## Sections

### 1. Client

- Purpose: Pick who the planned training is for.
- Fields/Data Shown: `clientId`, `clientDisplayName`, `clientSearchQuery`, `clients[]`.
- Components:
  - Searchable client select field labeled `Client`.
  - Picker/list modal with client rows (`fullName`).
- Behavior:
  - On open, load initial client list.
  - Typing in search filters/fetches matching clients.
  - Selecting a client updates local form draft.
- Rules:
  - Exactly one client must be selected before save.
  - Selected client label remains visible after picker closes.
- Empty State:
  - Client picker list empty: `No clients found`.

### 2. Schedule

- Purpose: Define training time window.
- Fields/Data Shown: `startAt`, `endAt`.
- Components:
  - Date-time picker input labeled `Start date`.
  - Date-time picker input labeled `End date`.
- Behavior:
  - Both fields open native date-time picker (date + hour + minute).
  - Values are stored and displayed in local timezone using `yyyy-MM-dd HH:mm`.
  - On `Save`, app runs warning check for overlaps and same-client same-day.
- Rules:
  - `startAt` is required.
  - `endAt` is required.
  - `endAt` must be later than `startAt`.
  - Warning check result must be shown before create call when warnings exist.
- Empty State:
  - `startAt`: `Select start date and time`.
  - `endAt`: `Select end date and time`.

### 3. Notes

- Purpose: Capture optional context for the planned training.
- Fields/Data Shown: `notes`.
- Components: Multiline text input labeled `Notes`.
- Behavior:
  - Updates local draft on change.
  - Keeps line breaks.
- Rules:
  - Optional.
  - Maximum length `500`.
- Empty State:
  - Placeholder `Add notes (optional)`.

### 4. Save Action

- Purpose: Persist a new training through two steps: warning check, then user-confirmed save if warnings are found.
- Fields/Data Shown: `isCheckingWarnings`, `isSaving`, `pendingWarnings[]`, `isDirty`.
- Components:
  - Primary button `Save`.
  - Warning confirmation modal shown after warning check when warnings exist.
- Behavior:
  - Tap `Save` validates required fields and calls warning-check API.
  - If warning-check returns no warnings, app calls create API immediately.
  - If warning-check returns warnings, app shows warning confirmation modal.
  - On modal confirm, app calls create API.
  - On modal cancel, no create call is made and user stays on the form.
- Rules:
  - `Save` is the only in-screen action button.
  - Warning-check request must run before every create attempt.
  - `POST /api/trainings/create` response does not include warnings.
  - `Save` is disabled only when form is invalid, warning check is in progress, or save request is in progress.
- Empty State:
  - n/a.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadTrainingNewForm | n/a | Screen opens | Initialize empty draft and load initial clients list |
| searchClients | n/a | User types in client search | Refresh client options |
| selectClient | Client row | Tap client item | Set `clientId` and close picker |
| pickStartDateTime | Start date | Tap start field | Open date-time picker and set `startAt` |
| pickEndDateTime | End date | Tap end field | Open date-time picker and set `endAt` |
| updateNotes | n/a | User edits notes | Update `notes` draft |
| checkTrainingWarnings | Save | Tap button | Validate form and check overlap/same-day warnings |
| confirmSaveWithWarnings | Confirm save | Tap modal confirm action | Create training and navigate to home |
| submitTrainingWithoutWarnings | n/a | Warning check returns no warnings | Create training and navigate to home |

## Data Model

```json
{
  "clientId": "cl_001",
  "clientDisplayName": "Jan Kowalski",
  "startAt": "2025-01-01T11:00:00+01:00",
  "endAt": "2025-01-01T12:00:00+01:00",
  "notes": "Focus on technique.",
  "isDirty": true,
  "isCheckingWarnings": false,
  "isSaving": false,
  "pendingWarnings": [
    {
      "code": "time_overlap",
      "message": "This training overlaps with existing training 10:30-11:30."
    },
    {
      "code": "same_client_same_day",
      "message": "Client already has a training on 2025-01-01."
    }
  ],
  "errors": {}
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/clients/list?query={query} | Load/search clients for selector | n/a | `{ clients: [{ id, fullName }] }` |
| POST | /api/trainings/check-warnings | Check overlap and same-day warnings before save | `{ clientId, startAt, endAt }` | `{ warnings: [{ code, message }] }` |
| POST | /api/trainings/create | Create training after optional warning confirmation | `{ clientId, startAt, endAt, notes }` | `{ id, clientId, startAt, endAt, notes }` |

## States

### default

All fields are visible and editable. `Save` is enabled when form is valid.

### loading

Disable `Save` while warning-check or create request is in progress and show loading indicator on button.

### empty

Initial state with no selected client, empty schedule fields, and empty notes.

### error

Show field-level validation errors and top banner for API failure (`Could not save training. Try again.`). Keep draft values.

### success (optional)

Training is created. Show success toast and navigate to home.

### warning-confirmation (optional)

After warning-check call returns warnings, show modal with warning list and `Confirm save` action.

### disabled (optional)

Disable `Save` when required fields are missing/invalid or request is in flight.

### offline (optional)

Show header warning indicator `!`; on tap show `No internet connection`. Keep local draft and disable `Save` until online.

## Validation

- Field: `clientId`
- Rule: required, must reference existing client.
- Error message: `Select client.`

- Field: `startAt`
- Rule: required valid local date-time.
- Error message: `Select start date and time.`

- Field: `endAt`
- Rule: required valid local date-time later than `startAt`.
- Error message: `End date and time must be later than start date and time.`

- Field: `notes`
- Rule: optional, max length `500`.
- Error message: `Notes can contain up to 500 characters.`

- Field: `overlapWarning`
- Rule: detected by warning-check API before create; if present, show warning and require explicit user confirmation to proceed.
- Error message: n/a (warning text example: `Training time overlaps with an existing training.`)

- Field: `sameClientSameDayWarning`
- Rule: detected by warning-check API before create; if present, show warning and require explicit user confirmation to proceed.
- Error message: n/a (warning text example: `Client already has a training on this day.`)

## Edge Cases

- New training can trigger both warnings at once; show both messages.
- Overlap warning applies to any existing training, not only the same client.
- Same-client same-day warning compares day only (for example both on `2025-01-01`) regardless of hour/minute.
- User can cancel from warning confirmation modal; form stays unchanged and no create request is sent.
- Training spanning midnight uses local date boundaries for warning calculations.
- If warning-check passes but create fails, keep form data and allow retry from `Save`.

## Navigation

- Entry: from `/home` via `Today Training` header `+`.
- Save success: navigate to `/home` and refresh today trainings list.
- This screen provides only one in-screen action button: `Save`.

## Notes

### Assumptions (if any)

- Warning detection is provided by dedicated pre-save API (`/api/trainings/check-warnings`).
- Create API does not return warning payload.
