# AUR³M — Backend API Contract v3

> **Audience**: Backend / Codex team  
> **Frontend**: React + TypeScript, calls all endpoints via `fetch` with Bearer JWT  
> **Base URL**: `https://aur3m-api-prod-hyd2dccqf2gugjf5.ukwest-01.azurewebsites.net`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Profile](#2-profile)
3. [Speed Rounds](#3-speed-rounds)
4. [Post-Call: Feedback & Availability](#4-post-call-feedback--availability)
5. [Matches & Relationships](#5-matches--relationships)
6. [Thumbs-Up / Priority Interest](#6-thumbs-up--priority-interest)
7. [Members](#7-members)
8. [Calendar / Upcoming Calls](#8-calendar--upcoming-calls)
9. [Twilio Video](#9-twilio-video)
10. [Payments & Subscriptions](#10-payments--subscriptions)
11. [Gold Date Booking](#11-gold-date-booking)
12. [Business Logic Rules](#12-business-logic-rules)
13. [Suggested Database Schema](#13-suggested-database-schema)

---

## 1. Authentication

### POST `/api/auth/signup`

Create a new account. The backend assigns an anonymous alias.

**Request:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "gender": "male" | "female" | "non-binary" | "prefer-not-to-say",
  "age_bracket": "18-25" | "26-35" | "36-45" | "46-55" | "55+",
  "location": "string",
  "profession": "string",
  "interested_in": "men" | "women" | "both"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "username": "string",
    "display_name": "string",
    "membership": "free",
    "current_tier": 0,
    "created_at": "ISO-8601"
  }
}
```

### POST `/api/auth/login`

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "JWT string",
  "user": {
    "id": "uuid",
    "email": "string",
    "username": "string",
    "alias": "string",
    "membership": "free" | "silver" | "gold" | "platinum",
    "current_tier": 0
  }
}
```

### POST `/api/auth/forgot-password`

**Request:** `{ "email": "string" }`  
**Response:** `{ "success": true }`

### POST `/api/auth/reset-password`

**Request:** `{ "token": "string", "password": "string" }`  
**Response:** `{ "success": true }`

---

## 2. Profile

### GET `/api/profile`

Returns the authenticated user's profile.

**Response (200):**
```json
{
  "alias": "string",
  "membership": "silver",
  "current_tier": 1,
  "gender": "male",
  "age_bracket": "26-35",
  "location": "London",
  "profession": "Engineer"
}
```

### PATCH `/api/profile`

Update profile fields.

**Request:** `{ "age_bracket?": "string", "location?": "string" }`  
**Response:** Same as GET `/api/profile`.

---

## 3. Speed Rounds

### GET `/api/speed-rounds/upcoming`

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "string",
      "starts_at": "ISO-8601",
      "ends_at": "ISO-8601",
      "room_name": "string",
      "capacity": 50,
      "status": "scheduled" | "live" | "completed"
    }
  ]
}
```

### POST `/api/speed-rounds/join`

User joins an event. Backend matches them with another participant.

**Request:** `{ "event_id": "uuid" }`

**Response (200):**
```json
{
  "matched": true,
  "status": "matched",
  "session_id": "uuid",
  "room_name": "string"
}
```

If no match: `{ "matched": false, "status": "waiting" }`

### POST `/api/speed-rounds/decision`

Submit thumbs-up/down after a 3-min call.

**Request:** `{ "session_id": "uuid", "decision": "yes" | "pass" }`

**Response:**
```json
{
  "session_id": "uuid",
  "decision": "yes",
  "both_decided": true,
  "matched": true
}
```

---

## 4. Post-Call: Feedback & Availability

### POST `/api/speed-rounds/feedback`

Submit feedback after any call tier.

**Request:**
```json
{
  "session_id": "uuid",
  "was_professional": true | false | null,
  "felt_unsafe": true | false | null,
  "private_note": "string (max 500 chars)"
}
```

**Response:** `{ "success": true }`

### POST `/api/speed-rounds/availability`

Submit time-slot availability for the next follow-up call (15min or 60min).

**Request:**
```json
{
  "session_id": "uuid",
  "slots": [
    { "date": "2025-02-10", "period": "morning" | "afternoon" | "evening" }
  ]
}
```

**Response:** `{ "success": true, "slots_saved": 5 }`

**Backend logic:**
- When both users in a mutual match submit availability, intersect their slots.
- Map periods: morning → 10:00 AM, afternoon → 2:00 PM, evening → 6:00 PM.
- Auto-schedule a call (15min or 60min depending on current tier).
- Send confirmation email to both users.

---

## 5. Matches & Relationships

### GET `/api/matches`

All connections the user has had (regardless of outcome).

**Response:**
```json
{
  "matches": [
    {
      "connection_id": "uuid",
      "matched_at": "ISO-8601",
      "alias": "string",
      "tier": "3min" | "15min" | "60min" | "date",
      "decision_status": "yes" | "pass" | "pending"
    }
  ]
}
```

### GET `/api/relationships`

Active mutual connections progressing through the funnel.

**Response:**
```json
{
  "relationships": [
    {
      "id": "uuid",
      "partner_alias": "string",
      "stage": "3min" | "15min" | "60min" | "date",
      "started_at": "ISO-8601",
      "last_updated": "ISO-8601"
    }
  ]
}
```

**Stage transitions:**
- `3min` → `15min`: mutual "yes" after 3-min call + availability submitted + call scheduled
- `15min` → `60min`: mutual "yes" after 15-min call + availability submitted + call scheduled
- `60min` → `date`: mutual "yes" after 60-min call (triggers Gold date booking flow)

---

## 6. Thumbs-Up / Priority Interest

### GET `/api/thumbs-up`

**Response:**
```json
{
  "thumbs_up": ["user-id-1", "user-id-2"],
  "members": [
    { "id": "uuid", "username": "string", "alias": "string", "membership": "silver", ... }
  ]
}
```

### POST `/api/thumbs-up`

**Request:** `{ "to_user_id": "uuid" }`  
**Response:** `{ "success": true, "to_user_id": "uuid" }`

### DELETE `/api/thumbs-up/:toUserId`

**Response:** `{ "success": true, "to_user_id": "uuid" }`

---

## 7. Members

### GET `/api/members`

Browse all members with optional filters.

**Query params:** `gender`, `age_bracket`, `location` (all optional)

**Response:**
```json
{
  "members": [
    {
      "id": "uuid",
      "username": "string",
      "alias": "string",
      "membership": "silver",
      "current_tier": 1,
      "gender": "male",
      "age_bracket": "26-35",
      "location": "London",
      "profession": "Engineer"
    }
  ],
  "total_count": 142
}
```

---

## 8. Calendar / Upcoming Calls

### GET `/api/calendar/upcoming`

Returns scheduled follow-up calls (15min, 60min).

**Response:**
```json
{
  "upcoming": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "partner_alias": "string",
      "scheduled_at": "ISO-8601",
      "duration_minutes": 15 | 60,
      "call_type": "follow_up",
      "status": "scheduled" | "completed" | "cancelled",
      "room_name": "string"
    }
  ]
}
```

---

## 9. Twilio Video

### POST `/api/twilio/token`

Generate a Twilio access token for a video room.

**Request:** `{ "room_name": "string" }`

**Response:**
```json
{
  "token": "Twilio JWT",
  "room_name": "string"
}
```

---

## 10. Payments & Subscriptions

### POST `/api/payments/create-checkout`

Create a Stripe checkout session for a membership tier.

**Request:** `{ "tier": "silver" | "gold" | "platinum" }`  
**Response:** `{ "url": "https://checkout.stripe.com/..." }`

### GET `/api/payments/status`

**Response:**
```json
{
  "membership": "silver",
  "status": "active",
  "current_period_end": "ISO-8601",
  "cancel_at_period_end": false
}
```

### POST `/api/payments/cancel`

Cancel subscription at period end.  
**Response:** Same as GET `/api/payments/status`.

---

## 11. Gold Date Booking

These endpoints power the Gold date flow, triggered after a mutual "yes" on a 60-minute call.

### POST `/api/dates/create-payment`

Create a Stripe checkout session for the £200 date booking fee.

**Auth:** Bearer JWT (required)

**Request:**
```json
{
  "relationship_id": "uuid"
}
```

**Response (200):**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

**Errors:**
- `400` — Relationship not at `date` stage
- `409` — User has already paid for this date

**Backend logic:**
- Verify the relationship exists and is at the `date` stage.
- Verify the authenticated user is one of the two participants.
- Create a Stripe checkout session for £200 (one-time payment).
- Set `success_url` to redirect back to `/date/{relationship_id}`.
- On Stripe webhook `checkout.session.completed`: mark this user as paid.
- Start the 30-day refund timer from the moment the first user pays.

---

### GET `/api/dates/:relationshipId/payment-status`

Check whether both users have paid.

**Auth:** Bearer JWT (required)

**Response (200):**
```json
{
  "relationship_id": "uuid",
  "user_paid": true,
  "partner_paid": false,
  "both_paid": false,
  "payment_deadline": "ISO-8601"
}
```

| Field | Description |
|---|---|
| `user_paid` | Whether the authenticated user has completed payment |
| `partner_paid` | Whether the other participant has completed payment |
| `both_paid` | `true` only when both have paid — unlocks the calendar |
| `payment_deadline` | 30 days from first payment; auto-refund if `both_paid` is still `false` |

---

### POST `/api/dates/availability`

Submit evening availability slots for the date. Only callable once `both_paid` is `true`.

**Auth:** Bearer JWT (required)

**Request:**
```json
{
  "relationship_id": "uuid",
  "slots": [
    { "date": "2025-03-15", "time": "18:00" },
    { "date": "2025-03-15", "time": "18:30" },
    { "date": "2025-03-16", "time": "19:00" },
    { "date": "2025-03-16", "time": "19:30" }
  ]
}
```

**Slot constraints:**
| Rule | Value |
|---|---|
| Allowed times | `18:00`, `18:30`, `19:00`, `19:30` only |
| Date window | 7 to 30 days from today |
| Min slots | 1 |

**Response (200):**
```json
{
  "success": true,
  "slots_saved": 4
}
```

**Errors:**
- `400` — Slots outside allowed window or invalid time
- `403` — Both users haven't paid yet
- `409` — User already submitted availability

**Backend logic:**
- When both users have submitted: intersect their slots.
- If a match is found: create a `DateBooking` record, pick the earliest common slot, send confirmation emails to both, and mark the relationship as `booked`.
- If no match: notify both users and allow re-submission within 7 days.

---

### GET `/api/dates/:relationshipId/booking`

Retrieve the confirmed date booking.

**Auth:** Bearer JWT (required)

**Response (200):**
```json
{
  "id": "uuid",
  "relationship_id": "uuid",
  "scheduled_at": "ISO-8601",
  "venue": "The Ivy, Covent Garden",
  "status": "confirmed" | "completed" | "cancelled"
}
```

**Response (404):** No booking exists yet (still awaiting slot match).

---

## 12. Business Logic Rules

### Relationship State Machine

```
3min ──(mutual yes)──▶ 15min ──(mutual yes)──▶ 60min ──(mutual yes)──▶ date
  │                      │                       │                      │
  ▼                      ▼                       ▼                      ▼
 END                    END                     END                   BOOK
```

- **Up or out**: pairs cannot repeat a tier. If either passes, the relationship ends.
- **Duplicate prevention**: two users who've already had a 3-min call cannot be re-matched in a speed round.

### Slot Matching Algorithm (Follow-Up Calls)

1. Both users submit `TimeSlot[]` with `date` + `period`.
2. Compute intersection: slots where both users are available.
3. Map period to time: morning → 10:00, afternoon → 14:00, evening → 18:00.
4. Pick the earliest common slot.
5. Create a Twilio room, schedule the call, notify both via email.

### Gold Date Slot Matching

1. Both users pay £200.
2. Both submit `EveningSlot[]` with `date` + `time` (18:00–19:30 range).
3. Compute intersection of `{date, time}` pairs.
4. Pick the earliest common slot.
5. Assign a venue (from a curated restaurant list based on both users' locations).
6. Send confirmation email with: date, time, venue name + address, partner's first name only.
7. Mark booking as `confirmed`.

### Auto-Refund Logic

- If only one user pays within 30 days of the first payment, issue a full refund via Stripe.
- Cron job or scheduled task checks daily for unmatched payments past deadline.

### Email Notifications

| Trigger | Recipients | Content |
|---|---|---|
| Follow-up call scheduled | Both users | Date, time, duration, join link |
| Date payment received | Payer | Confirmation, waiting-for-partner message |
| Both paid | Both users | Calendar now open, pick slots prompt |
| Date booked | Both users | Date, time, venue, partner's first name |
| Refund issued | Payer | Refund confirmation, amount |

---

## 13. Suggested Database Schema

### Core Tables

```sql
-- Users (extends auth.users)
users (id, email, username, alias, gender, age_bracket, location, profession, interested_in, membership, current_tier, created_at)

-- Sessions (3min speed rounds)
sessions (id, event_id, user_a_id, user_b_id, started_at, ended_at, status)

-- Decisions
decisions (id, session_id, user_id, decision, created_at)

-- Feedback
feedback (id, session_id, user_id, was_professional, felt_unsafe, private_note, created_at)

-- Availability Slots (for follow-up calls)
availability_slots (id, session_id, user_id, date, period, created_at)

-- Scheduled Calls
scheduled_calls (id, session_id, user_a_id, user_b_id, scheduled_at, duration_minutes, call_type, status, room_name)

-- Relationships (funnel tracker)
relationships (id, user_a_id, user_b_id, stage, started_at, last_updated)

-- Thumbs Up
thumbs_up (id, from_user_id, to_user_id, created_at)
```

### Gold Date Tables

```sql
-- Date Payments
date_payments (
  id UUID PRIMARY KEY,
  relationship_id UUID REFERENCES relationships(id),
  user_id UUID REFERENCES users(id),
  stripe_session_id TEXT,
  amount_cents INTEGER DEFAULT 20000,
  status TEXT DEFAULT 'pending',  -- pending | paid | refunded
  paid_at TIMESTAMPTZ,
  refund_deadline TIMESTAMPTZ,    -- 30 days from first payment in this relationship
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Date Availability Slots
date_availability (
  id UUID PRIMARY KEY,
  relationship_id UUID REFERENCES relationships(id),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  time TEXT NOT NULL,              -- '18:00' | '18:30' | '19:00' | '19:30'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(relationship_id, user_id, date, time)
)

-- Date Bookings
date_bookings (
  id UUID PRIMARY KEY,
  relationship_id UUID REFERENCES relationships(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  venue_address TEXT,
  status TEXT DEFAULT 'confirmed', -- confirmed | completed | cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Indexes

```sql
CREATE INDEX idx_date_payments_rel ON date_payments(relationship_id);
CREATE INDEX idx_date_payments_refund ON date_payments(status, refund_deadline) WHERE status = 'paid';
CREATE INDEX idx_date_availability_rel ON date_availability(relationship_id);
CREATE INDEX idx_date_bookings_rel ON date_bookings(relationship_id);
```

---

## Error Format

All error responses use:

```json
{
  "error": "Human-readable error message"
}
```

HTTP status codes: `400` (bad request), `401` (unauthorized), `403` (forbidden), `404` (not found), `409` (conflict), `500` (server error).

---

*Document version: v3 — updated 2026-03-22*
