---
id: training-finishing
name: TrainingFinishingView
route: /training/finish
auth: true
layout: mobile
title: Finish Training
description: Final training summary with duration, optional notes, and save action.
---

# Finish Training

## Purpose

Finalize a completed workout by confirming duration, capturing optional notes, and saving the session.

## User

Authenticated trainer closing an active training session.

## Main Goals

- Show how long the session took.
- Capture optional notes for future reference.
- Save and mark training as finished.

## Sections

### 1. Duration Summary

- Purpose: Provide quick session duration context before saving.
- Fields/Data Shown: `durationSeconds`, `durationLabel`.
- Components: Read-only duration block (`53 min`).
- Behavior:
  - Always visible.
- Rules:
  - Duration derives from session start and is not manually editable.
- Empty State: `Duration unavailable`.

### 2. Notes

- Purpose: Store qualitative observations from the session.
- Fields/Data Shown: `notes`.
- Components: Multiline text input with placeholder (`Add summary notes`).
- Behavior:
  - Live-update local draft.
- Rules:
  - Notes are optional.
- Empty State: Placeholder only.

### 3. Save Action

- Purpose: Persist finishing data and complete training.
- Fields/Data Shown: `trainingId`, `notes`.
- Components: Primary button `Save`.
- Behavior:
  - On tap, submit notes and finalize training.
- Rules:
  - Disabled while request is in progress.
- Empty State: n/a.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadFinishingData | n/a | Screen opens/resumes | Fetch duration and existing notes draft |
| updateNotes | n/a | Edit notes | Update local notes draft |
| saveTraining | Save | Tap button | Complete training and navigate to home |

## Data Model

```json
{
  "trainingId": "tr_203",
  "durationSeconds": 3180,
  "durationLabel": "53 min",
  "notes": ""
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/trainings/{trainingId}/finishing | Load finishing view data | n/a | `{ trainingId, durationSeconds, notes }` |
| POST | /api/trainings/{trainingId}/finish | Save notes and finalize training | `{ "notes": "Strong squat progression." }` | completed training summary |

## States

### default

Show duration summary, notes input, and enabled `Save` button.

### loading

Show skeleton for duration and notes area. Disable `Save` until data loads.

### empty

Duration missing from API. Show fallback text and keep notes/save available.

### error

Show banner (`Could not finish training. Try again.`) and keep draft notes intact.

### success (optional)

After successful save, show toast (`Training saved`) then redirect.

### disabled (optional)

`Save` disabled while finish request is in flight.

### offline (optional)

Show offline banner and block final save until connection is restored.

## Validation

- `notes`: optional, max `500` characters.
- Trim leading/trailing whitespace before submit.

## Edge Cases

- User leaves screen and returns before save; notes draft should persist locally.
- Finish API succeeds but redirect fails; keep success feedback and allow manual navigation.
- Training already finished from another device; handle idempotent save response.

## Navigation

- Entry: from `/training` after tapping `Finish Training` on last exercise.
- On successful `Save` -> `/home`.

## Notes

### Assumptions (if any)

- Duration timer is maintained by backend and exposed as `durationSeconds`.
- Notes are not mandatory to close training.
