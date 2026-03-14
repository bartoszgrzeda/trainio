# RN View -> Detox E2E Rules

Use these rules when generating or updating E2E tests alongside a screen.

## Scope

- Target one screen/view spec flow at a time.
- Cover at least one end-to-end user journey that proves the screen works in context.
- For create flows, verify the created entity appears in its list/detail destination.

## Selector Strategy

Priority:

1. `by.id(<testID>)`
2. `by.label(...)` when accessibility labels are explicitly stable
3. `by.text(...)` only as fallback

Required `testID` naming convention:

- `screen.<name>`
- `input.<name>`
- `button.<name>`
- `list.<name>`
- `item.<entity>.<id-or-key>`
- `tab.<name>`

## Test Structure

- Prefer one feature-oriented test file under `app/e2e/tests/`.
- Use screen helper/page-object classes under `app/e2e/screens/` for repeated interactions.
- Each test should:
  - assert entry screen
  - perform explicit actions
  - assert resulting screen/state
  - assert business-visible outcome (not just tap success)

## Synchronization and Stability

- Use `waitFor(...).toBeVisible().withTimeout(...)` around navigation transitions.
- Avoid hard sleeps.
- Use unique test data to avoid collisions (timestamps/suffixes).
- Dismiss native success alerts if they block subsequent assertions.

## Minimum Assertions by Flow Type

- Create flow:
  - form opens
  - required fields can be entered
  - submit succeeds
  - created entity is visible in target list/details
- List flow:
  - list screen is visible
  - search/filter input works
  - expected item visibility is asserted
