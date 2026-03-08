# Backend Analysis Checklist

Use this checklist before delegating to `mobile-view-spec-assistant`.

## 1) Endpoint and Contract Analysis

- Identify all feature endpoints with exact `METHOD + path`.
- For each endpoint, capture:
  - request fields, data types, required/optional, max/min ranges, formats
  - response payload shapes and key business flags
  - auth/role/permission requirements
  - idempotency and concurrency constraints (if present)
- List expected HTTP status codes and mapped backend error categories.

## 2) Backend State Model

- Extract lifecycle states (for example: `draft`, `pending`, `completed`, `failed`).
- Extract legal transitions and transition guards.
- Identify terminal states and retry/recovery behavior.
- Note asynchronous states (queued, processing, partial completion).

## 3) UI State Mapping

Create an explicit mapping table:

`backend state/event -> UI state -> user-visible message -> allowed actions`

Minimum UI states:
- `default`
- `loading`
- `empty`
- `success`
- `failure`

Add feature-specific states when backend behavior requires them.

## 4) Validation and Error Presentation

- Map backend validation rules to field-level UI validation.
- Distinguish:
  - inline field errors
  - form-level submission errors
  - global/system errors
- Preserve backend error semantics (e.g., conflict, unauthorized, rate-limit).
- Define retry and recovery UX per error category.

## 5) Actions and Navigation

- Enumerate all user actions supported by backend operations.
- For each action, define:
  - preconditions (enabled/disabled/hidden)
  - API operation called
  - success outcome and navigation target
  - failure outcome and in-place feedback/navigation behavior
- Include cancellation/back behavior and safe interrupt handling.

## 6) Reusable Component Opportunities

- Suggest reusable components for repeated patterns:
  - status banners
  - validation error list
  - loading skeleton/spinner blocks
  - empty-state cards with primary actions
  - submit footers/action bars
- Keep suggestions aligned to existing app-shell/design conventions.

## 7) React Native Best-Practice Constraints (for RN stage)

- Use functional components and hooks.
- Keep local UI state distinct from server state.
- Type request/response structures.
- Use stable `testID` for key actions and assertions.
- Avoid race-prone side effects in render paths.
- Keep loading/error UX explicit and deterministic.
