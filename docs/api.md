# API Documentation

This document is generated from view specifications (`*.view.md`).

Each endpoint listed here is automatically extracted from the application view definitions.

<!-- GENERATED SECTION -->
<!-- GENERATED SECTION START -->
## Endpoints Index

- `POST /api/auth/sign-out`
- `GET /api/clients`
- `GET /api/profile/me`
- `PATCH /api/profile/me`
- `GET /api/trainings/home`
- `POST /api/trainings/{trainingId}/exercises/{exerciseId}/results`
- `POST /api/trainings/{trainingId}/finish`
- `GET /api/trainings/{trainingId}/finishing`
- `GET /api/trainings/{trainingId}/history`
- `GET /api/trainings/{trainingId}/in-progress`
- `POST /api/trainings/{trainingId}/next-exercise`
- `POST /api/trainings/{trainingId}/start`
- `GET /api/trainings/{trainingId}/starting`
- `POST /api/trainings/{trainingId}/state`
- `POST /api/uploads/profile-photo`

---

## POST /api/auth/sign-out

### Summary

End current session

### Used in Views

- settings (`/settings`, `SettingsView`)

### Query Parameters

None

### Path Parameters

None

### Request Body

None

### Response Body

Example structure:

```json
{
  "success": true
}
```

### Notes

- None.

---

## GET /api/clients

### Summary

Load or search clients list

### Used in Views

- client-list (`/clients`, `ClientListView`)

### Query Parameters

| name | type | required | description | example |
| ---- | ---- | -------- | ----------- | ------- |
| query | string | yes | Query parameter | value |

### Path Parameters

None

### Request Body

None

### Response Body

Example structure:

```json
{
  "clients": [
    {
      "id": "cl_001",
      "fullName": "Jan Kowalski"
    }
  ]
}
```

### Notes

- Parameter `query` example inferred from naming conventions.
- Expanded shorthand payload fields `clients` using `Data Model` examples and naming heuristics.

---

## GET /api/profile/me

### Summary

Load current profile data

### Used in Views

- settings-profile (`/settings/profile`, `SettingsProfileView`)

### Query Parameters

None

### Path Parameters

None

### Request Body

None

### Response Body

Example structure:

```json
{
  "id": "usr_120",
  "photoUrl": "https://cdn.example.com/profile/usr_120.jpg",
  "photoAssetId": "asset_893",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "email": "jan.kowalski@example.com",
  "phoneNumber": "+48123456789"
}
```

### Notes

- None.

---

## PATCH /api/profile/me

### Summary

Save editable profile fields

### Used in Views

- settings-profile (`/settings/profile`, `SettingsProfileView`)

### Query Parameters

None

### Path Parameters

None

### Request Body

Example structure:

```json
{
  "photoAssetId": "asset_893",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "email": "jan.kowalski@example.com",
  "phoneNumber": "+48123456789"
}
```

### Response Body

Example structure:

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

### Notes

- Response body inferred from `Data Model` because API response was a textual description.

---

## GET /api/trainings/home

### Summary

Load next training and today list for home

### Used in Views

- home (`/home`, `HomeView`)

### Query Parameters

| name | type | required | description | example |
| ---- | ---- | -------- | ----------- | ------- |
| date | string (date) | yes | Requested day | 2026-03-06 |

### Path Parameters

None

### Request Body

None

### Response Body

Example structure:

```json
{
  "date": "2026-03-06",
  "nextTraining": {
    "id": "tr_102",
    "name": "Jan Kowalski",
    "startTime": "12:00",
    "status": "planned"
  },
  "activeTrainingId": null,
  "trainings": [
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
}
```

### Notes

- None.

---

## POST /api/trainings/{trainingId}/exercises/{exerciseId}/results

### Summary

Save current exercise results

### Used in Views

- training-in-progress (`/training`, `TrainingInProgressView`)

### Query Parameters

None

### Path Parameters

| name | type | required | description | example |
| ---- | ---- | -------- | ----------- | ------- |
| exerciseId | string | yes | Path identifier | ex_1 |
| trainingId | string | yes | Path identifier | tr_203 |

### Request Body

Example structure:

```json
{
  "sets": [
    {
      "series": 1,
      "weightKg": 55,
      "repeats": 10
    }
  ]
}
```

### Response Body

Example structure:

```json
{
  "sets": [
    {
      "series": 1,
      "weightKg": 55,
      "repeats": 10
    }
  ]
}
```

### Notes

- Parameter `exerciseId` example inferred from naming conventions.
- Response body inferred as persisted set data based on API description.

---

## POST /api/trainings/{trainingId}/finish

### Summary

Save notes and finalize training

### Used in Views

- training-finishing (`/training/finish`, `TrainingFinishingView`)

### Query Parameters

None

### Path Parameters

| name | type | required | description | example |
| ---- | ---- | -------- | ----------- | ------- |
| trainingId | string | yes | Path identifier | tr_203 |

### Request Body

Example structure:

```json
{
  "notes": "Strong squat progression."
}
```

### Response Body

Example structure:

```json
{
  "trainingId": "tr_203",
  "durationSeconds": 3180,
  "durationLabel": "53 min",
  "notes": ""
}
```

### Notes

- Response body inferred from `Data Model` because API response was a textual description.

---

## GET /api/trainings/{trainingId}/finishing

### Summary

Load finishing view data

### Used in Views

- training-finishing (`/training/finish`, `TrainingFinishingView`)

### Query Parameters

None

### Path Parameters

| name | type | required | description | example |
| ---- | ---- | -------- | ----------- | ------- |
| trainingId | string | yes | Path identifier | tr_203 |

### Request Body

None

### Response Body

Example structure:

```json
{
  "trainingId": "tr_203",
  "durationSeconds": 3180,
  "notes": ""
}
```

### Notes

- None.

---

## GET /api/trainings/{trainingId}/history

### Summary

Load athlete history screen data

### Used in Views

- training-starting (`/training/start`, `TrainingStartingView`)

### Query Parameters

| name | type | required | description | example |
| ---- | ---- | -------- | ----------- | ------- |
| athleteId | string | yes | Query identifier | ath_18 |

### Path Parameters

| name | type | required | description | example |
| ---- | ---- | -------- | ----------- | ------- |
| trainingId | string | yes | Path identifier | tr_203 |

### Request Body

None

### Response Body

Example structure:

```json
[]
```

### Notes

- Parameter `athleteId` example inferred from related `Data Model` identifier because an exact field was not present.
- Response body inferred as an array from textual API description; detailed item schema was not provided.

---

## GET /api/trainings/{trainingId}/in-progress

### Summary

Load in-progress view data for current exercise

### Used in Views

- training-in-progress (`/training`, `TrainingInProgressView`)

### Query Parameters

None

### Path Parameters

| name | type | required | description | example |
| ---- | ---- | -------- | ----------- | ------- |
| trainingId | string | yes | Path identifier | tr_203 |

### Request Body

None

### Response Body

Example structure:

```json
{
  "currentExercise": {
    "id": "ex_2",
    "name": "Squat"
  },
  "currentExerciseIndex": 1,
  "totalExercises": 2,
  "lastResults": [
    {
      "date": "2026-03-05",
      "resultLabel": "55x10"
    },
    {
      "date": "2026-03-02",
      "resultLabel": "50x10"
    }
  ],
  "currentResults": [
    {
      "series": 1,
      "weightKg": 55,
      "repeats": 10
    }
  ]
}
```

### Notes

- None.

---

## POST /api/trainings/{trainingId}/next-exercise

### Summary

Move to next exercise

### Used in Views

- training-in-progress (`/training`, `TrainingInProgressView`)

### Query Parameters

None

### Path Parameters

| name | type | required | description | example |
| ---- | ---- | -------- | ----------- | ------- |
| trainingId | string | yes | Path identifier | tr_203 |

### Request Body

None

### Response Body

Example structure:

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
    {
      "date": "2026-03-05",
      "resultLabel": "55x10"
    },
    {
      "date": "2026-03-02",
      "resultLabel": "50x10"
    }
  ],
  "currentResults": [
    {
      "series": 1,
      "weightKg": 55,
      "repeats": 10
    }
  ]
}
```

### Notes

- Response body inferred from `Data Model` because API response was a textual description.

---

## POST /api/trainings/{trainingId}/start

### Summary

Start selected training and initialize session flow

### Used in Views

- home (`/home`, `HomeView`)

### Query Parameters

None

### Path Parameters

| name | type | required | description | example |
| ---- | ---- | -------- | ----------- | ------- |
| trainingId | string | yes | Path identifier | tr_102 |

### Request Body

None

### Response Body

Example structure:

```json
{
  "trainingId": "tr_102",
  "status": "started"
}
```

### Notes

- Parameter `trainingId` example inferred from naming conventions.
- Expanded shorthand payload fields `trainingId` using `Data Model` examples and naming heuristics.

---

## GET /api/trainings/{trainingId}/starting

### Summary

Load starting view data

### Used in Views

- training-starting (`/training/start`, `TrainingStartingView`)

### Query Parameters

None

### Path Parameters

| name | type | required | description | example |
| ---- | ---- | -------- | ----------- | ------- |
| trainingId | string | yes | Path identifier | tr_203 |

### Request Body

None

### Response Body

Example structure:

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
      {
        "id": "ex_1",
        "name": "Bench Press"
      },
      {
        "id": "ex_2",
        "name": "Squat"
      }
    ]
  }
}
```

### Notes

- None.

---

## POST /api/trainings/{trainingId}/state

### Summary

Move to finishing state

### Used in Views

- training-in-progress (`/training`, `TrainingInProgressView`)
- training-starting (`/training/start`, `TrainingStartingView`)

### Query Parameters

None

### Path Parameters

| name | type | required | description | example |
| ---- | ---- | -------- | ----------- | ------- |
| trainingId | string | yes | Path identifier | tr_203 |

### Request Body

Example structure:

```json
{
  "targetState": "finishing"
}
```

### Response Body

Example structure:

```json
{
  "trainingState": "finishing"
}
```

### Notes

- Multiple request examples detected across views; kept the first parsed example from `training-in-progress`.
- Multiple response examples detected across views; kept the first parsed example from `training-in-progress`.

---

## POST /api/uploads/profile-photo

### Summary

Upload selected photo file

### Used in Views

- settings-profile (`/settings/profile`, `SettingsProfileView`)

### Query Parameters

None

### Path Parameters

None

### Request Body

Example structure:

```json
{
  "file": "<binary>"
}
```

### Response Body

Example structure:

```json
{
  "assetId": "asset_893",
  "url": "value"
}
```

### Notes

- Request body inferred from `multipart/form-data` description.
- Expanded shorthand payload fields `assetId`, `url` using `Data Model` examples and naming heuristics.
<!-- GENERATED SECTION END -->
