---
id: app-shell
name: AppLevelSpec
title: App Shell and Shared Rules
description: Global mobile app architecture, layout, navigation, and reusable UI constraints.
---

# App-Level Specification

## Purpose

Define shared mobile behavior that should never be duplicated in individual `*.view.md` files.

## App Shell

- Root view uses safe-area insets on all authenticated screens.
- Shared top header shows screen title and optional right action slot.
- Global bottom tab bar stays persistent on main routes.

## Global Navigation

- Main tabs: Home (`/home`), Clients (`/clients`), Calendar (`/calendar`), Settings (`/settings`).
- Deep-link entry routes must resolve to an authenticated stack screen.
- Back action pops stack before switching tabs.

## Shared Layout Rules

- Base spacing scale: `4, 8, 12, 16, 24`.
- Scroll containers use pull-to-refresh on list screens.
- Sticky headers are allowed for list and detail views only.

## Shared Components

- `PrimaryButton`, `SecondaryButton`, `StatusBadge`, `EmptyStateCard`.
- Shared error banner with retry action.
- Shared full-screen loading skeleton.

## Design Constraints

- Minimum touch target: 44x44.
- Truncate text to 2 lines in cards; use ellipsis.
- Avoid rendering more than 20 heavy cards on initial load.

## Global States

- App-level loading gate while auth/session is restoring.
- Offline banner shown globally when network is unavailable.
- Maintenance mode route blocks non-critical actions.

## Permissions / Roles

- `trainer`: full access to clients, sessions, and calendar.
- `assistant`: read-only on client plans, no session-start actions.

## Naming Conventions

- Screen IDs: kebab-case (example: `clients-list`).
- Route paths: lowercase with dashes.
- Action IDs: verb-noun (example: `open-calendar`).

## Notes

Screen specs may reference these shared rules but must not duplicate this content.
