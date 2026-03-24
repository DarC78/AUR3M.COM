import sql from "mssql";
import type { ConnectionPool } from "mssql";
import { sendDateBookedEmail, sendDatePaymentReceivedEmail, sendDateRefundIssuedEmail, sendDateSlotsOpenEmail, sendNoCommonAvailabilityEmail } from "./email";
import { getDbPool } from "./db";
import { getBusyIntervalsForUsers, usersAreAvailableForInterval } from "./schedulingConflicts";
import { getRelationshipVerificationState } from "./userVerifications";

type RelationshipParticipantContext = {
  relationshipId: string;
  userAId: string;
  userBId: string;
  userAAlias: string;
  userBAlias: string;
  userAEmail: string;
  userBEmail: string;
  userALocation: string | null;
  userBLocation: string | null;
  stage: string;
};

type Venue = {
  locationMatch: string[];
  venue: string;
  venueAddress: string;
};

const venues: Venue[] = [
  {
    locationMatch: ["London"],
    venue: "The Ivy, Covent Garden",
    venueAddress: "1-5 West Street, London WC2H 9NQ"
  },
  {
    locationMatch: ["Manchester"],
    venue: "20 Stories",
    venueAddress: "No. 1 Spinningfields, Manchester M3 3EB"
  },
  {
    locationMatch: ["Birmingham"],
    venue: "The Ivy Temple Row",
    venueAddress: "67-71 Temple Row, Birmingham B2 5LS"
  }
];

function pickVenue(locationA: string | null, locationB: string | null): { venue: string; venueAddress: string } {
  const combined = `${locationA ?? ""} ${locationB ?? ""}`.toLowerCase();
  const matched = venues.find((item) => item.locationMatch.some((token) => combined.includes(token.toLowerCase())));

  if (matched) {
    return { venue: matched.venue, venueAddress: matched.venueAddress };
  }

  return {
    venue: "The Ivy, Covent Garden",
    venueAddress: "1-5 West Street, London WC2H 9NQ"
  };
}

export async function getRelationshipParticipants(
  pool: ConnectionPool,
  relationshipId: string,
  userId?: string
): Promise<RelationshipParticipantContext | undefined> {
  const request = pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId);

  if (userId) {
    request.input("user_id", sql.UniqueIdentifier, userId);
  }

  const result = await request.query(`
    SELECT TOP 1
      r.id AS relationship_id,
      r.stage,
      ua.id AS user_a_id,
      ub.id AS user_b_id,
      ua.display_name AS user_a_alias,
      ub.display_name AS user_b_alias,
      ua.email AS user_a_email,
      ub.email AS user_b_email,
      ua.location AS user_a_location,
      ub.location AS user_b_location
    FROM dbo.relationships r
    INNER JOIN dbo.users ua
      ON ua.id = r.user_a_id
    INNER JOIN dbo.users ub
      ON ub.id = r.user_b_id
    WHERE r.id = @relationship_id
      ${userId ? "AND (@user_id = r.user_a_id OR @user_id = r.user_b_id)" : ""};
  `);

  const row = result.recordset[0] as
    | {
        relationship_id: string;
        stage: string;
        user_a_id: string;
        user_b_id: string;
        user_a_alias: string;
        user_b_alias: string;
        user_a_email: string;
        user_b_email: string;
        user_a_location: string | null;
        user_b_location: string | null;
      }
    | undefined;

  if (!row) {
    return undefined;
  }

  return {
    relationshipId: row.relationship_id,
    stage: row.stage,
    userAId: row.user_a_id,
    userBId: row.user_b_id,
    userAAlias: row.user_a_alias,
    userBAlias: row.user_b_alias,
    userAEmail: row.user_a_email,
    userBEmail: row.user_b_email,
    userALocation: row.user_a_location,
    userBLocation: row.user_b_location
  };
}

export async function upsertDatePaymentCheckoutSession(
  pool: ConnectionPool,
  relationshipId: string,
  userId: string,
  stripeSessionId: string
): Promise<void> {
  await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .input("user_id", sql.UniqueIdentifier, userId)
    .input("stripe_session_id", sql.NVarChar(255), stripeSessionId)
    .query(`
      MERGE dbo.date_payments AS target
      USING (
        SELECT
          @relationship_id AS relationship_id,
          @user_id AS user_id,
          @stripe_session_id AS stripe_session_id
      ) AS source
      ON target.relationship_id = source.relationship_id
         AND target.user_id = source.user_id
      WHEN MATCHED THEN
        UPDATE SET
          stripe_session_id = source.stripe_session_id,
          updated_at = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (relationship_id, user_id, stripe_session_id)
        VALUES (source.relationship_id, source.user_id, source.stripe_session_id);
    `);
}

export async function markDatePaymentPaid(
  relationshipId: string,
  userId: string,
  stripeSessionId: string | null,
  stripePaymentIntentId: string | null
): Promise<void> {
  const pool = await getDbPool();
  const existingPaidResult = await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .query(`
      SELECT MIN(paid_at) AS first_paid_at
      FROM dbo.date_payments
      WHERE relationship_id = @relationship_id
        AND status = 'paid';
    `);

  const firstPaidAt = (existingPaidResult.recordset[0] as { first_paid_at: Date | null } | undefined)?.first_paid_at;
  const baseDate = firstPaidAt ?? new Date();
  const refundDeadline = new Date(baseDate.getTime() + (30 * 24 * 60 * 60 * 1000));

  await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .input("user_id", sql.UniqueIdentifier, userId)
    .input("stripe_session_id", sql.NVarChar(255), stripeSessionId)
    .input("stripe_payment_intent_id", sql.NVarChar(255), stripePaymentIntentId)
    .input("refund_deadline", sql.DateTime2, refundDeadline)
    .query(`
      MERGE dbo.date_payments AS target
      USING (
        SELECT
          @relationship_id AS relationship_id,
          @user_id AS user_id,
          @stripe_session_id AS stripe_session_id,
          @stripe_payment_intent_id AS stripe_payment_intent_id,
          @refund_deadline AS refund_deadline
      ) AS source
      ON target.relationship_id = source.relationship_id
         AND target.user_id = source.user_id
      WHEN MATCHED THEN
        UPDATE SET
          stripe_session_id = COALESCE(source.stripe_session_id, target.stripe_session_id),
          stripe_payment_intent_id = COALESCE(source.stripe_payment_intent_id, target.stripe_payment_intent_id),
          status = 'paid',
          paid_at = COALESCE(target.paid_at, SYSUTCDATETIME()),
          refund_deadline = COALESCE(target.refund_deadline, source.refund_deadline),
          updated_at = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (
          relationship_id,
          user_id,
          stripe_session_id,
          stripe_payment_intent_id,
          status,
          paid_at,
          refund_deadline
        )
        VALUES (
          source.relationship_id,
          source.user_id,
          source.stripe_session_id,
          source.stripe_payment_intent_id,
          'paid',
          SYSUTCDATETIME(),
          source.refund_deadline
        );

      UPDATE dbo.date_payments
      SET refund_deadline = COALESCE(refund_deadline, @refund_deadline),
          updated_at = SYSUTCDATETIME()
      WHERE relationship_id = @relationship_id;
    `);

  const relationship = await getRelationshipParticipants(pool, relationshipId);

  if (!relationship) {
    return;
  }

  if (userId.toLowerCase() === relationship.userAId.toLowerCase()) {
    await sendDatePaymentReceivedEmail(relationship.userAEmail, relationship.userBAlias);
  } else {
    await sendDatePaymentReceivedEmail(relationship.userBEmail, relationship.userAAlias);
  }

  const paymentState = await getDatePaymentState(pool, relationshipId, userId);
  if (paymentState.bothPaid) {
    await sendDateSlotsOpenEmail(relationship.userAEmail, relationship.userBAlias);
    await sendDateSlotsOpenEmail(relationship.userBEmail, relationship.userAAlias);
  }
}

export async function getDatePaymentState(
  pool: ConnectionPool,
  relationshipId: string,
  authUserId: string
): Promise<{
  userPaid: boolean;
  partnerPaid: boolean;
  bothPaid: boolean;
  paymentDeadline: string | null;
}> {
  const relationship = await getRelationshipParticipants(pool, relationshipId, authUserId);

  if (!relationship) {
    throw new Error("Relationship not found for this user.");
  }

  const paymentsResult = await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .query(`
      SELECT user_id, status, refund_deadline
      FROM dbo.date_payments
      WHERE relationship_id = @relationship_id;
    `);

  const payments = paymentsResult.recordset as Array<{
    user_id: string;
    status: "pending" | "paid" | "refunded";
    refund_deadline: Date | null;
  }>;

  const ownPayment = payments.find((item) => item.user_id.toLowerCase() === authUserId.toLowerCase());
  const partnerPayment = payments.find((item) => item.user_id.toLowerCase() !== authUserId.toLowerCase());
  const deadline = payments.find((item) => item.refund_deadline)?.refund_deadline ?? null;

  return {
    userPaid: ownPayment?.status === "paid",
    partnerPaid: partnerPayment?.status === "paid",
    bothPaid: payments.filter((item) => item.status === "paid").length >= 2,
    paymentDeadline: deadline ? deadline.toISOString() : null
  };
}

export async function tryBookOfflineDate(relationshipId: string): Promise<"waiting" | "waiting_for_verification" | "no_match" | "booked"> {
  const pool = await getDbPool();
  const relationship = await getRelationshipParticipants(pool, relationshipId);

  if (!relationship) {
    throw new Error("Relationship not found.");
  }

  const paymentRows = await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .query(`
      SELECT user_id, status
      FROM dbo.date_payments
      WHERE relationship_id = @relationship_id;
    `);

  const paidCount = (paymentRows.recordset as Array<{ status: string }>).filter((item) => item.status === "paid").length;
  if (paidCount < 2) {
    return "waiting";
  }

  const verificationState = await getRelationshipVerificationState(pool, relationshipId, relationship.userAId);
  if (!verificationState.bothVerified) {
    return "waiting_for_verification";
  }

  const bookingResult = await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .query(`
      SELECT TOP 1 id
      FROM dbo.date_bookings
      WHERE relationship_id = @relationship_id;
    `);

  if (bookingResult.recordset[0]) {
    return "booked";
  }

  const availabilityResult = await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .input("user_a_id", sql.UniqueIdentifier, relationship.userAId)
    .input("user_b_id", sql.UniqueIdentifier, relationship.userBId)
    .query(`
      SELECT
        a.slot_date,
        a.slot_time
      FROM dbo.date_availability a
      INNER JOIN dbo.date_availability b
        ON b.relationship_id = a.relationship_id
       AND b.slot_date = a.slot_date
       AND b.slot_time = a.slot_time
      WHERE a.relationship_id = @relationship_id
        AND a.user_id = @user_a_id
        AND b.user_id = @user_b_id
      ORDER BY a.slot_date ASC, a.slot_time ASC;
    `);

  const matchingSlots = availabilityResult.recordset as Array<{ slot_date: Date; slot_time: string }>;

  if (matchingSlots.length === 0) {
    await sendNoCommonAvailabilityEmail(relationship.userAEmail, relationship.userBAlias);
    await sendNoCommonAvailabilityEmail(relationship.userBEmail, relationship.userAAlias);
    return "no_match";
  }

  const earliestSlot = matchingSlots[0];
  const latestSlot = matchingSlots[matchingSlots.length - 1];
  const earliestStart = new Date(`${earliestSlot.slot_date.toISOString().slice(0, 10)}T${earliestSlot.slot_time}:00.000Z`);
  const latestStart = new Date(`${latestSlot.slot_date.toISOString().slice(0, 10)}T${latestSlot.slot_time}:00.000Z`);
  const busyIntervals = await getBusyIntervalsForUsers(pool, [relationship.userAId, relationship.userBId], earliestStart, latestStart);

  const slot = matchingSlots.find((candidate) => {
    const scheduledAt = new Date(`${candidate.slot_date.toISOString().slice(0, 10)}T${candidate.slot_time}:00.000Z`);
    return usersAreAvailableForInterval([relationship.userAId, relationship.userBId], scheduledAt, 120, busyIntervals);
  });

  if (!slot) {
    await sendNoCommonAvailabilityEmail(relationship.userAEmail, relationship.userBAlias);
    await sendNoCommonAvailabilityEmail(relationship.userBEmail, relationship.userAAlias);
    return "no_match";
  }

  const datePart = slot.slot_date.toISOString().slice(0, 10);
  const scheduledAt = new Date(`${datePart}T${slot.slot_time}:00.000Z`);
  const venue = pickVenue(relationship.userALocation, relationship.userBLocation);

  await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .input("scheduled_at", sql.DateTime2, scheduledAt)
    .input("venue", sql.NVarChar(255), venue.venue)
    .input("venue_address", sql.NVarChar(255), venue.venueAddress)
    .query(`
      INSERT INTO dbo.date_bookings (
        relationship_id,
        scheduled_at,
        venue,
        venue_address
      )
      VALUES (
        @relationship_id,
        @scheduled_at,
        @venue,
        @venue_address
      );

      UPDATE dbo.relationships
      SET last_updated = SYSUTCDATETIME()
      WHERE id = @relationship_id;
    `);

  await sendDateBookedEmail(relationship.userAEmail, relationship.userBAlias, scheduledAt, venue.venue, venue.venueAddress);
  await sendDateBookedEmail(relationship.userBEmail, relationship.userAAlias, scheduledAt, venue.venue, venue.venueAddress);

  return "booked";
}

export async function markDatePaymentRefunded(
  relationshipId: string,
  userId: string
): Promise<void> {
  const pool = await getDbPool();
  await pool.request()
    .input("relationship_id", sql.UniqueIdentifier, relationshipId)
    .input("user_id", sql.UniqueIdentifier, userId)
    .query(`
      UPDATE dbo.date_payments
      SET status = 'refunded',
          refunded_at = SYSUTCDATETIME(),
          updated_at = SYSUTCDATETIME()
      WHERE relationship_id = @relationship_id
        AND user_id = @user_id;
    `);

  const relationship = await getRelationshipParticipants(pool, relationshipId);
  if (!relationship) {
    return;
  }

  if (userId.toLowerCase() === relationship.userAId.toLowerCase()) {
    await sendDateRefundIssuedEmail(relationship.userAEmail);
  } else {
    await sendDateRefundIssuedEmail(relationship.userBEmail);
  }
}
