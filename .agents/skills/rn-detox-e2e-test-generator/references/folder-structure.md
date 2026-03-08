# Recommended Detox E2E Folder Structure

```text
e2e/
  config/
    detox.config.ts
    env.ts
  helpers/
    session.helper.ts
    auth.helper.ts
  screens/
    login.screen.ts
    home.screen.ts
    profile.screen.ts
    settings.screen.ts
  flows/
    login.flow.ts
    logout.flow.ts
  tests/
    smoke/
      app-launch.smoke.e2e.ts
    auth/
      login.happy-path.e2e.ts
      login.failure.e2e.ts
    navigation/
      tab-navigation.e2e.ts
    profile-settings/
      profile-settings-logout.e2e.ts
  utils/
    waits.ts
    selectors.ts
```

## Folder Responsibilities

- `config`: Detox and runtime environment setup.
- `helpers`: shared setup/session utilities.
- `screens`: page objects with selectors and deterministic UI actions.
- `flows`: reusable multi-screen business flows.
- `tests`: feature-oriented suites and scenarios.
- `utils`: low-level common helpers (wait wrappers, selector helpers).
