---
id: settings-profile
name: SettingsProfileView
route: /settings/profile
auth: true
layout: mobile
title: Profile
description: Editable profile screen for personal data and contact details.
---

# Profile

## Purpose

Allow the authenticated user to edit personal profile data: photo, first name, last name, email, and phone number.

## User

Authenticated trainer updating account identity and contact information.

## Main Goals

- Update profile photo from device gallery/camera.
- Edit first and last name.
- Edit email and phone number.
- Save validated changes safely.

## Sections

### 1. Photo

- Purpose: Show current avatar and allow photo replacement.
- Fields/Data Shown: `photoUrl`, `pendingPhotoUri`, `isUploadingPhoto`, `photoUploadError`.
- Components: Avatar preview, secondary button `Upload Photo`, optional upload progress indicator (without section header label).
- Behavior:
  - On tap `Upload Photo`, open system media picker (camera or gallery).
  - After image selection, show local preview immediately.
  - Upload image to media endpoint and store returned `photoAssetId` in draft profile form.
- Rules:
  - Allow only image MIME types (`image/jpeg`, `image/png`, `image/webp`).
  - Maximum file size: 5 MB.
  - If upload fails, keep previous saved photo and show inline error.
- Empty State: Show avatar placeholder with initials when no photo exists.

### 2. Personal Information

- Purpose: Edit name and contact data in a single section.
- Fields/Data Shown: `firstName`, `lastName`, `email`, `phoneNumber`.
- Components:
  - Grouped input card without section header label.
  - Single-line text input labeled `First Name`.
  - Single-line text input labeled `Last Name`.
  - Email keyboard input labeled `Email`.
  - Phone keyboard input labeled `Phone Number`.
- Behavior:
  - All four fields are controlled inputs that update local draft values.
  - Email validates format on blur and on save.
  - Phone number can display a format hint while typing.
- Rules:
  - `firstName`: required, trim leading/trailing whitespace on save.
  - `lastName`: required, trim leading/trailing whitespace on save.
  - `email`: required, valid email format, normalized to lowercase on save.
  - `phoneNumber`: optional; if provided, must match allowed phone format.
- Empty State:
  - `firstName`: placeholder `Enter first name`.
  - `lastName`: placeholder `Enter last name`.
  - `email`: placeholder `Enter email`.
  - `phoneNumber`: placeholder `Enter phone number`.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadProfile | n/a | Screen opens or pull-to-refresh | Fetch current profile data and initialize form |
| choosePhoto | Upload Photo | Tap button | Open image picker and set pending image |
| uploadPhoto | n/a | Image selected | Upload file and store returned `photoAssetId` |
| saveProfile | Save | Tap primary button | Validate form and persist profile changes |
| cancelChanges | Back | Tap back with unsaved changes | Show confirm dialog and discard or continue editing |

## Data Model

```json
{
  "id": "usr_120",
  "photoUrl": "https://cdn.example.com/profile/usr_120.jpg",
  "photoAssetId": "asset_893",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "email": "jan.kowalski@example.com",
  "phoneNumber": "+48123456789",
  "isDirty": false,
  "isUploadingPhoto": false,
  "isSaving": false
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/profile/me | Load current profile data | n/a | `{ id, photoUrl, photoAssetId, firstName, lastName, email, phoneNumber }` |
| POST | /api/uploads/profile-photo | Upload selected photo file | `multipart/form-data` with `file` | `{ assetId, url }` |
| PATCH | /api/profile/me | Save editable profile fields | `{ photoAssetId, firstName, lastName, email, phoneNumber }` | Updated profile object |

## States

### default

All fields are visible with existing values. `Save` is enabled only when form has valid changes.

### loading

Show input skeletons/placeholders and disable form actions until profile data loads.

### empty

Profile loads with blank optional values (for example no photo and no phone number). Show placeholders and allow full editing.

### error

Show inline/banner error when load, upload, or save fails, with retry action for the failed operation.

### success (optional)

After successful save, show short confirmation toast: `Profile updated`.

### disabled (optional)

Disable `Save` when form is unchanged, invalid, or while `isSaving == true`.

### offline (optional)

Show offline banner. Keep fields editable locally, but block save/upload and explain network requirement.

## Validation

- Field: `firstName`
- Rule: required, length 1-50 after trim.
- Error message: `First name is required.`

- Field: `lastName`
- Rule: required, length 1-50 after trim.
- Error message: `Last name is required.`

- Field: `email`
- Rule: required, RFC-compatible email format.
- Error message: `Enter a valid email address.`

- Field: `phoneNumber`
- Rule: optional; if provided must contain only digits, spaces, `+`, `-`, `(`, `)` and be 7-20 chars.
- Error message: `Enter a valid phone number.`

- Field: `photo`
- Rule: optional; if provided must be image type and max 5 MB.
- Error message: `Use JPG, PNG, or WEBP up to 5 MB.`

## Edge Cases

- User selects very large image; upload is blocked with validation error before network call.
- Email is already used by another account; API returns conflict and field-level error is shown.
- User leaves screen with unsaved edits; show confirmation dialog before discard.
- Upload succeeds but profile save fails; keep uploaded `photoAssetId` in draft and allow save retry.

## Navigation

- Entry: from `/settings` after selecting `Profile`.
- Back: return to `/settings`.
- On successful save: stay on current screen and keep updated values.

## Notes

### Assumptions (if any)

- Profile uses one `PATCH /api/profile/me` endpoint for all editable fields.
- Email updates may require backend uniqueness validation.
- Phone number is stored as plain string; E.164 normalization can be applied server-side.
