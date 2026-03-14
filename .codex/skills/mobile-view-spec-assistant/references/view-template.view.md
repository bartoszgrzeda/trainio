---
id: <screen-id>
name: <ScreenName>
route: </route>
auth: true
layout: mobile
title: <Title>
description: <Short description>
---

# <Screen Title>

## Purpose

Short explanation of what the screen is for.

## User

Who uses this screen and in what context.

## Main Goals

- Goal 1
- Goal 2

## Sections

### 1. <Section Name>

- Purpose:
- Fields/Data Shown:
- Components:
- Behavior:
- Rules:
- Empty State:

### 2. <Section Name>

- Purpose:
- Fields/Data Shown:
- Components:
- Behavior:
- Rules:
- Empty State:

## Actions

| actionId | label | trigger | result |
| --- | --- | --- | --- |
| <action-id> | <Button/Link Text> | <User event> | <System result> |

## Data Model

Example payloads used by this screen.

```json
{
  "id": "example-id",
  "name": "Example",
  "status": "active"
}
```

```json
[
  {
    "id": "item-1",
    "label": "First item"
  }
]
```

## API

| method | endpoint | purpose | request | response |
| --- | --- | --- | --- | --- |
| GET | /api/example | Load screen data | n/a | List of items |
| PATCH | /api/example/:id | Update editable data | Partial payload | Updated item |

## States

### default

Describe expected populated state.

### loading

Describe loading indicators and temporary UI behavior.

### empty

Describe empty-state UI and recovery actions.

### error

Describe error feedback and retry behavior.

### success (optional)

Describe transient success feedback after critical actions.

### disabled (optional)

Describe disabled controls and why they are disabled.

### offline (optional)

Describe behavior when network is unavailable.

## Validation

Only include this section when the screen has forms or editable fields.

- Field:
- Rule:
- Error message:

## Edge Cases

- Important business edge case 1
- Important business edge case 2

## Navigation

Screen-specific navigation only.
Do not include global bottom navigation or shared shell behavior unless this screen has exceptional behavior tied to it.

## Notes

Extra implementation or UX notes.

### Assumptions (if any)

- Assumption 1
- Assumption 2
