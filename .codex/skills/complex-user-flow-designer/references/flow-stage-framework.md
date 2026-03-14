# Flow Stage Framework

Use this framework to break complex journeys into coherent stages and subflows.

## Stage Definition

Each stage should define:

- user intent
- actor(s)
- trigger/entry
- core actions
- system responsibilities
- exit conditions

## Core Stage Pattern

Use and adapt these stage archetypes:

1. `Discover / Enter`
2. `Qualify / Configure`
3. `Commit / Submit`
4. `Process / Await Outcome`
5. `Resolve / Confirm`
6. `Post-Outcome Retention`

## Subflow Identification Rules

Create subflows when any of these are true:

- A decision point changes next steps significantly.
- A different actor takes over (cross-role handoff).
- A backend process becomes asynchronous (pending, review, webhook).
- A policy/risk/compliance rule can block progression.
- A fallback route exists (retry, manual support, defer, abandon).

## Decision Point Modeling

For each decision point, capture:

- condition being evaluated
- owner of decision (user, system, or external service)
- branches and next stage per branch
- impact on success metrics or downstream state

## Cross-Role Interaction Pattern

When multiple roles are involved:

- define source role action
- define handoff artifact (request, task, notification, queue item)
- define recipient role decision/action
- define timeout/escalation behavior
- define closure feedback to original role

## Cross-Feature Interaction Pattern

When flow spans features:

- list feature boundaries explicitly
- mark transition triggers between features
- keep data/state handoff explicit
- identify ownership of each handoff state

## Failure and Recovery Pattern

For each critical stage, include:

- likely failure modes
- user-visible feedback
- recovery action options
- terminal fallback if recovery fails
