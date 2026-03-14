---
id: home
name: HomeView
route: /home
auth: true
layout: mobile
title: Home
description: Daily training overview with quick actions to start or add a training from section headers.
---

# Home

## Purpose

Provide trainers with immediate visibility of the next scheduled training and today trainings list, with one-tap actions to start or add a training.

## User

Authenticated trainer opening the app to manage the current day schedule.

## Main Goals

- See the next training at a glance.
- Start the next training quickly when allowed.
- Review all trainings planned for today.
- Add a new training from the Today Trainings section header.

## Sections

### 1. Next Training

- Purpose: Highlight the nearest upcoming training for today.
- Fields/Data Shown: `name`, `startTime` (formatted `HH:mm`), optional `status`.
- Components: Section title, compact info card (`Next Training: Jan Kowalski - 12:00`).
- Behavior:
  - Show first upcoming item with status `planned`.
  - If no upcoming planned training exists, show `No next training scheduled`.
- Rules:
  - Time must be shown in local device timezone.
  - Canceled or finished trainings cannot be shown as next training.
- Empty State: `No next training scheduled`.

### 2. Start Training

- Purpose: Let the trainer start the next planned training with one tap.
- Fields/Data Shown: `nextTraining.id`, `nextTraining.status`, `activeTrainingId`.
- Components: Compact header action button with play icon (`▶`) next to `Next Training` section title, matching shared add-action button rules.
- Behavior:
  - Button is always visible in the `Next Training` section header.
  - Button is disabled when `nextTraining == null`.
  - On tap, call start API for `nextTraining.id`.
  - On success, navigate to `/training/start`.
- Rules:
  - If any training is already started (`activeTrainingId != null`), button is disabled.
  - If next training becomes invalid during request (canceled or started by another device), show error message and refresh.
- Empty State: Button remains disabled.

### 3. Today Trainings

- Purpose: Display today full training list and progress.
- Fields/Data Shown: `startTime`, `name`, `status` (`planned | finished | canceled | started`).
- Components:
  - Section header row with:
    - Title `Today Trainings` (`85%` width).
    - Compact add action button `+` (`15%` width), matching shared app-shell add-action rules.
  - Vertical list rows (`10:00 Anna Nowak Finished`), status badge/text.
- Behavior:
  - Sorted by `startTime` ascending.
  - Pull-to-refresh reloads the list and next training.
  - Tapping `+` opens training creation view.
  - Status label mapping:
    - `planned` -> `Planned`
    - `finished` -> `Finished`
    - `canceled` -> `Canceled`
    - `started` -> `Started`
- Rules:
  - Include all today trainings regardless of status.
  - Use 24-hour clock (`HH:mm`).
  - `+` action stays visible in all states and uses minimum tap target `44x44`.
- Empty State: `No trainings planned for today`.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadHomeData | n/a | Screen opens or pull-to-refresh | Fetch next training and today list |
| startNextTraining | Start Training | Tap play header button (if enabled) | Start `nextTraining`, then navigate to `/training/start` |
| openAddTraining | + | Tap header add button | Navigate to training creation screen |

## Data Model

```json
{
  "date": "2026-03-06",
  "nextTraining": {
    "id": "tr_102",
    "name": "Jan Kowalski",
    "startTime": "12:00",
    "status": "planned"
  },
  "activeTrainingId": null
}
```

```json
[
  {
    "id": "tr_100",
    "startTime": "10:00",
    "name": "Anna Nowak",
    "status": "finished"
  },
  {
    "id": "tr_101",
    "startTime": "11:00",
    "name": "Piotr Zielinski",
    "status": "canceled"
  },
  {
    "id": "tr_102",
    "startTime": "12:00",
    "name": "Jan Kowalski",
    "status": "planned"
  }
]
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/trainings/home?date={yyyy-mm-dd} | Load next training and today list for home | n/a | `{ date, nextTraining, activeTrainingId, trainings[] }` |
| POST | /api/trainings/{trainingId}/start | Start selected training and initialize session flow | n/a | `{ trainingId, status: "started" }` |

## States

### default

`Next Training` shows upcoming planned item. `Start Training` play button is visible in the section header and enabled based on eligibility. `Today Training` section shows non-empty list and visible `+` add action.

### loading

Show skeleton for next training card and list rows. Disable action buttons until initial data load completes.

### empty

No next training and no today trainings. Show empty messages in both sections; keep `+` add action visible.

### error

Show inline error banner: `Could not load trainings. Try again.` Provide retry action via pull-to-refresh.

### success (optional)

After successful start action, navigate to `/training/start` and optionally show short toast: `Training started`.

### disabled (optional)

`Start Training` is disabled when rules are not met (`nextTraining == null` or `activeTrainingId != null`).

### offline (optional)

Show header warning indicator `!`; on tap show `No internet connection`. Keep cached list if available. Disable `Start Training`.

## Edge Cases

- `nextTraining` exists but becomes `canceled` before start action completes.
- Two trainings have the same `startTime`; preserve API order as tie-breaker.
- User opens screen after midnight; data must refresh for current local date.
- `activeTrainingId` points to a training not in today list (started earlier or previous day); keep `Start Training` disabled.

## Navigation

- Entry point: home route from app shell.
- `+` in `Today Training` header -> `/trainings/new`.
- After successful `Start Training`, navigate to `/training/start`.

## Notes

### Assumptions (if any)

- Home data is served by a single aggregated endpoint for performance.
- `Add Training` flow is implemented in a separate view.
- Status values are backend-controlled and match: `planned`, `finished`, `canceled`, `started`.
