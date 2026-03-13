# Flow Name: Subscription Onboarding to First Value

## Goal

Move new users from sign-up to first successful project setup within their first session.

## Actors

- New User (primary)
- Lifecycle System (system actor)
- Support Agent (fallback actor)

## Preconditions

- User has a valid invitation link or direct sign-up entry.
- Email inbox is accessible for verification.

## Trigger / Entry Point

- User taps "Start Free Trial" on landing page.

## Success Outcomes

- User verifies email, creates workspace, and completes setup checklist.
- User performs first meaningful action (publishes first project item).

## Stages and Subflows

1. Account Creation and Verification
2. Workspace Setup and Personalization
3. Guided First Action
4. Drop-Off Detection and Recovery

## Main Flow

1. User signs up with email and password.
2. System sends verification email and shows pending-verification state.
3. User verifies email and returns to onboarding flow.
4. User names workspace and selects a starter template.
5. System configures workspace defaults based on template.
6. User completes checklist step to create first project item.
7. System confirms first-value milestone and schedules retention nudges.

## Alternative Flows

- `A1 - Social Sign-In Branch`: user signs up via OAuth and skips email verification stage.
- `A2 - Template Skip Branch`: user skips template selection and receives a generic setup path.
- `A3 - Team Invite Branch`: user invites teammates before first action; system shifts to collaborative setup checklist.

## Error / Edge Cases

- `E1 - Delayed Verification Email`: show resend option after cooldown and fallback support CTA.
- `E2 - Workspace Name Conflict`: inline validation with suggested available names.
- `E3 - User Abandons at Setup`: lifecycle system sends reminder notification and deep link back to unfinished stage.

## System Responses and Dependencies

- Identity Service handles sign-up, token issuance, and verification state.
- Workspace Service provisions starter configuration.
- Lifecycle Messaging triggers reminders on inactivity thresholds.

## Notes / Open Questions

- Should reminder timing differ for referral users vs direct sign-ups?
- Do we allow first action before invite completion in collaborative workspaces?

## Assumptions

- Verification emails are delivered within two minutes for most regions.
