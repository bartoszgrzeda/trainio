---
id: home
name: HomeScreen
route: /home
auth: true
layout: mobile
title: Trainer Home
description: Dashboard for trainer daily priorities and quick actions.
---

# Trainer Home

## Purpose

Give trainers one place to see next sessions, client alerts, and quick actions.

## User

Authenticated trainer after login.

## Main Goals

- Review today's sessions quickly.
- Open highest-priority client tasks.

## Sections

### 1. Upcoming Sessions

- Purpose: Show next scheduled sessions.
- Fields/Data Shown: time, clientName, sessionType, status.
- Components: horizontal card list.
- Behavior: tap card opens session details.
- Rules: show maximum 5 sessions.
- Empty State: "No sessions today" with CTA to open calendar.

### 2. Client Alerts

- Purpose: Highlight clients needing attention.
- Fields/Data Shown: clientName, alertType, severity.
- Components: alert list with severity badge.
- Behavior: tap item opens client profile.
- Rules: order by severity descending.
- Empty State: "No alerts" confirmation state.

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| open-calendar | Open Calendar | Tap "Calendar" button | Navigate to `/calendar` |
| start-session | Start Session | Tap session card primary action | Navigate to `/sessions/:id/start` |

## Data Model

```json
{
  "sessions": [
    {
      "id": "s1",
      "time": "09:00",
      "clientName": "Alice",
      "sessionType": "Strength",
      "status": "scheduled"
    }
  ],
  "alerts": [
    {
      "id": "a1",
      "clientName": "Bob",
      "alertType": "Missed check-in",
      "severity": "high"
    }
  ]
}
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/home/dashboard | Load dashboard cards and alerts | n/a | Dashboard payload |

## States

### default

Sessions and alerts loaded and visible.

### loading

Show skeleton cards for sessions and alerts.

### empty

No sessions and no alerts; show recovery actions.

### error

Show inline error banner and "Retry" action.

## Edge Cases

- API returns sessions without client name -> show "Unknown Client".
- Alert points to archived client -> hide alert and log metric.

## Navigation

Screen-level navigation only: calendar, session details, client profile.

## Notes

Do not include app-level tab bar behavior in this file.
