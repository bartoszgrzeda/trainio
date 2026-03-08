# Interpretation

Generated mobile view assets for `Class Check-In` from backend contracts as the source of truth.

## Backend Contract Digest

- Endpoints:
  - `GET /api/classes/{classId}/attendees`
  - `POST /api/classes/{classId}/checkins`
- Key constraints:
  - One check-in per member per class
  - Canceled class blocks check-in
  - Optional note max length 160
- State model:
  - `initial -> loading_attendees -> ready -> submitting -> checked_in`
  - Error branches: `duplicate_checkin_error`, `class_canceled_error`

## UX Mapping

| Backend State/Event | UI State | User Feedback | Available Actions |
|---|---|---|---|
| `loading_attendees` | `loading` | Skeleton/member list loader | None |
| `ready` | `default` | Select attendee | Select, cancel |
| `submitting` | `loading` | Button spinner + controls disabled | Cancel disabled |
| `checked_in` | `success` | Success banner + redirect | None |
| `DUPLICATE_CHECKIN` | `failure` | Inline row error | Re-select attendee |
| `CLASS_CANCELED` | `failure` | Top blocking banner | Cancel only |

## Delegation Summary

- `mobile-view-spec-assistant`
  - mode: `single_view`
  - output: `docs/views/class-checkin.view.md`
  - refinement pass: 1 (added missing empty state)
- `rn-view-generator`
  - inputs: `docs/app-shell.md`, `docs/views/class-checkin.view.md`
  - generated:
    - `app/src/screens/ClassCheckinScreen.tsx`
    - `app/e2e/tests/class-checkin.e2e.ts`

## Generated/Updated Files

- `docs/views/class-checkin.view.md`
- `app/src/screens/ClassCheckinScreen.tsx`
- `app/e2e/tests/class-checkin.e2e.ts`

## Constraint Preservation Report

- Preserved:
  - Exact `METHOD + path` contracts
  - Duplicate check-in conflict shown inline
  - Canceled-class rule blocks submit action
- Deviations:
  - None

## Verification

- `npm run lint` -> passed
- `npx tsc --noEmit` -> passed
- `npm run e2e:test:ios` -> passed
