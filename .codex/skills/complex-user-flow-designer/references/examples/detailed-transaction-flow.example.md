# Flow Name: Marketplace Checkout with Risk Review and Manual Fulfillment Fallback

## Goal

Enable buyers to complete purchases reliably while protecting against payment and fraud failures.

## Actors

- Buyer
- Checkout Service
- Payment Gateway
- Risk Engine
- Inventory Service
- Support Agent

## Preconditions

- Buyer has at least one item in cart.
- Cart items pass initial availability checks.
- Buyer has at least one eligible payment method.

## Trigger / Entry Point

- Buyer selects "Checkout" from cart or reorder flow.

## Success Outcomes

- Payment is authorized.
- Risk policy is satisfied.
- Order is confirmed with ETA and receipt.

## Stages and Subflows

1. Checkout Initialization
2. Address and Delivery Confirmation
3. Payment Authorization and Risk Evaluation
4. Order Confirmation
5. Post-Checkout Exception Handling

## Main Flow

| Step | Actor | Action | System Response | Validation State | Dependency |
|---|---|---|---|---|---|
| 1 | Buyer | Opens checkout | Creates checkout session and snapshots cart | session_created | POST /api/checkout/session |
| 2 | Checkout Service | Prefills address and delivery options | Returns defaults and required field set | required_fields_ready | Profile Service |
| 3 | Buyer | Confirms address and selects delivery method | Recalculates totals and estimated delivery | address_valid, shipping_selected | Pricing and Shipping Services |
| 4 | Buyer | Selects payment method and submits order | Requests payment authorization | payment_submitted | POST /api/payments/authorize |
| 5 | Payment Gateway | Authorizes payment | Returns auth token or decline reason | payment_authorized or payment_declined | Gateway Provider |
| 6 | Checkout Service | Sends order context to risk engine | Evaluates policy and returns decision | risk_passed or risk_review_required | POST /api/risk/evaluate |
| 7 | Checkout Service | Confirms stock before finalization | Reserves inventory for successful decisions | inventory_reserved | Inventory Service |
| 8 | Checkout Service | Creates order and confirmation payload | Persists order and ETA | order_confirmed | POST /api/orders |
| 9 | System | Sends notifications | Delivers confirmation email and push | notification_sent | Notification Service |

## Alternative Flows

- `A1 - 3DS Challenge Required`
  - Condition: gateway requests cardholder challenge.
  - Path: checkout enters challenge state -> buyer completes challenge -> authorization retried -> return to risk evaluation.
- `A2 - Risk Review Branch`
  - Condition: risk decision is `review_required`.
  - Path: place order in pending review queue -> notify buyer about delay -> support/fraud analyst resolves -> continue to confirmation or cancellation.
- `A3 - Buyer Switches Payment Method`
  - Condition: authorization declined for current method.
  - Path: surface decline reason -> prompt alternate method -> rerun authorization and risk checks.
- `A4 - Guest to Account Upgrade`
  - Condition: buyer opts to save data post-purchase.
  - Path: complete order as guest -> offer account creation with prefilled profile -> link order history.

## Error / Edge Cases

- `E1 - Payment Timeout`
  - System response: mark attempt as pending, show retry countdown, and prevent duplicate charge submissions.
  - Recovery: retry authorization once automatically, then allow manual retry.
- `E2 - Inventory Conflict After Authorization`
  - System response: void payment authorization for unavailable items and refresh cart with alternatives.
  - Recovery: offer partial fulfillment or backorder branch.
- `E3 - Risk Engine Unavailable`
  - System response: route order to manual review queue and present delayed confirmation message.
  - Recovery: support agent can approve or cancel with buyer notification.
- `E4 - Notification Failure`
  - System response: keep in-app confirmation as source of truth and schedule notification retry job.
  - Recovery: expose order status in account timeline.
- `E5 - Empty Cart at Checkout Entry`
  - System response: redirect to cart empty state with recommendations.
  - Recovery: restore saved cart if available.

## System Responses and Dependencies

- Checkout session creation must be idempotent for refresh/retry scenarios.
- Payment authorization should include idempotency keys to prevent duplicate charges.
- Risk evaluation is required before final order creation unless fail-safe policy allows manual review fallback.
- Inventory reservation occurs after payment/risk checks to limit stale reservations.
- Support tooling must expose pending-review orders with SLA timers.

## Notes / Open Questions

- What is the maximum acceptable manual-review delay before cancellation?
- Do we support partial shipment when only some SKUs fail reservation?
- Should high-value repeat buyers bypass manual review under strict thresholds?

## Assumptions

- Payment provider supports idempotent authorization requests.
- Manual review queue is staffed during configured support hours.
