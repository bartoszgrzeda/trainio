---
id: app-shell
name: AppShellSpec
title: Trainio Mobile App Shell
description: Global mobile app shell, persistent bottom navigation, and shared cross-screen rules.
---

# App Shell

## App Purpose

Provide trainers with a mobile-first workspace to manage daily trainings, clients, and account settings with fast access to key areas from every app screen.

## App Shell

- Platform: mobile app only (`layout: mobile`).
- Authenticated shell includes:
  - Optional top header area for page title and contextual actions.
  - Main scrollable content area.
  - Always-visible bottom menu fixed to the bottom edge.
- Bottom menu remains visible across all authenticated routes and respects safe-area insets.
- Content area must include bottom padding equal to bottom menu height to prevent overlap.

## Global Navigation

Bottom menu (persistent, touch-first):

| item | route | icon key | enabled rule | behavior |
| --- | --- | --- | --- | --- |
| Home | `/home` | `home` | always enabled | Opens Home dashboard |
| Training | `/training` | `training` | enabled only when a training is started (`activeTrainingId != null`) | Disabled item is visible but not tappable |
| Clients | `/clients` | `clients` | always enabled | Opens clients list |
| Settings | `/settings` | `settings` | always enabled | Opens settings |

Shared navigation rules:

- Active item state is based on current top-level route.
- Tapping the active item does not push a duplicate route.
- Disabled `Training` item shows disabled styling and hint text: `Start a training to open this tab`.
- Back behavior:
  - Android: system back returns within current stack; from a root tab it exits app.
  - iOS: root tab switch does not show back; pushed screens use native back navigation.

## Shared Layout Rules

- Mobile-first breakpoints: optimize for widths `320-480px`; scale spacing for larger phones/tablets.
- Spacing scale: `4, 8, 12, 16, 24`.
- Minimum tap target: `44x44`.
- Section-level add actions:
  - If a screen needs an `Add` action inside a section, use a compact `+` button instead of a full-width labeled button.
  - Place the `+` button in the section header row next to the section title.
  - Header row width split: title `85%`, add button `15%`.
  - Keep the `+` action visible in all non-blocking states (`default`, `empty`, `error`, `offline`), and only disable when the screen is in hard loading/blocked state.
- Bottom menu:
  - Fixed position.
  - Equal-width tap zones for four items.
  - Label + icon per item.
- Persistent save action:
  - Any view with a primary `Save` action must render it in a dedicated bottom action section, directly above the bottom menu.
  - Match the placement pattern used by `Settings` `Sign Out` (outside scrollable content).
  - Keep the button visible in all screen states; disable when rules require, but do not hide it.
- Offline connectivity messaging:
  - `offline` status info must be rendered in the top header as a warning indicator (`!`) on the right side.
  - Tapping the indicator opens a short explanation: `No internet connection`.
  - Do not render dedicated offline banners in content or above the bottom menu.
  - Offline messaging must not reflow or reposition primary actions (for example `Save`).
- Long text in navigation labels is not allowed; use single-word labels.

## Shared Components

- `BottomMenu`
  - Props: `activeRoute`, `activeTrainingId`.
  - Handles enabled/disabled logic for `Training`.
- `GlobalHeader`
  - Optional title, right-side contextual actions, and optional offline warning indicator (`!`) with tap explanation.
- `StatusBanner`
  - Reusable inline banners for `error` and `info` (offline uses header indicator).
- `LoadingSkeleton`
  - Shared skeleton pattern used during initial data fetches.

## Global UI States

- `default`: app shell loaded, bottom menu interactive per enablement rules.
- `loading`: render skeletons in content area; keep bottom menu visible.
- `error`: show non-blocking error banner in content; keep navigation available.
- `offline`: show header offline indicator (`!`); routes requiring network may disable primary actions.
- `disabled`: specifically for menu/actions that are visible but currently unavailable (for example `Training` tab before training start).

## Permissions / Roles

- Primary role: `trainer`.
- All bottom menu entries are available to authenticated trainers, with conditional availability on `Training`.
- If future roles are added (for example `assistant`), role-based route gating should be defined here and not duplicated in view specs.

## Naming Conventions

- Routes: lowercase kebab or flat paths for top-level tabs (`/home`, `/training`, `/clients`, `/settings`).
- View IDs: lowercase with dashes (example: `home`, `clients-list`, `training-details`).
- Action IDs: verb-first camelCase (example: `startTraining`, `openClientProfile`).
- State keys: lowercase (`default`, `loading`, `error`, `offline`, `disabled`).
