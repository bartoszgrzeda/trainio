---
id: training-starting
name: TrainingStartingView
route: /training/start
auth: true
layout: mobile
title: Training Start
description: Pre-training screen with athlete context, plan preview, and transition to active training.
---

# Training Start

## Purpose

Prepare trainer before exercise logging by showing session context and the selected training plan.

## User

Authenticated trainer starting one planned training session.

## Main Goals

- Confirm athlete and session time.
- Review plan name and exercise order.
- Access past training history before starting.
- Move to active training flow.

## Sections

### 1. Session Header

- Purpose: Show who is being trained and at what time.
- Fields/Data Shown: `athlete.name`, `sessionTime` (`HH:mm`).
- Components: Header text (`Jan Kowalski - 12:00`).
- Behavior:
  - Always shown on this view.
- Rules:
  - Use local timezone and 24-hour format.
- Empty State: n/a.

### 2. Training Plan Preview

- Purpose: Present selected plan and ordered exercise list.
- Fields/Data Shown: `plan.name`, `plan.exercises[].name`.
- Components: Plan title + vertical list.
- Behavior:
  - Read-only preview.
- Rules:
  - Keep exercise order exactly as returned by API.
- Empty State: `No exercises in this plan`.

### 3. Last Trainings History

- Purpose: Allow trainer to inspect recent sessions before starting.
- Fields/Data Shown: `athlete.id`.
- Components: Secondary button `Last Trainings History`.
- Behavior:
  - On tap, navigate to training history screen.
- Rules:
  - Button is visible even if plan is empty.
- Empty State: n/a.

### 4. Start Action

- Purpose: Move from setup to active exercise tracking.
- Fields/Data Shown: `trainingId`, `plan.exercises.length`.
- Components: Primary button `Next`.
- Behavior:
  - On tap, set training state to `in_progress` and open in-progress view.
- Rules:
  - Disabled when plan has zero exercises.
- Empty State: n/a.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadStartingData | n/a | Screen opens/resumes | Fetch training start view data |
| openLastTrainingsHistory | Last Trainings History | Tap button | Navigate to history view for current athlete |
| goToInProgress | Next | Tap button (enabled) | Update training state and navigate to `/training` |

## Data Model

```json
{
  "trainingId": "tr_203",
  "athlete": {
    "id": "ath_18",
    "name": "Jan Kowalski"
  },
  "sessionTime": "12:00",
  "plan": {
    "id": "plan_fb_1",
    "name": "Full Body Workout",
    "exercises": [
      { "id": "ex_1", "name": "Bench Press" },
      { "id": "ex_2", "name": "Squat" }
    ]
  }
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/trainings/{trainingId}/starting | Load starting view data | n/a | `{ trainingId, athlete, sessionTime, plan }` |
| GET | /api/trainings/{trainingId}/history?athleteId={athleteId} | Load athlete history screen data | n/a | history sessions list |
| POST | /api/trainings/{trainingId}/state | Move to in-progress state | `{ "targetState": "in_progress" }` | `{ "trainingState": "in_progress" }` |

## States

### default

Show athlete header, plan preview, history shortcut, and enabled `Next` when at least one exercise exists.

### loading

Show skeleton for header and list; disable `Next` until required data loads.

### empty

Plan has no exercises. Show empty message and keep `Next` disabled.

### error

Show inline banner (`Could not load training start data. Try again.`) and allow retry.

### disabled (optional)

`Next` is disabled when there are no exercises or transition request is in progress.

### offline (optional)

Show offline banner and disable `Next` if state transition requires online sync.

## Edge Cases

- Training is canceled or already started from another device while this screen is open.
- Plan is edited and becomes empty between load and `Next` tap.
- History request fails; keep trainer on this view and show non-blocking error.

## Navigation

- Entry:
  - From `/home` after trainer taps `Start Training`.
  - Deep link to `/training/start` for active session in `starting` state.
- `Last Trainings History` -> `/training/history?athleteId={athleteId}`.
- `Next` -> `/training` (in-progress view).

## Notes

### Assumptions (if any)

- An active `trainingId` is already created before entering this screen.
- Training history details are defined in a separate view spec.
