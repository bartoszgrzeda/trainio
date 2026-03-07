---
id: client-new
name: ClientNewView
route: /clients/new
auth: true
layout: mobile
title: New Client
description: Form screen for creating a new client profile with personal and contact data.
---

# New Client

## Purpose

Allow the trainer to create a new client by entering required personal data and saving it in one flow.

## User

Authenticated trainer adding a client to their client base.

## Main Goals

- Enter first name, last name, birthdate, phone number, gender, and notes.
- Validate the form before submission.
- Save a new client and continue to client details (or return to the clients list).

## Sections

### 1. First Name

- Purpose: Capture client's first name.
- Fields/Data Shown: `firstName`.
- Components: Single-line text input labeled `First Name`.
- Behavior:
  - Updates local draft state on every change.
  - Validates on blur and on submit.
- Rules:
  - Required.
  - Trim leading/trailing whitespace on save.
  - Maximum length `50`.
- Empty State: Placeholder `Enter first name`.

### 2. Last Name

- Purpose: Capture client's last name.
- Fields/Data Shown: `lastName`.
- Components: Single-line text input labeled `Last Name`.
- Behavior:
  - Updates local draft state on every change.
  - Validates on blur and on submit.
- Rules:
  - Required.
  - Trim leading/trailing whitespace on save.
  - Maximum length `50`.
- Empty State: Placeholder `Enter last name`.

### 3. Birthdate

- Purpose: Capture client's birth date using calendar interaction.
- Fields/Data Shown: `birthDate`.
- Components: Read-only input/button field labeled `Birthdate` that opens native date picker calendar.
- Behavior:
  - Tapping field opens calendar picker.
  - Selected date is shown in localized short date format.
  - Date can be cleared before save.
- Rules:
  - Required.
  - Cannot be in the future.
- Empty State: Placeholder `Select birthdate`.

### 4. Phone Number

- Purpose: Capture client's primary phone contact.
- Fields/Data Shown: `phoneNumber`.
- Components: Phone keyboard text input labeled `Phone Number`.
- Behavior:
  - Input supports `+`, spaces, and separators.
  - Value is normalized before submit.
- Rules:
  - Required.
  - Allowed characters: digits, spaces, `+`, `-`, `(`, `)`.
  - Length after trim: `7-20`.
- Empty State: Placeholder `Enter phone number`.

### 5. Sex/Gender

- Purpose: Capture client sex/gender from fixed options.
- Fields/Data Shown: `gender`.
- Components: Segmented control or radio group with values `Male`, `Female`.
- Behavior:
  - Single-select only.
  - Selection updates local draft immediately.
- Rules:
  - Required.
  - Accepted values: `male`, `female`.
- Empty State: Show helper text `Select one option`.

### 6. Notes

- Purpose: Store optional free-text notes about the client.
- Fields/Data Shown: `notes`.
- Components: Multiline text area labeled `Notes`.
- Behavior:
  - Autosizes vertically up to a max height, then scrolls internally.
  - Preserves line breaks.
- Rules:
  - Optional.
  - Maximum length `500`.
- Empty State: Placeholder `Add notes (optional)`.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadClientNewForm | n/a | Screen opens | Initialize empty form and load optional form metadata |
| pickBirthdate | Birthdate field | Tap field | Open native date picker and set `birthDate` |
| changeField | n/a | User edits any input | Update form draft and clear field-level error |
| submitClient | Save | Tap primary button | Validate and create client via API |
| cancelCreateClient | Back | Tap back with unsaved changes | Show confirm dialog and discard or stay |

## Data Model

```json
{
  "firstName": "Jan",
  "lastName": "Kowalski",
  "birthDate": "1992-04-16",
  "phoneNumber": "+48123123123",
  "gender": "male",
  "notes": "Prefers evening training sessions.",
  "isDirty": true,
  "isSaving": false,
  "errors": {}
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/clients/form-metadata | Load optional create-form metadata (for example supported gender options) | n/a | `{ genders: ["male", "female"] }` |
| POST | /api/clients | Create a new client | `{ firstName, lastName, birthDate, phoneNumber, gender, notes }` | `{ id, firstName, lastName, birthDate, phoneNumber, gender, notes, fullName }` |

## States

### default

All fields are visible and editable. `Save` is enabled only when required fields are valid.

### loading

Show field skeletons/placeholders while form metadata is loading. Keep screen visible but disable submit until initialization completes.

### empty

Initial create state with all form fields empty and placeholders visible.

### error

Show inline validation errors per field and a top-level banner for API failures with retry option.

### success (optional)

Show toast `Client created` and navigate to `client-details` (`/clients/{clientId}`) or back to `/clients` with refreshed list.

### disabled (optional)

Disable `Save` when form is invalid, unchanged, or `isSaving == true`.

### offline (optional)

Show header warning indicator `!`; on tap show `No internet connection`. Disable `Save` and keep local form values so user can submit when connection returns.

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

- User selects a future date in picker; value is rejected and field error is shown.
- User enters formatted phone with spaces/separators; app normalizes before submit.
- API returns duplicate client conflict (same phone/name); show non-blocking conflict message and keep data editable.
- User leaves screen with unsaved changes; show discard confirmation.

## Navigation

- Entry: from `/clients` via add client action.
- Back: return to `/clients` (with discard confirmation when form is dirty).
- On successful save: navigate to `/clients/{clientId}` or `/clients` depending on product flow configuration.

## Notes

### Assumptions (if any)

- Client sex/gender options are limited to `male` and `female` for this version.
- Phone number is stored as plain string and backend handles final normalization.
