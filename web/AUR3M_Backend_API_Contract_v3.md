# AUR³M Backend API Contract v3

**Base URL:** `https://aur3m-api-prod-hyd2dccqf2gugjf5.ukwest-01.azurewebsites.net`

**Auth:** Bearer token in `Authorization` header (except signup/login).

**Error format:** `{ "error": "message" }`

---

## 1. Authentication

### POST /api/auth/signup
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
    "created_at": "ISO8601"
  }
}
```

### POST /api/auth/login
**Request:** `{ "email": "string", "password": "string" }`
**Response (200):**
```json
{
  "token": "jwt",
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

### POST /api/auth/forgot-password
**Request:** `{ "email": "string" }`
**Response (200):** `{ "success": true }`

### POST /api/auth/reset-password
**Request:** `{ "token": "string", "password": "string" }`
**Response (200):** `{ "success": true }`

---

## 2. Profile

### GET /api/profile
**Response (200):**
```json
{
  "alias": "string",
  "membership": "free",
  "current_tier": 0,
  "gender": "male",
  "age_bracket": "26-35",
  "location": "London",
  "profession": "string"
}
```

### PATCH /api/profile
**Request:** `{ "age_bracket?": "string", "location?": "string" }`
**Response (200):** Full `Profile` object.

---

## 3. Members

### GET /api/members
**Query params:** `gender`, `age_bracket`, `location`, `limit` (default 100, max 1000), `offset` (default 0) — all optional
**Response (200):**
```json
{
  "members": [
    {
      "id": "uuid",
      "username": "string",
      "alias": "string",
      "membership": "silver",
      "current_tier": 1,
      "gender": "female",
      "age_bracket": "26-35",
      "location": "London",
      "profession": "string"
    }
  ],
  "total_count": 42
}
```

---

## 4. Thumbs-Up / Priority Interest

### GET /api/thumbs-up
**Response (200):**
```json
{
  "thumbs_up": ["user_id_1", "user_id_2"],
  "members": [ /* MemberSummary[] */ ]
}
```

### POST /api/thumbs-up
**Request:** `{ "to_user_id": "uuid" }`
**Response (201):** `{ "success": true, "to_user_id": "uuid" }`

### DELETE /api/thumbs-up/:toUserId
**Response (200):** `{ "success": true, "to_user_id": "uuid" }`

---

## 5. Speed Rounds

### GET /api/speed-rounds/upcoming
**Response (200):**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "string",
      "starts_at": "ISO8601",
      "ends_at": "ISO8601",
      "room_name": "string",
      "capacity": 50,
      "status": "scheduled"
    }
  ]
}
```

### POST /api/speed-rounds/enter-lobby
Called when a user opens the lobby page (before they start matching). Registers their presence so other users can see them in the lobby list. Should be idempotent — calling it again just updates a heartbeat timestamp.
**Request:** `{ "event_id": "uuid" }`
**Response (200):**
```json
{ "success": true }
```

### POST /api/speed-rounds/leave-lobby
Called when a user navigates away from the lobby page. Removes them from the lobby list.
**Request:** `{ "event_id": "uuid" }`
**Response (200):**
```json
{ "success": true }
```

### GET /api/speed-rounds/lobby?event_id=uuid
Returns two lists: users browsing the lobby (entered but not yet matching) and users actively matching (called `/join` but not yet paired). Users who are already in an active session should not appear in either list.
**Response (200):**
```json
{
  "lobby_users": [
    {
      "id": "uuid",
      "alias": "string",
      "gender": "male",
      "age_bracket": "26-35",
      "joined_at": "ISO8601"
    }
  ],
  "matching_users": [
    {
      "id": "uuid",
      "alias": "string",
      "gender": "male",
      "age_bracket": "26-35",
      "joined_at": "ISO8601"
    }
  ],
  "total_lobby": 3,
  "total_matching": 2
}
```

### POST /api/speed-rounds/join
**Request:** `{ "event_id": "uuid" }`
**Response (200):**
```json
{
  "matched": true,
  "status": "paired",
  "session_id": "uuid",
  "room_name": "string"
}
```

### POST /api/speed-rounds/decision
**Request:** `{ "session_id": "uuid", "decision": "yes" | "pass" }`
**Response (200):**
```json
{
  "session_id": "uuid",
  "decision": "yes",
  "both_decided": true,
  "matched": true
}
```

---

## 6. Post-Call Feedback & Scheduling

### POST /api/speed-rounds/feedback
**Request:**
```json
{
  "session_id": "uuid",
  "was_professional": true,
  "felt_unsafe": false,
  "private_note": "string"
}
```
**Response (200):** `{ "success": true }`

### POST /api/speed-rounds/availability
**Request:**
```json
{
  "session_id": "uuid",
  "slots": [
    { "date": "2025-04-15", "period": "morning" | "afternoon" | "evening" }
  ]
}
```
**Response (200):** `{ "success": true, "slots_saved": 3 }`

---

## 7. Calendar

### GET /api/calendar/upcoming
**Response (200):**
```json
{
  "upcoming": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "partner_alias": "string",
      "scheduled_at": "ISO8601",
      "duration_minutes": 15,
      "call_type": "15min" | "60min",
      "status": "scheduled",
      "room_name": "string"
    }
  ]
}
```

---

## 8. Relationships

### GET /api/relationships
**Response (200):**
```json
{
  "relationships": [
    {
      "id": "uuid",
      "partner_alias": "string",
      "stage": "3min" | "15min" | "60min" | "date",
      "started_at": "ISO8601",
      "last_updated": "ISO8601"
    }
  ]
}
```

---

## 9. Payments & Subscriptions

### POST /api/payments/create-checkout
**Request:** `{ "tier": "silver" | "gold" | "platinum" }`
**Response (200):** `{ "url": "https://checkout.stripe.com/..." }`

### GET /api/payments/status
**Response (200):**
```json
{
  "membership": "silver",
  "status": "active",
  "current_period_end": "ISO8601",
  "cancel_at_period_end": false
}
```

### POST /api/payments/cancel
**Response (200):** Full `PaymentStatus` object with `cancel_at_period_end: true`.

---

## 10. Twilio Video

### POST /api/twilio/token
**Request:** `{ "room_name": "string" }`
**Response (200):** `{ "token": "jwt", "room_name": "string" }`

---

## 11. Gold Date Booking

### POST /api/dates/create-payment
Initiates a Stripe Checkout session for the £200 date booking fee.

**Request:**
```json
{ "relationship_id": "uuid" }
```
**Response (200):**
```json
{ "url": "https://checkout.stripe.com/..." }
```
**Errors:** `403` if relationship stage ≠ `date`, `409` if already paid.

### GET /api/dates/:relationshipId/payment-status
Returns payment state for both users.

**Response (200):**
```json
{
  "relationship_id": "uuid",
  "user_paid": true,
  "partner_paid": false,
  "both_paid": false,
  "payment_deadline": "ISO8601"
}
```
`payment_deadline` = 30 days after first payment. Auto-refund if only one pays by deadline.

### POST /api/dates/availability
Submit evening availability. Only callable when `both_paid = true`.

**Request:**
```json
{
  "relationship_id": "uuid",
  "slots": [
    { "date": "2025-05-10", "time": "18:00" },
    { "date": "2025-05-10", "time": "19:00" }
  ]
}
```
**Constraints:**
- `time` must be one of: `18:00`, `18:30`, `19:00`, `19:30`
- `date` must be 7–30 days from today
- Minimum 3 slots required

**Response (200):** `{ "success": true, "slots_saved": 2 }`

**Slot matching logic:** When both users have submitted, the backend intersects their slots, picks the earliest match, assigns a venue, and sends confirmation emails.

### GET /api/dates/:relationshipId/booking
Returns the confirmed date (available after slot matching succeeds).

**Response (200):**
```json
{
  "id": "uuid",
  "relationship_id": "uuid",
  "scheduled_at": "ISO8601",
  "venue": "The Ivy Chelsea Garden",
  "venue_address": "197 King's Road, London SW3 5EQ",
  "partner_first_name": "Charlotte",
  "status": "confirmed" | "completed" | "cancelled"
}
```

| Field | Type | Description |
|---|---|---|
| `venue` | string | Venue name |
| `venue_address` | string | Full street address |
| `partner_first_name` | string | Partner's real first name only (shown on confirmation page; the platform never shares any other personal details) |
| `status` | enum | `confirmed` → upcoming, `completed` → past, `cancelled` → cancelled |

**Privacy note:** The platform stores verified identity data internally but **never reveals or exchanges personal details** between users. First names are shown on the confirmation page for practical purposes only. Any exchange of contact information is the users' own decision, made in person.

**Frontend route:** `/date/:relationshipId/confirmed` — the date confirmation page displays venue details, a Google Maps link, partner's first name with initial avatar, and safety/privacy guidelines. The booking page (`/date/:relationshipId`) auto-redirects here when a confirmed booking exists.

### Database Tables

```sql
CREATE TABLE date_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES relationships(id),
  user_id UUID NOT NULL REFERENCES users(id),
  stripe_session_id TEXT NOT NULL,
  amount_pence INT NOT NULL DEFAULT 20000,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | refunded
  paid_at TIMESTAMPTZ,
  refund_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE date_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES relationships(id),
  user_id UUID NOT NULL REFERENCES users(id),
  slot_date DATE NOT NULL,
  slot_time TEXT NOT NULL CHECK (slot_time IN ('18:00','18:30','19:00','19:30')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(relationship_id, user_id, slot_date, slot_time)
);

CREATE TABLE date_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES relationships(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE date_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES relationships(id),
  user_id UUID NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  highlight TEXT NOT NULL CHECK (highlight IN ('conversation','chemistry','venue','overall_vibe')),
  private_note TEXT DEFAULT '',
  felt_unsafe BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(relationship_id, user_id)
);

CREATE INDEX idx_date_payments_refund ON date_payments(refund_deadline)
  WHERE status = 'paid';
CREATE INDEX idx_date_feedback_relationship ON date_feedback(relationship_id);
```

---

## 12. Post-Date Feedback

### POST /api/dates/feedback
Submit feedback after a completed Gold Date. Each user can rate the experience and flag safety concerns.

> **Privacy principle:** The platform **never shares, reveals, or exchanges personal details** between users. Identity data collected during verification is stored internally for safety and compliance only. If users wish to exchange contact information, they do so in person — the platform plays no role.

**Request:**
```json
{
  "relationship_id": "uuid",
  "rating": 4,
  "highlight": "conversation" | "chemistry" | "venue" | "overall_vibe",
  "private_note": "string (max 500 chars, optional)",
  "felt_unsafe": false
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Business rules:**
- Only callable when `date_bookings.status = 'completed'` for this relationship
- One submission per user per relationship (unique constraint)
- `felt_unsafe: true` flags the other user's account for review within 24 hours
- `private_note` is visible only to AUR³M staff, never to the other user
- No contact details are ever exchanged through the platform

**Frontend route:** `/date/:relationshipId/feedback` — accessible from the confirmation page once the date status is `completed`.

**Errors:** `403` if booking not completed, `409` if already submitted.

---

## 13. Email Notifications

All transactional emails are sent from `noreply@aur3m.com` via the backend email service (Resend or SendGrid). Domain verification for `aur3m.com` is required. Every email includes the AUR³M logo, brand-consistent styling, and an unsubscribe footer.

### 12.1 Triggers & Templates

| # | Trigger Event | Template Name | Recipient | Subject Line |
|---|---|---|---|---|
| 1 | `POST /api/auth/signup` succeeds | `welcome` | New user | Welcome to AUR³M, {alias} |
| 2 | `POST /api/payments/create-checkout` webhook confirms upgrade | `upgrade-thankyou` | Upgraded user | Your {tier} membership is active |
| 3 | Speed Round mutual "yes" → 15min call scheduled | `call-scheduled` | Both users | Your {duration}-minute call is confirmed |
| 4 | 24 hours before a scheduled call | `call-reminder` | Both users | Reminder: your call with {partner_alias} is tomorrow |
| 5 | Mutual "yes" after 60min call → relationship reaches `date` stage | `date-eligible` | Both users | You're ready for a Gold Date |
| 6 | `POST /api/dates/create-payment` Stripe webhook confirms payment | `date-payment-received` | Paying user | Date booking payment received |
| 7 | Both users have paid (second payment webhook) | `date-both-paid` | Both users | Both paid — pick your evening slots |
| 8 | Slot matching finds an overlap → date confirmed | `date-confirmed` | Both users | Your Gold Date is confirmed |
| 9 | 30-day deadline reached, only one user paid | `date-refund` | Paying user | Your £200 date fee has been refunded |
| 10 | No slot overlap found after both submit | `date-no-match` | Both users | No matching slots — please resubmit |
| 11 | `POST /api/auth/forgot-password` | `password-reset` | Requesting user | Reset your AUR³M password |
| 12 | User reports `felt_unsafe: true` in feedback | `safety-report-ack` | Reporting user | We've received your safety report |

### 12.2 Template Specifications

#### 1. `welcome`
**Trigger:** Successful signup  
**Data:** `{ alias, username, email }`  
**Content:**
- Heading: "Welcome to AUR³M, {alias}"
- Body: Brief intro to the platform, their anonymous alias, and how matching works
- CTA button: "Explore Memberships" → `/subscription`
- Note: Free-tier users only; alias is platform-assigned

#### 2. `upgrade-thankyou`
**Trigger:** Stripe webhook confirms subscription payment  
**Data:** `{ alias, tier, email }`  
**Content by tier:**
- **Silver:** Highlights video call access, Speed Round participation, and browse members
- **Gold:** Everything in Silver + explains the Gold Date booking process for verified offline dates
- **Platinum:** Everything in Gold + confirms a Personal Relationship Professional will contact them within 48 hours
- CTA button: "Go to Dashboard" → `/dashboard`

#### 3. `call-scheduled`
**Trigger:** Backend creates an `upcoming_calls` record after mutual "yes"  
**Data:** `{ partner_alias, scheduled_at, duration_minutes, call_type, room_name }`  
**Content:**
- Heading: "Your {duration_minutes}-minute call is set"
- Date/time formatted in user's timezone (or UTC with note)
- Partner shown as alias only (never real name)
- CTA button: "View Dashboard" → `/dashboard`
- Footer note: "Calls are video-only with anonymised profiles for your safety."

#### 4. `call-reminder`
**Trigger:** Cron job, 24 hours before `scheduled_at`  
**Data:** `{ partner_alias, scheduled_at, duration_minutes }`  
**Content:**
- Heading: "Your call is tomorrow"
- Reminder of time and partner alias
- CTA button: "View Dashboard" → `/dashboard`
- Tip: "Find a quiet, well-lit space. Be yourself."

#### 5. `date-eligible`
**Trigger:** Relationship stage transitions to `date` (both said "yes" after 60min call)  
**Data:** `{ partner_alias, relationship_id }`  
**Content:**
- Heading: "You and {partner_alias} are ready for a Gold Date"
- Explains the £200 fee, evening availability, and venue booking process
- CTA button: "Book Your Date" → `/date/{relationship_id}`
- Note: "Both of you must pay before selecting slots."

#### 6. `date-payment-received`
**Trigger:** Stripe webhook confirms £200 date payment  
**Data:** `{ alias, partner_alias, payment_deadline }`  
**Content:**
- Heading: "Payment received — £200"
- Explains they're now waiting for their match to pay
- Shows refund deadline: "If {partner_alias} hasn't paid by {payment_deadline}, you'll be fully refunded."
- No CTA needed (waiting state)

#### 7. `date-both-paid`
**Trigger:** Second payment webhook (both users now paid)  
**Data:** `{ partner_alias, relationship_id }`  
**Content:**
- Heading: "Both of you have paid — time to pick your evenings"
- Explains: select available slots between 6–8 pm, 7–30 days out
- CTA button: "Select Availability" → `/date/{relationship_id}`

#### 8. `date-confirmed`
**Trigger:** Backend slot-matching job finds overlapping slots  
**Data:** `{ partner_first_name, scheduled_at, venue, venue_address }`  
**Content:**
- Heading: "Your Gold Date is confirmed"
- Date/time: `{scheduled_at}` formatted nicely
- Venue: `{venue}` at `{venue_address}`
- Partner shown as **first name only** (not alias — this is the real-world date stage)
- Safety notes: "AUR³M has verified both members. If you feel unsafe at any point, contact our support team."
- No CTA — informational only

#### 9. `date-refund`
**Trigger:** Cron job at 30-day deadline when only one user paid  
**Data:** `{ alias, amount, refund_reference }`  
**Content:**
- Heading: "Your date fee has been refunded"
- Body: "Your match didn't complete their payment within 30 days. £{amount/100} has been returned to your original payment method."
- Refund reference for records
- CTA button: "Back to Dashboard" → `/dashboard`

#### 10. `date-no-match`
**Trigger:** Both users submitted availability but zero slot overlap  
**Data:** `{ partner_alias, relationship_id }`  
**Content:**
- Heading: "No matching slots found"
- Body: "Your availability didn't overlap with {partner_alias}'s. Please submit more evening slots to find a time that works."
- CTA button: "Update Availability" → `/date/{relationship_id}`

#### 11. `password-reset`
**Trigger:** `POST /api/auth/forgot-password`  
**Data:** `{ reset_token, email }`  
**Content:**
- Heading: "Reset your password"
- Body: "Click below to set a new password. This link expires in 1 hour."
- CTA button: "Reset Password" → `/reset-password?token={reset_token}`
- Footer: "If you didn't request this, ignore this email."

#### 12. `safety-report-ack`
**Trigger:** User submits feedback with `felt_unsafe: true`  
**Data:** `{ alias, session_id }`  
**Content:**
- Heading: "We've received your safety report"
- Body: "Thank you for letting us know. Our team reviews every report within 24 hours. The other member's account has been flagged for review."
- CTA button: "Contact Support" → `mailto:safety@aur3m.com`
- Note: "Your report is confidential."

### 12.3 Sending Rules

1. **One recipient per send** — never batch/loop. Each trigger sends to one specific user.
2. **Idempotency** — each email keyed by `{template_name}-{entity_id}` (e.g. `date-confirmed-{booking_id}`). Retries are safe.
3. **Rate limiting** — max 120 emails/minute. Queue with retry on 429.
4. **Suppression** — bounced/complained addresses are auto-suppressed. Check before sending.
5. **Partner privacy** — always use `alias` in emails, except `date-confirmed` which uses `partner_first_name` only. The platform never shares surnames, email addresses, phone numbers, or any other personal details between users.

### 12.4 Email Styling

All emails should follow these brand guidelines:
- **From:** `AUR³M <noreply@aur3m.com>`
- **Logo:** AUR³M wordmark at top
- **Font:** Arial/sans-serif fallback
- **Primary color:** Gold accent (`#C9A84C` or closest brand token)
- **Body background:** `#ffffff`
- **CTA buttons:** Gold background, white text, rounded corners
- **Footer:** Unsubscribe link (auto-appended), "© AUR³M" copyright

### 12.5 Database Table

```sql
CREATE TABLE email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES users(id),
  idempotency_key TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed | bounced
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_email_log_idempotency ON email_send_log(idempotency_key);
CREATE INDEX idx_email_log_status ON email_send_log(status) WHERE status = 'pending';
```

---

## Enums Reference

```sql
CREATE TYPE gender AS ENUM ('male', 'female', 'non-binary', 'prefer-not-to-say');
CREATE TYPE age_bracket AS ENUM ('18-25', '26-35', '36-45', '46-55', '55+');
CREATE TYPE interested_in AS ENUM ('men', 'women', 'both');
CREATE TYPE membership AS ENUM ('free', 'silver', 'gold', 'platinum');
CREATE TYPE decision AS ENUM ('yes', 'pass');
CREATE TYPE relationship_stage AS ENUM ('3min', '15min', '60min', 'date');
```
