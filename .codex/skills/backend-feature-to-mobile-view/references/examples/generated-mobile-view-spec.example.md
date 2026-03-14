---
id: class-checkin
name: Class Check-In
route: /classes/:id/checkin
auth: coach
layout: standard
title: Class Check-In
description: Allow coach to check in class attendees while preserving duplicate/canceled-class backend rules.
---

## Purpose

Enable quick attendee check-in with deterministic feedback for duplicate check-in and canceled-class failures.

## Data Model

- `attendees[]`: `{ memberId, fullName, alreadyCheckedIn }`
- `selectedMemberId`: `string | null`
- `note`: `string` (max 160 chars)
- `submissionState`: `idle | submitting | success | error`

## API

- `GET /api/classes/{classId}/attendees`
- `POST /api/classes/{classId}/checkins`

## Actions

- `Select attendee` (enabled only for not-yet-checked-in members)
- `Submit check-in` (disabled when no attendee selected or when submitting)
- `Cancel` (navigate back to class details)

## Validation

- `memberId` required before submit.
- `note` max length 160.
- Duplicate check-in conflict from backend shown inline on selected attendee row.

## States

- `default`: attendee list loaded, no selection.
- `loading`: attendee list fetch or submit in progress.
- `empty`: no attendees available.
- `success`: check-in completed; show confirmation and navigate to class details.
- `error`: top banner for canceled class; inline row error for duplicate check-in.

## Navigation

- Success -> `/classes/:id`
- Cancel -> `/classes/:id`
- Canceled class error -> stay on page, block submit action

## Reusable Components

- `MemberRow` with `selected` and `alreadyCheckedIn` variants
- `InlineRowError`
- `BannerMessage`
- `PrimaryFooterButton`
