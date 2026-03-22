# Lovable Integration Guide

This is the contract the Lovable frontend should use against the AUR3M backend.

## Base URL

`https://aur3m-api-prod-hyd2dccqf2gugjf5.ukwest-01.azurewebsites.net`

## Authentication Flow

1. Call `POST /api/auth/signup` to create a user.
2. Call `POST /api/auth/login` to receive a JWT.
3. Send `Authorization: Bearer <token>` for authenticated endpoints.

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
    "membership": "silver",
    "current_tier": 1,
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

Success response:

```json
{
  "token": "jwt",
  "user": {
    "id": "guid",
    "email": "user@example.com",
    "username": "aurora1",
    "alias": "aurora1",
    "membership": "silver",
    "current_tier": 1
  }
}
```

### `GET /api/profile`

Requires bearer token.

Success response:

```json
{
  "alias": "Aurora",
  "membership": "silver",
  "current_tier": 1,
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
- `membership` defaults to `silver`.
- `current_tier` defaults to `1`.
- Speed-round matchmaking currently uses first-waiting-user pairing inside the same event.
- Payment checkout uses Stripe-hosted Checkout and returns a redirect URL.
