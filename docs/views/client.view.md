---
id: client
name: ClientView
route: /clients/{clientId}
auth: true
layout: mobile
title: Client
description: Form screen for updating or deleting an existing client profile.
---

# Client

## Purpose

Allow the trainer to edit an existing client profile or delete the client.

## User

Authenticated trainer managing client data.

## Main Goals

- Open selected client from clients list.
- Update personal and contact data with validation.
- Delete client with confirmation.

## Sections

### 1. Personal Data

- Purpose: Edit basic personal fields for selected client.
- Fields/Data Shown: `firstName`, `lastName`, `birthDate`, `gender`.
- Components:
  - Single-line text input labeled `First Name`.
  - Single-line text input labeled `Last Name`.
  - Read-only input/button field labeled `Birthdate` that opens native date picker calendar.
  - Segmented control or radio group with values `Male`, `Female`.
- Behavior:
  - On screen open, load selected client by `clientId`.
  - Text/date fields validate on blur and before update submit.
  - Birthdate picker sets `birthDate`; clear action removes selected date.
  - Gender allows single-select only.
- Rules:
  - `firstName`: required, trim on submit, max length `50`.
  - `lastName`: required, trim on submit, max length `50`.
  - `birthDate`: required, valid date, cannot be in the future.
  - `gender`: required, accepted values `male`, `female`.
- Empty State:
  - `firstName`: `Enter first name`.
  - `lastName`: `Enter last name`.
  - `birthDate`: `Select birthdate`.
  - `gender`: helper text `Select one option`.

### 2. Phone Number

- Purpose: Edit client primary phone contact.
- Fields/Data Shown: `phoneNumber`.
- Components: Phone keyboard text input labeled `Phone Number`.
- Behavior:
  - Input supports `+`, spaces, and separators.
  - Value is normalized before update submit.
- Rules:
  - Required.
  - Allowed characters: digits, spaces, `+`, `-`, `(`, `)`.
  - Length after trim: `7-20`.
- Empty State: Placeholder `Enter phone number`.

### 3. Notes

- Purpose: Edit optional client notes.
- Fields/Data Shown: `notes`.
- Components: Multiline text area labeled `Notes`.
- Behavior:
  - Autosizes vertically up to max height and scrolls internally.
  - Preserves line breaks during editing.
- Rules:
  - Optional.
  - Maximum length `500`.
- Empty State: Placeholder `Add notes (optional)`.

### 4. Training Plan

- Purpose: Open client-specific training plan editor.
- Fields/Data Shown: n/a.
- Components: Secondary action button labeled `Client training plan`.
- Behavior:
  - Action is presented in a dedicated section separated from `Notes`.
  - On tap, navigate to `client-training-plan` for selected `clientId`.
- Rules:
  - Disable action while save/delete requests are in progress.
- Empty State: n/a.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadClient | n/a | Screen opens | Load selected client draft by `clientId` |
| pickBirthdate | Birthdate field | Tap field | Open native date picker and set `birthDate` |
| clearBirthdate | X | Tap clear date action | Clear `birthDate` |
| changeField | n/a | User edits any input | Update form draft and clear field-level error |
| openClientTrainingPlan | Client training plan | Tap action in `Training Plan` section | Navigate to `/clients/{clientId}/training-plan` |
| submitClientUpdate | Save | Tap primary button | Validate and update client via API |
| submitClientDelete | X | Tap destructive button | Show confirmation and delete client via API |
| cancelEditClient | Back | Tap back with unsaved changes | Show discard confirmation and navigate back if confirmed |

## Data Model

```json
{
  "id": "cl_001",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "birthDate": "1992-04-16",
  "phoneNumber": "+48123123123",
  "gender": "male",
  "notes": "Prefers evening training sessions.",
  "isDirty": false,
  "isSaving": false,
  "isDeleting": false,
  "errors": {}
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /clients/get?id={clientId} | Load selected client details | n/a | `{ id, firstName, lastName, birthDate, phoneNumber, gender, notes, fullName }` |
| POST | /clients/update | Update client profile | `{ id, firstName, lastName, birthDate, phoneNumber, gender, notes }` | `{ id, firstName, lastName, birthDate, phoneNumber, gender, notes, fullName }` |
| POST | /clients/delete | Delete client | `{ id }` | `{ success: true }` |

## States

### default

All fields are visible and editable. `Save` and `X` buttons are visible in one row. `Save` is enabled only when required fields are valid and data changed.

### loading

Show loading skeleton during initial load and disable all inputs/actions during load/update/delete requests.

### empty

Not used in normal flow. If loaded data is missing required values after fetch, show editable empty fields with validation on save.

### error

Show inline validation errors for fields and top-level error banner for API failures.

### success (optional)

After update: show toast `Client updated` and return to `/clients`.
After delete: show toast `Client deleted` and return to `/clients`.

### disabled (optional)

Disable `Save` when form is invalid, unchanged, or request is in progress.

### offline (optional)

Show header warning indicator `!`; on tap show `No internet connection`. Disable update and delete actions until connectivity is restored.

## Validation

- Field: `firstName`
- Rule: required, length `1-50` after trim.
- Error message: `First name is required.`

- Field: `lastName`
- Rule: required, length `1-50` after trim.
- Error message: `Last name is required.`

- Field: `birthDate`
- Rule: required, valid date, must be today or earlier.
- Error message: `Select a valid birthdate.`

- Field: `phoneNumber`
- Rule: required, characters and length must match phone format rules.
- Error message: `Enter a valid phone number.`

- Field: `gender`
- Rule: required, must be `male` or `female`.
- Error message: `Select gender.`

- Field: `notes`
- Rule: optional, maximum `500` characters.
- Error message: `Notes can contain up to 500 characters.`

## Edge Cases

- Client was deleted on another device before opening details; show `Client not found.` and allow back navigation.
- User selects future birthdate; reject value and show field error.
- API returns duplicate client conflict on update; keep edited values and show conflict message.
- User tries to leave with unsaved changes; show discard confirmation.

## Navigation

- Entry: from `/clients` by tapping a client row.
- Back: return to `/clients` (with discard confirmation when form is dirty).
- On successful update/delete: return to `/clients` and refresh clients list.

## Notes

### Assumptions (if any)

- Existing client details are loaded by `GET /clients/get?id={clientId}`.
- Backend enforces final update/delete authorization and conflict rules.
