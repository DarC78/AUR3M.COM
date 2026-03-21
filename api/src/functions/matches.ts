import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

export async function matches(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Matches request received.");

  let authUserId: string;

  try {
    authUserId = requireAuth(request).sub;
  } catch (error) {
    return {
      status: 401,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unauthorized"
      }
    };
  }

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        WITH user_matches AS (
          SELECT
            c.id AS connection_id,
            c.created_at AS matched_at,
            CASE
              WHEN c.user_a_id = @user_id THEN c.user_b_id
              ELSE c.user_a_id
            END AS other_user_id
          FROM dbo.connections c
          WHERE c.is_active = 1
            AND (@user_id = c.user_a_id OR @user_id = c.user_b_id)
        ),
        latest_speed_round AS (
          SELECT
            um.connection_id,
            s.id AS session_id,
            s.created_at,
            ROW_NUMBER() OVER (
              PARTITION BY um.connection_id
              ORDER BY s.created_at DESC
            ) AS row_num
          FROM user_matches um
          INNER JOIN dbo.speed_round_sessions s
            ON (
              (s.participant_a_id IN (
                SELECT p.id
                FROM dbo.speed_round_participants p
                WHERE p.user_id = @user_id
              ) AND s.participant_b_id IN (
                SELECT p2.id
                FROM dbo.speed_round_participants p2
                WHERE p2.user_id = um.other_user_id
              ))
              OR
              (s.participant_b_id IN (
                SELECT p.id
                FROM dbo.speed_round_participants p
                WHERE p.user_id = @user_id
              ) AND s.participant_a_id IN (
                SELECT p2.id
                FROM dbo.speed_round_participants p2
                WHERE p2.user_id = um.other_user_id
              ))
            )
        )
        SELECT
          um.connection_id,
          um.matched_at,
          u.display_name AS alias,
          u.membership AS tier,
          CASE
            WHEN lsr.session_id IS NULL THEN 'matched'
            WHEN EXISTS (
              SELECT 1
              FROM dbo.speed_round_sessions s
              INNER JOIN dbo.speed_round_participants p_self
                ON p_self.id IN (s.participant_a_id, s.participant_b_id)
              INNER JOIN dbo.speed_round_decisions d
                ON d.session_id = s.id AND d.participant_id = p_self.id
              WHERE s.id = lsr.session_id
                AND p_self.user_id = @user_id
                AND d.decision = 'yes'
            ) THEN 'yes'
            WHEN EXISTS (
              SELECT 1
              FROM dbo.speed_round_sessions s
              INNER JOIN dbo.speed_round_participants p_self
                ON p_self.id IN (s.participant_a_id, s.participant_b_id)
              INNER JOIN dbo.speed_round_decisions d
                ON d.session_id = s.id AND d.participant_id = p_self.id
              WHERE s.id = lsr.session_id
                AND p_self.user_id = @user_id
                AND d.decision = 'pass'
            ) THEN 'pass'
            ELSE 'pending'
          END AS decision_status
        FROM user_matches um
        INNER JOIN dbo.users u ON u.id = um.other_user_id
        LEFT JOIN latest_speed_round lsr
          ON lsr.connection_id = um.connection_id
         AND lsr.row_num = 1
        ORDER BY um.matched_at DESC;
      `);

    return {
      status: 200,
      jsonBody: {
        matches: result.recordset
      }
    };
  } catch (error) {
    context.error("Matches lookup failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown matches error"
      }
    };
  }
}

app.http("matches", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "matches",
  handler: matches
});
