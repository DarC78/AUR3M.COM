import sql from "mssql";
import type { ConnectionPool } from "mssql";

type BusyInterval = {
  startsAt: Date;
  endsAt: Date;
};

const BUFFER_MINUTES = 30;
const DATE_BOOKING_DURATION_MINUTES = 120;

function addMinutes(dateValue: Date, minutes: number): Date {
  return new Date(dateValue.getTime() + (minutes * 60 * 1000));
}

function overlapsWithBuffer(candidateStart: Date, candidateEnd: Date, busyStart: Date, busyEnd: Date): boolean {
  const blockedStart = addMinutes(busyStart, -BUFFER_MINUTES);
  const blockedEnd = addMinutes(busyEnd, BUFFER_MINUTES);
  return candidateStart < blockedEnd && candidateEnd > blockedStart;
}

export async function getBusyIntervalsForUsers(
  pool: ConnectionPool,
  userIds: string[],
  windowStart: Date,
  windowEnd: Date
): Promise<Map<string, BusyInterval[]>> {
  const intervals = new Map<string, BusyInterval[]>();
  const uniqueUserIds = [...new Set(userIds.map((userId) => userId.toLowerCase()))];

  for (const userId of uniqueUserIds) {
    intervals.set(userId, []);
  }

  if (uniqueUserIds.length === 0) {
    return intervals;
  }

  const rangeStart = addMinutes(windowStart, -BUFFER_MINUTES);
  const rangeEnd = addMinutes(windowEnd, BUFFER_MINUTES);
  const userIdValues = uniqueUserIds.map((userId) => `('${userId}')`).join(",\n");

  const scheduledCallsResult = await pool.request()
    .input("range_start", sql.DateTime2, rangeStart)
    .input("range_end", sql.DateTime2, rangeEnd)
    .query(`
      WITH target_users AS (
        SELECT CAST(user_id AS UNIQUEIDENTIFIER) AS user_id
        FROM (VALUES
          ${userIdValues}
        ) AS source(user_id)
      )
      SELECT
        sc.user_a_id,
        sc.user_b_id,
        sc.scheduled_at,
        sc.duration_minutes
      FROM dbo.scheduled_calls sc
      WHERE sc.status IN ('scheduled', 'rescheduled', 'in-progress')
        AND sc.scheduled_at < @range_end
        AND DATEADD(MINUTE, sc.duration_minutes, sc.scheduled_at) > @range_start
        AND (
          sc.user_a_id IN (SELECT user_id FROM target_users)
          OR sc.user_b_id IN (SELECT user_id FROM target_users)
        );
    `);

  for (const row of scheduledCallsResult.recordset as Array<{
    user_a_id: string;
    user_b_id: string;
    scheduled_at: Date;
    duration_minutes: number;
  }>) {
    const startsAt = new Date(row.scheduled_at);
    const endsAt = addMinutes(startsAt, row.duration_minutes);
    for (const userId of [row.user_a_id, row.user_b_id]) {
      const key = userId.toLowerCase();
      if (intervals.has(key)) {
        intervals.get(key)?.push({ startsAt, endsAt });
      }
    }
  }

  const dateBookingsResult = await pool.request()
    .input("range_start", sql.DateTime2, rangeStart)
    .input("range_end", sql.DateTime2, rangeEnd)
    .query(`
      WITH target_users AS (
        SELECT CAST(user_id AS UNIQUEIDENTIFIER) AS user_id
        FROM (VALUES
          ${userIdValues}
        ) AS source(user_id)
      )
      SELECT
        r.user_a_id,
        r.user_b_id,
        db.scheduled_at
      FROM dbo.date_bookings db
      INNER JOIN dbo.relationships r
        ON r.id = db.relationship_id
      WHERE db.status = 'confirmed'
        AND db.scheduled_at < @range_end
        AND DATEADD(MINUTE, ${DATE_BOOKING_DURATION_MINUTES}, db.scheduled_at) > @range_start
        AND (
          r.user_a_id IN (SELECT user_id FROM target_users)
          OR r.user_b_id IN (SELECT user_id FROM target_users)
        );
    `);

  for (const row of dateBookingsResult.recordset as Array<{
    user_a_id: string;
    user_b_id: string;
    scheduled_at: Date;
  }>) {
    const startsAt = new Date(row.scheduled_at);
    const endsAt = addMinutes(startsAt, DATE_BOOKING_DURATION_MINUTES);
    for (const userId of [row.user_a_id, row.user_b_id]) {
      const key = userId.toLowerCase();
      if (intervals.has(key)) {
        intervals.get(key)?.push({ startsAt, endsAt });
      }
    }
  }

  return intervals;
}

export function usersAreAvailableForInterval(
  userIds: string[],
  candidateStart: Date,
  durationMinutes: number,
  intervalsByUser: Map<string, BusyInterval[]>
): boolean {
  const candidateEnd = addMinutes(candidateStart, durationMinutes);

  return userIds.every((userId) => {
    const intervals = intervalsByUser.get(userId.toLowerCase()) ?? [];
    return intervals.every((interval) => !overlapsWithBuffer(candidateStart, candidateEnd, interval.startsAt, interval.endsAt));
  });
}
