---
id: training-in-progress
name: TrainingInProgressView
route: /training
auth: true
layout: mobile
title: Training In Progress
description: Active exercise logging view with previous performance context and dynamic progression actions.
---

# Training In Progress

## Purpose

Help trainer execute the plan exercise by exercise, record results, and finish the session at the right moment.

## User

Authenticated trainer actively conducting a training session.

## Main Goals

- Keep focus on the current exercise.
- Show last 3 historical results for context.
- Add and edit current exercise sets quickly.
- Move to next exercise or finish training.

## Sections

### 1. Current Exercise

- Purpose: Display active exercise identity and progress in plan.
- Fields/Data Shown: `currentExercise.name`, `currentExerciseIndex`, `totalExercises`.
- Components: Exercise title and optional step indicator (`2/5`).
- Behavior:
  - Refreshes on exercise change.
- Rules:
  - Always show one current exercise when state is valid.
- Empty State: `No exercise selected`.

### 2. Last Results

- Purpose: Show recent outcomes for the active exercise.
- Fields/Data Shown: `lastResults[0..2]` with `date` (`dd.MM`) and `resultLabel` (`55x10`).
- Components: Compact list (up to 3 rows).
- Behavior:
  - Reload on current exercise change.
- Rules:
  - Sort newest first.
- Empty State: `No previous results for this exercise`.

### 3. Current Results Entry

- Purpose: Capture sets performed in current session.
- Fields/Data Shown: `currentResults[]` (`series`, `weightKg`, `repeats`).
- Components: Editable rows + `Add Series` button.
- Behavior:
  - Trainer can add rows and edit values inline.
  - New row auto-increments `series`.
- Rules:
  - Invalid rows block progression action.
- Empty State: Render one empty row with `series = 1`.

### 4. Progress Action

- Purpose: Advance exercise flow or complete workout portion.
- Fields/Data Shown: `hasNextExercise`, `nextExerciseName`.
- Components:
  - If `hasNextExercise = true`: primary button `Next (<nextExerciseName>)`.
  - If `hasNextExercise = false`: primary button `Finish Training`.
- Behavior:
  - Saves current exercise results before transition.
- Rules:
  - Disabled while save/transition is in progress or validation fails.
- Empty State: n/a.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadInProgressData | n/a | Screen opens/resumes | Fetch current exercise context, last results, and draft sets |
| addSeries | Add Series | Tap button | Append empty next series row |
| updateSeriesResult | n/a | Edit weight/repeats | Update local set draft |
| goToNextExercise | Next (`<exercise>`) | Tap when another exercise exists | Persist current sets and load next exercise |
| goToFinishing | Finish Training | Tap on final exercise | Persist final sets and navigate to finishing view |

## Data Model

```json
{
  "trainingId": "tr_203",
  "currentExerciseIndex": 1,
  "totalExercises": 2,
  "currentExercise": {
    "id": "ex_2",
    "name": "Squat"
  },
  "hasNextExercise": false,
  "nextExerciseName": null,
  "lastResults": [
    { "date": "2026-03-05", "resultLabel": "55x10" },
    { "date": "2026-03-02", "resultLabel": "50x10" }
  ],
  "currentResults": [
    { "series": 1, "weightKg": 55, "repeats": 10 }
  ]
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/trainings/{trainingId}/in-progress | Load in-progress view data for current exercise | n/a | `{ currentExercise, currentExerciseIndex, totalExercises, lastResults, currentResults }` |
| POST | /api/trainings/{trainingId}/exercises/{exerciseId}/results | Save current exercise results | `{ "sets": [{ "series": 1, "weightKg": 55, "repeats": 10 }] }` | persisted sets |
| POST | /api/trainings/{trainingId}/next-exercise | Move to next exercise | n/a | updated current exercise context |
| POST | /api/trainings/{trainingId}/state | Move to finishing state | `{ "targetState": "finishing" }` | `{ "trainingState": "finishing" }` |

## States

### default

Show current exercise, last results list, editable sets, and dynamic primary action.

### loading

Show skeleton for exercise title and rows; disable primary action until data is ready.

### empty

No historical results for current exercise. Keep set entry enabled and show section empty message.

### error

Show banner (`Could not load exercise data. Try again.`) and preserve unsent local edits when possible.

### success (optional)

After per-exercise save, show short feedback (`Results saved`) without leaving the view.

### disabled (optional)

Primary action is disabled when any edited set is invalid or when request is in flight.

### offline (optional)

Show header warning indicator `!`; on tap show `No internet connection`. Allow local edits but block progression until sync is available.

## Validation

- `currentResults[].series`: integer, min `1`, auto-generated.
- `currentResults[].weightKg`: number, min `0`, max `500`.
- `currentResults[].repeats`: integer, min `1`, max `100`.
- At least one valid set is required before `Next` or `Finish Training`.

## Edge Cases

- User taps primary action repeatedly before first request returns.
- Exercise list changes on backend while session is in progress.
- Current exercise context is missing after app resume; view must re-fetch safely.
- Save succeeds but next-exercise fetch fails; stay on current view and show retry.

## Navigation

- Entry:
  - From `/training/start` after `Next`.
  - Re-entry from Training tab for active session in `in_progress` state.
- `Next (<exercise>)`: stays on `/training` with new exercise context.
- `Finish Training`: navigate to `/training/finish`.

## Notes

### Assumptions (if any)

- `/training` is the route used by the bottom Training tab for active sessions.
- Only one exercise is active at a time.
