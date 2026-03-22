# Lovable Integration Guide

This is the contract the Lovable frontend should use against the AUR3M backend.

## Base URL

`https://aur3m-api-prod-hyd2dccqf2gugjf5.ukwest-01.azurewebsites.net`

## Authentication Flow

1. Call `POST /api/auth/signup` to create a user.
2. Call `POST /api/auth/login` to receive a JWT.
3. Use `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` for password recovery.
4. Send `Authorization: Bearer <token>` for authenticated endpoints.

## Endpoints

### `POST /api/auth/signup`

Request body:

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "gender": "male|female|non-binary|prefer-not-to-say",
  "age_bracket": "18-25|26-35|36-45|46-55|55+",
  "location": "string",
  "profession": "string",
  "interested_in": "men|women|both"
}
```

Success response:

```json
{
  "user": {
    "id": "guid",
    "email": "user@example.com",
    "username": "aurora1",
    "display_name": "aurora1",
    "membership": "free",
    "current_tier": 0,
    "created_at": "2026-03-21T22:32:52.511Z"
  }
}
```

### `POST /api/auth/login`

Request body:

```json
{
  "email": "string",
  "password": "string"
}
```

### `POST /api/auth/forgot-password`

Request body:

```json
{
  "email": "user@example.com"
}
```

Success response:

```json
{
  "success": true
}
```

If the account exists, the backend sends a reset email with a link in this format:

`https://aur3m.com/reset-password?token=<token>`

### `POST /api/auth/reset-password`

Request body:

```json
{
  "token": "reset-token-from-email",
  "password": "new-password"
}
```

Success response:

```json
{
  "success": true
}
```

Success response:

```json
{
  "token": "jwt",
  "user": {
    "id": "guid",
    "email": "user@example.com",
    "username": "aurora1",
    "alias": "aurora1",
    "membership": "free",
    "current_tier": 0
  }
}
```

### `GET /api/profile`

Requires bearer token.

Success response:

```json
{
  "alias": "Aurora",
  "membership": "free",
  "current_tier": 0,
  "gender": "female",
  "age_bracket": "26-35",
  "location": "London",
  "profession": "Designer"
}
```

### `GET /api/members`

Optional query params:

- `gender`
- `age_bracket`
- `location`

Example:

`GET /api/members?gender=female&age_bracket=26-35&location=London`

Success response:

```json
{
  "members": [
    {
      "id": "guid",
      "username": "aurora1",
      "alias": "Aurora",
      "membership": "free",
      "current_tier": 0,
      "gender": "female",
      "age_bracket": "26-35",
      "location": "London",
      "profession": "Designer"
    }
  ],
  "total_count": 1234
}
```

### `GET /api/thumbs-up`

Requires bearer token.

Success response:

```json
{
  "thumbs_up": ["guid-1", "guid-2"],
  "members": [
    {
      "id": "guid-1",
      "username": "member1",
      "alias": "Member One",
      "membership": "silver",
      "current_tier": 1,
      "gender": "female",
      "age_bracket": "26-35",
      "location": "London",
      "profession": "Designer"
    }
  ]
}
```

### `POST /api/thumbs-up`

Requires bearer token.

Request body:

```json
{
  "to_user_id": "guid"
}
```

Success response:

```json
{
  "success": true,
  "to_user_id": "guid"
}
```

### `DELETE /api/thumbs-up/{to_user_id}`

Requires bearer token.

Success response:

```json
{
  "success": true,
  "to_user_id": "guid"
}
```

### `GET /api/speed-rounds/upcoming`

Success response:

```json
{
  "events": [
    {
      "id": "guid",
      "title": "AUR3M Launch Speed Round",
      "starts_at": "2026-03-21T23:59:41.001Z",
      "ends_at": "2026-03-22T00:59:41.001Z",
      "room_name": "sr-launch-001",
      "capacity": 100,
      "status": "scheduled"
    }
  ]
}
```

### `POST /api/speed-rounds/join`

Requires bearer token.

Request body:

```json
{
  "event_id": "guid"
}
```

Waiting response:

```json
{
  "matched": false,
  "status": "waiting"
}
```

Matched response:

```json
{
  "matched": true,
  "session_id": "guid",
  "room_name": "sr-launch-001-abc12345-def67890"
}
```

### `POST /api/speed-rounds/decision`

Requires bearer token.

Request body:

```json
{
  "session_id": "guid",
  "decision": "yes"
}
```

Success response:

```json
{
  "session_id": "guid",
  "decision": "yes",
  "both_decided": true,
  "matched": true
}
```

### `POST /api/speed-rounds/feedback`

Requires bearer token.

Request body:

```json
{
  "session_id": "guid",
  "was_professional": true,
  "felt_unsafe": false,
  "private_note": "Seemed genuine, interesting conversation about travel."
}
```

Success response:

```json
{
  "success": true,
  "session_id": "guid"
}
```

### `POST /api/speed-rounds/availability`

Requires bearer token.

Request body:

```json
{
  "session_id": "guid",
  "slots": [
    { "date": "2026-03-24", "period": "morning" },
    { "date": "2026-03-24", "period": "evening" }
  ]
}
```

Success response:

```json
{
  "success": true,
  "session_id": "guid",
  "slots_saved": 2
}
```

### `POST /api/speed-rounds/match-slots`

Internal endpoint only.

Requires header:

`x-aur3m-internal-key: <INTERNAL_API_KEY>`

Request body:

```json
{
  "session_id": "guid"
}
```

Success response:

```json
{
  "success": true,
  "session_id": "guid",
  "result": {
    "status": "scheduled"
  }
}
```

### `GET /api/matches`

Requires bearer token.

Success response:

```json
{
  "matches": [
    {
      "connection_id": "guid",
      "matched_at": "2026-03-21T23:09:04.646Z",
      "alias": "aurora3",
      "tier": "silver",
      "decision_status": "yes"
    }
  ]
}
```

### `GET /api/calendar/upcoming`

Requires bearer token.

Success response:

```json
{
  "upcoming": [
    {
      "id": "guid",
      "session_id": "guid",
      "partner_alias": "Aurora",
      "scheduled_at": "2026-03-26T17:00:00.000Z",
      "duration_minutes": 15,
      "call_type": "video",
      "status": "scheduled",
      "room_name": "sr-followup-abc123"
    }
  ]
}
```

### `PATCH /api/calendar/{id}`

Requires bearer token.

Request body for reschedule:

```json
{
  "action": "reschedule",
  "new_date": "2026-03-28",
  "new_period": "afternoon"
}
```

Request body for cancel:

```json
{
  "action": "cancel"
}
```

Success response:

```json
{
  "success": true,
  "id": "guid",
  "status": "rescheduled"
}
```

### `GET /api/relationships`

Requires bearer token.

Success response:

```json
{
  "relationships": [
    {
      "id": "guid",
      "partner_alias": "Aurora",
      "stage": "scheduled_15min",
      "started_at": "2026-03-22T14:00:00.000Z",
      "last_updated": "2026-03-22T15:30:00.000Z"
    }
  ]
}
```

### `GET /api/relationships/{id}/notes`

Requires bearer token.

Returns only the authenticated user's private notes.

Success response:

```json
{
  "notes": [
    {
      "id": "guid",
      "stage": "speed_round_done",
      "note": "Seemed genuine, interesting conversation about travel.",
      "created_at": "2026-03-22T14:05:00.000Z"
    }
  ]
}
```

### `POST /api/payments/create-checkout`

Requires bearer token.

Request body:

```json
{
  "tier": "silver"
}
```

Success response:

```json
{
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

### `GET /api/payments/status`

Requires bearer token.

Success response:

```json
{
  "membership": "silver",
  "status": "active",
  "current_period_end": "2026-04-22T00:00:00.000Z",
  "cancel_at_period_end": false
}
```

### `POST /api/payments/cancel`

Requires bearer token.

Silver subscriptions only.

Success response:

```json
{
  "membership": "silver",
  "status": "active",
  "current_period_end": "2026-04-22T00:00:00.000Z",
  "cancel_at_period_end": true
}
```

### `POST /api/payments/webhook`

Stripe-only webhook endpoint.

No frontend JWT required.

On `checkout.session.completed`, the backend:

- upgrades the user membership
- updates `current_tier` to match the paid plan
- stores Stripe customer/subscription identifiers
- sends a thank-you email via Resend

### `POST /api/twilio/token`

Requires bearer token.

Request body:

```json
{
  "room_name": "sr-launch-001-abc12345-def67890"
}
```

Success response:

```json
{
  "token": "twilio-jwt",
  "room_name": "sr-launch-001-abc12345-def67890"
}
```

## Frontend Notes

- Store the login JWT securely in the frontend session layer.
- Send the JWT as `Authorization: Bearer <token>`.
- The backend currently uses `display_name` as the public alias.
- `membership` defaults to `free`.
- `current_tier` defaults to `0`.
- Speed-round matchmaking currently uses first-waiting-user pairing inside the same event.
- Payment checkout uses Stripe-hosted Checkout and returns a redirect URL.
- Follow-up slot scheduling currently treats submitted `date` + `period` values as UTC period start times.
- `POST /api/speed-rounds/match-slots` is protected with `x-aur3m-internal-key`; it is not intended for browser use.
