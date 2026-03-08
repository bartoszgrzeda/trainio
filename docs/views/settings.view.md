---
id: settings
name: SettingsView
route: /settings
auth: true
layout: mobile
title: Settings
description: Account settings hub with quick navigation to profile, exercises, plan templates, subscription, and sign-out.
---

# Settings

## Purpose

Provide a simple account settings hub where the trainer can open specific settings areas and sign out.

## User

Authenticated trainer managing account preferences and session access.

## Main Goals

- Open profile settings.
- Open exercises settings.
- Open plan templates settings.
- Open subscription settings.
- Sign out of the app.

## Sections

### 1. Settings Actions

- Purpose: Provide direct access to account settings and session actions.
- Fields/Data Shown: `isSigningOut`.
- Components:
  - Standalone button `Profile`.
  - Standalone button `Exercises`.
  - Standalone button `Plans Templates`.
  - Standalone button `Subscription`.
  - Standalone destructive button `Sign Out`.
- Behavior:
  - `Profile`: on tap, navigate to `settings-profile` view.
  - `Exercises`: on tap, navigate to `settings-exercises` view.
  - `Plans Templates`: on tap, navigate to `plan-template-list` view.
  - `Subscription`: on tap, navigate to `settings-subscription` view.
  - `Sign Out`: on tap, call sign-out API and clear local auth session.
  - `Sign Out` success: navigate to auth entry route.
- Rules:
  - All five buttons are rendered as independent controls in a single list.
  - Do not display grouping headers such as `Account` or `Session`.
  - `Profile`, `Exercises`, `Plans Templates`, and `Subscription` are always visible and enabled.
  - Disable `Sign Out` while sign-out request is in progress.
  - If sign-out fails, keep user on settings and show error banner.
- Empty State: n/a.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| openSettingsProfile | Profile | Tap button | Navigate to `settings-profile` view |
| openSettingsExercises | Exercises | Tap button | Navigate to `settings-exercises` view |
| openPlanTemplateList | Plans Templates | Tap button | Navigate to `plan-template-list` view |
| openSettingsSubscription | Subscription | Tap button | Navigate to `settings-subscription` view |
| signOut | Sign Out | Tap button | Invalidate session and navigate to auth route |

## Data Model

```json
{
  "isSigningOut": false,
  "menuItems": [
    { "id": "profile", "label": "Profile", "targetView": "settings-profile" },
    { "id": "exercises", "label": "Exercises", "targetView": "settings-exercises" },
    { "id": "plansTemplates", "label": "Plans Templates", "targetView": "plan-template-list" },
    { "id": "subscription", "label": "Subscription", "targetView": "settings-subscription" }
  ]
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| POST | /api/auth/sign-out | End current session | n/a | `{ "success": true }` |

## States

### default

All five standalone buttons are visible. Navigation buttons are enabled. `Sign Out` is enabled.

### loading

When sign-out is in progress, keep settings options visible and disable `Sign Out` with loading indicator.

### empty

Not applicable for this static menu screen. If menu configuration fails to load, fallback to local default items (`Profile`, `Exercises`, `Plans Templates`, `Subscription`).

### error

Show inline banner: `Could not sign out. Try again.` Keep user on settings and allow retry.

### disabled (optional)

`Sign Out` is disabled while `isSigningOut == true`.

### offline (optional)

Show header warning indicator `!`; on tap show `No internet connection`. Keep navigation buttons available, but block `Sign Out` if API requires network.

## Edge Cases

- User taps `Sign Out` multiple times quickly; only first request should execute.
- Session is already expired before `Sign Out`; treat response as successful local sign-out.
- Target settings views are temporarily unavailable; show non-blocking error and remain on current screen.

## Navigation

- Entry point: `/settings` from bottom menu.
- `Profile` -> `settings-profile` view.
- `Exercises` -> `settings-exercises` view.
- `Plans Templates` -> `plan-template-list` view.
- `Subscription` -> `settings-subscription` view.
- `Sign Out` success -> auth entry route (for example `/auth/login`).

## Notes

### Assumptions (if any)

- Detailed behavior of `settings-profile`, `settings-exercises`, `plan-template-list`, and `settings-subscription` is defined in separate view specs.
