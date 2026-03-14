# Verification Policy

The skill must verify both implementation and behavior, including E2E execution.

## Required Behavior

- Always run verification commands after generation/patching.
- Always execute an E2E command before claiming verification complete.
- If E2E cannot run, report exact blocker and command output summary.

## Command Resolution

Run from the mobile app root (for this repository: `app/`).

Suggested order:

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm test -- --watchAll=false` (if unit tests exist)
4. E2E command (first available):
   - `npm run e2e:test:ios`
   - `npm run e2e:test`
   - `npx detox test --configuration ios.sim.debug`

## Verification Report Format

- `Command`
- `Result` (`passed` / `failed` / `blocked`)
- `Key output` (short summary, not full logs)

Example:

- `npm run lint` -> `passed`
- `npx tsc --noEmit` -> `passed`
- `npm run e2e:test:ios` -> `failed` (`applesimutils: command not found`)
