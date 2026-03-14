# React Native `testID` Convention

Use stable, semantic `testID` values that survive copy changes and localization.

## Pattern Set

- `screen.<screenName>`
- `button.<actionName>`
- `input.<fieldName>`
- `tab.<tabName>`
- `text.<semanticName>`
- `card.<entityName>.<index>`
- `list.<listName>`
- `item.<entityName>.<id>`

## Examples by Flow

- Launch/onboarding:
  - `screen.splash`
  - `button.onboarding.continue`
- Login:
  - `screen.login`
  - `input.username`
  - `input.password`
  - `button.login.submit`
  - `text.auth.error.invalidCredentials`
- Home/dashboard:
  - `screen.home`
  - `tab.home`
  - `tab.profile`
  - `tab.settings`
- Profile/settings/logout:
  - `screen.profile`
  - `button.profile.edit`
  - `screen.settings`
  - `button.settings.save`
  - `button.logout`

## Rules

- Every critical interactive element must have a `testID`.
- Keep names product-domain neutral when possible (`button.save` over `button.superSave`).
- Keep identifiers unique within screen context.
- Do not encode transient data values in `testID` names.
