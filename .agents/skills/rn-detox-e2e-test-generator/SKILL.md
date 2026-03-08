---
name: rn-detox-e2e-test-generator
description: Generate production-quality Detox end-to-end tests for native React Native iOS/Android apps using TypeScript, resilient testID selectors, and feature-oriented reusable screen helpers. Use when requests mention mobile app smoke coverage, auth/navigation flows, form interaction tests, profile/settings/logout journeys, or missing testID recommendations.
---

# Purpose

Generate maintainable, scalable Detox E2E test suites for native React Native apps (iOS and Android) that validate real user behavior across critical app flows.

# When to Use

- Creating new Detox E2E coverage for a native React Native app.
- Expanding existing mobile E2E coverage for smoke, happy-path, navigation, auth, forms, and logout.
- Refactoring brittle mobile tests to stable `testID`-based selectors and reusable screen helpers.
- Generating test files from screen specs, user journeys, and flow descriptions.
- Auditing app screens for missing `testID` values needed for deterministic E2E tests.

Example prompts:
- "Generate Detox TypeScript smoke and login flow tests for onboarding, auth, and home."
- "Create navigation + profile/settings/logout Detox tests for this RN app structure."
- "Produce Detox tests and page objects for login form validation and dashboard tabs."
- "Review this flow and recommend missing React Native testID values for robust E2E coverage."

Do not use this skill for:

- web app E2E testing
- Cypress-based testing
- unit/component testing frameworks
- Appium or Playwright mobile automation

# Workflow

1. Inspect app context and target flows.
2. Derive a feature-oriented test plan.
3. Define selector map and `testID` gap list.
4. Generate reusable helper/screen abstractions.
5. Generate flow tests with explicit assertions and synchronization.
6. Validate structure, naming, and maintainability rules.
7. Return output in the required schema.

## 1) Inspect App Context and Target Flows

Collect from user input or repository artifacts:

- screen inventory (splash/onboarding/login/home/profile/settings/logout)
- navigation model (stack/tab/modal)
- auth entry and post-auth landing behavior
- forms and validation rules
- available `testID` coverage
- loading/async states and network-dependent transitions

If context is incomplete, make minimal assumptions and label each assumption explicitly.

## 2) Derive a Feature-Oriented Test Plan

Build test groups by user flow:

- `smoke`: app launch + critical path viability
- `auth`: login success/failure/basic validation
- `navigation`: tab/stack transitions with screen identity checks
- `forms`: typing/clearing/submitting and post-submit UI expectations
- `profile_settings`: profile open, settings open, logout, return to auth

Prioritize stable, high-signal journeys over exhaustive permutations.

## 3) Define Selector Map and testID Gap List

Create selector inventory using `element(by.id(...))` first.

For each critical interaction/assertion point:

- map existing `testID`
- mark missing `testID`
- provide concrete recommendation aligned to naming convention

Use visible text selectors only as fallback and document the risk.

## 4) Generate Reusable Helper/Screen Abstractions

Generate page objects or screen helpers when they reduce duplication:

- one helper per major screen/flow segment
- centralized selectors and common actions
- no business logic in helpers

Helpers should expose deterministic primitives (tap/type/assert visible/assert hidden/wait).

## 5) Generate Flow Tests

Generate Detox TypeScript tests using:

- `device.launchApp()` for launch/reset intent
- `element(by.id(...))` for interaction/assertion
- `expect(...)` after each significant interaction
- `waitFor(...).toBeVisible().withTimeout(...)` for async transitions
- `tap()`, `typeText()`, `clearText()`, `scroll()` as required

Each test must:

- verify starting screen/state
- perform intentional user actions
- verify end state and key intermediate states
- avoid brittle timing assumptions

## 6) Validate Naming and Quality Gates

Ensure:

- file names and `describe/it` names are flow-oriented and explicit
- assertions exist before and after navigation boundaries
- form tests assert both input behavior and result behavior
- logout tests assert return to login/auth screen
- smoke tests are concise and cover critical path only

## 7) Return Output in Required Schema

Return exactly the sections defined in `Output Format`.

# Checklist

- Scope is native React Native mobile E2E with Detox only.
- Tests are TypeScript and runnable with Detox conventions.
- Core flows covered: launch, splash/onboarding, login, home, navigation, profile, settings, logout.
- Selector strategy prioritizes `testID` and documents any fallback selectors.
- Missing `testID` recommendations are explicit and actionable.
- Assertions exist after each important interaction.
- Async handling uses `waitFor`/expectations, not hardcoded sleeps.
- Test suite is modular (helpers/screens/flows/tests separation when appropriate).
- Naming is consistent and feature-oriented.
- Assumptions are clearly labeled if context was incomplete.

# Output Format

Return exactly this shape:

1. Skill name
2. Skill description
3. Skill instructions
4. Input schema for using the skill
5. Output schema for generated tests
6. Test generation rules
7. Selector strategy
8. Folder structure
9. Example generated Detox test in TypeScript
10. Example screen helper/page object in TypeScript
11. Example app-side `testID` recommendations
12. Suggested future improvements

## Input Schema for Using the Skill

Use this schema in the request payload:

```yaml
platforms:
  - ios
  - android
app:
  name: string
  packageId?: string
  bundleId?: string
flows:
  launch: true|false
  onboarding: true|false
  login: true|false
  home: true|false
  navigation: true|false
  profile: true|false
  settings: true|false
  logout: true|false
screens:
  - name: string
    route?: string
    testIds:
      - string
forms?:
  - screen: string
    fields:
      - name: string
        testId: string
        required?: boolean
auth?:
  login:
    usernameTestId?: string
    passwordTestId?: string
    submitTestId?: string
    successLandingTestId?: string
    failureMessageTestId?: string
data?:
  users?:
    valid:
      username: string
      password: string
    invalid:
      username: string
      password: string
constraints?:
  avoidTextSelectors: true|false
  requireTestIdRecommendations: true|false
assumptionsAllowed?: true|false
```

## Output Schema for Generated Tests

```yaml
summary:
  assumptions:
    - string
  coverage:
    - smoke
    - auth
    - navigation
    - forms
    - profile_settings
generatedFiles:
  - path: e2e/tests/auth/login.happy-path.e2e.ts
    purpose: string
  - path: e2e/screens/login.screen.ts
    purpose: string
  - path: e2e/helpers/session.helper.ts
    purpose: string
selectorAudit:
  used:
    - testId: string
      screen: string
  missingRecommendations:
    - screen: string
      element: string
      recommendedTestId: string
tests:
  namingPattern: "<feature>.<flow>.e2e.ts"
  assertionsPolicy: "assert after every significant interaction"
```

# Rules

- Use Detox only.
- Use TypeScript only.
- Target native mobile React Native app behavior (not web behavior).
- Prefer `element(by.id(...))` selectors.
- Avoid selectors based only on visible text unless no stable `testID` exists.
- Recommend missing `testID` values whenever selector coverage is insufficient.
- Use `waitFor` + visibility conditions for async transitions and loading completion.
- Avoid hardcoded sleeps; if unavoidable, justify and isolate them.
- Keep tests deterministic, independent, and readable.
- Group tests by feature/user flow, not by random chronology.
- Keep smoke tests short and critical-path focused.
- Ensure logout tests verify return to auth/login state.
- Ensure navigation tests verify both source and destination screens.
- Ensure form tests verify input interactions and outcome state.
- Do not introduce Cypress/Appium/Playwright patterns.
- Do not generate fragile tests coupled to localized text content.

## Selector Strategy (Mandatory)

Priority order:

1. `by.id(<testID>)`
2. `by.label(...)` only when app accessibility contract is explicitly stable
3. `by.text(...)` as last-resort fallback with documented brittleness risk

Required app-side `testID` naming convention:

- `screen.<screenName>`
- `button.<actionName>`
- `input.<fieldName>`
- `tab.<tabName>`
- `text.<semanticName>`
- `card.<entityName>.<index>`
- `list.<listName>`
- `item.<entityName>.<id>`

Selector anti-patterns:

- relying on localized UI text for primary selection
- targeting transient loading text
- selecting deeply nested hierarchy paths

## Test Generation Rules (Mandatory)

- Assert current screen identity before and after each navigation event.
- Assert visible loading/progress states when they are part of user flow, then assert settled state.
- Form tests must validate both input handling and user-visible result.
- Authentication tests must include at least one success and one failure path.
- Logout tests must verify return to login/auth UI and absence of authenticated home markers.
- Keep smoke tests short and deterministic (launch -> auth gate -> home ready).
- Prefer feature-oriented files (`auth`, `navigation`, `profile-settings`) over monolithic suites.

## Recommended Folder Structure

```text
e2e/
  config/
  helpers/
  screens/
  flows/
  tests/
  utils/
```

# Examples

- Request: "Generate Detox tests for launch, login, home tabs, profile, settings, logout."
  - Behavior: Create smoke/auth/navigation/profile-settings suites, screen helpers, and `testID` recommendations.
- Request: "Build login form E2E with valid/invalid credentials."
  - Behavior: Create auth-focused tests for success/failure and reusable login helper.
- Request: "Our tests rely on text selectors and keep breaking."
  - Behavior: Refactor to `testID` selector map and provide app-side `testID` remediation list.

Example generated Detox test:

```ts
import { device, expect, element, by, waitFor } from "detox";
import { LoginScreen } from "../screens/login.screen";
import { HomeScreen } from "../screens/home.screen";

describe("auth.login.happy-path", () => {
  const login = new LoginScreen();
  const home = new HomeScreen();

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it("logs in and lands on dashboard", async () => {
    await login.assertVisible();
    await login.enterUsername("qa+valid@trainio.app");
    await login.enterPassword("StrongPass123!");
    await login.submit();

    await waitFor(element(by.id("screen.home")))
      .toBeVisible()
      .withTimeout(10000);
    await home.assertVisible();
    await expect(element(by.id("tab.home"))).toBeVisible();
  });
});
```

Example screen helper/page object:

```ts
import { by, element, expect, waitFor } from "detox";

export class LoginScreen {
  private screen = element(by.id("screen.login"));
  private usernameInput = element(by.id("input.username"));
  private passwordInput = element(by.id("input.password"));
  private loginButton = element(by.id("button.login.submit"));
  private loading = element(by.id("text.auth.loading"));

  async assertVisible(): Promise<void> {
    await expect(this.screen).toBeVisible();
  }

  async enterUsername(value: string): Promise<void> {
    await this.usernameInput.clearText();
    await this.usernameInput.typeText(value);
    await expect(this.usernameInput).toHaveText(value);
  }

  async enterPassword(value: string): Promise<void> {
    await this.passwordInput.clearText();
    await this.passwordInput.typeText(value);
  }

  async submit(): Promise<void> {
    await this.loginButton.tap();
    await waitFor(this.loading).toBeNotVisible().withTimeout(10000);
  }
}
```

Example app-side `testID` recommendations:

- Login screen root container -> `screen.login`
- Login username input -> `input.username`
- Login password input -> `input.password`
- Login submit button -> `button.login.submit`
- Home dashboard root -> `screen.home`
- Bottom tab profile -> `tab.profile`
- Settings save CTA -> `button.settings.save`
- Logout CTA -> `button.logout`

# References

- [references/input-schema.example.yaml](references/input-schema.example.yaml)
- [references/output-schema.example.yaml](references/output-schema.example.yaml)
- [references/testid-convention.md](references/testid-convention.md)
- [references/folder-structure.md](references/folder-structure.md)
- [references/examples/auth.login.happy-path.e2e.ts](references/examples/auth.login.happy-path.e2e.ts)
- [references/examples/login.screen.ts](references/examples/login.screen.ts)
- Detox API docs: https://wix.github.io/Detox/docs/api/actions
- Detox expect/waitFor patterns: https://wix.github.io/Detox/docs/api/expect
