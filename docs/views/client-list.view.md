---
id: client-list
name: ClientListView
route: /clients
auth: true
layout: mobile
title: Clients
description: Searchable clients list with quick add action and row-level navigation to client details.
---

# Clients

## Purpose

Allow trainers to quickly find a client by full name, open client details, and add a new client.

## User

Authenticated trainer managing their client base.

## Main Goals

- Add a new client.
- Search clients by full name.
- Open a selected client in `client-details` view.

## Sections

### 1. Add Client

- Purpose: Provide an immediate action to create a new client.
- Fields/Data Shown: none.
- Components: Compact add action button `+` (small button, `15%` width in the search/add row).
- Behavior:
  - On tap, navigate to new client creation flow.
- Rules:
  - Button is always visible at the top of the screen in the same row as search input.
  - Row width split: search input `85%`, add button `15%`.
  - Button remains enabled in all non-loading states.
- Empty State: n/a.

### 2. Clients List and Search

- Purpose: Let trainer find and open a client quickly.
- Fields/Data Shown: `searchQuery`, `clients[].id`, `clients[].fullName`.
- Components:
  - Search input with placeholder `Search clients`.
  - Vertical list of tappable rows.
  - Each row shows only `fullName`.
- Behavior:
  - On screen open, fetch clients list.
  - Typing in search filters list by `fullName` (case-insensitive, partial match).
  - Tapping a row navigates to `client-details` for selected `clientId`.
  - Pull-to-refresh reloads client list.
- Rules:
  - Do not display extra row metadata (email, phone, avatar, tags).
  - Sort visible rows by `fullName` ascending.
  - Preserve current `searchQuery` when returning from `client-details` in the same session.
- Empty State:
  - No clients in system: `No clients yet. Add your first client.`
  - No search matches: `No clients found.`

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| loadClients | n/a | Screen opens or pull-to-refresh | Fetch clients list |
| openAddClient | + | Tap add button | Navigate to `/clients/new` |
| updateClientSearch | n/a | User types in search input | Filter visible clients list |
| openClientDetails | Client row | Tap row | Navigate to `client-details` with selected `clientId` |

## Data Model

```json
{
  "searchQuery": "jan",
  "clients": [
    { "id": "cl_001", "fullName": "Jan Kowalski" },
    { "id": "cl_002", "fullName": "Joanna Nowak" },
    { "id": "cl_003", "fullName": "Kamil Zielinski" }
  ]
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/clients?query={query} | Load or search clients list | n/a | `{ clients: [{ id, fullName }] }` |

## States

### default

`+` add button is visible. Search input and non-empty clients list are interactive.

### loading

Show search input and `+` add button, plus loading skeleton rows for list content.

### empty

No clients available. Show empty-state message and keep `+` add button visible and enabled.

### error

Show inline error banner: `Could not load clients. Try again.` Keep search visible and allow pull-to-refresh retry.

### offline (optional)

Show offline banner. If cached clients exist, render cached list; otherwise show empty-state fallback. Disable pull-to-refresh until connectivity returns.

## Validation

- Field: `searchQuery`
- Rule: Trim leading/trailing spaces before filtering.
- Error message: n/a (sanitized automatically, no blocking validation).

- Field: `searchQuery`
- Rule: Max length `80` characters.
- Error message: `Search can contain up to 80 characters.`

## Edge Cases

- Two clients can have the same `fullName`; rows remain distinct by `id`.
- Very long names should truncate visually but remain fully readable in accessibility label.
- Client is deleted on another device; refresh removes stale row and keeps user on current screen.
- Search query with diacritics should still match normalized names when supported by backend/API.

## Navigation

- Entry point: `/clients` from bottom menu.
- `+` add button -> `/clients/new`.
- Client row tap -> `client-details` view (for example `/clients/{clientId}`).

## Notes

### Assumptions (if any)

- `client-details` and new-client creation views are defined in separate specs.
- API returns `fullName` already formatted for display.
