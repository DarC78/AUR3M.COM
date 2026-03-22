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
            r.id AS connection_id,
            r.started_at AS matched_at,
            CASE
              WHEN ls.session_tier IS NOT NULL THEN ls.session_tier
              WHEN r.stage IN ('3min', '15min', '60min', 'date') THEN r.stage
              ELSE '3min'
            END AS tier,
            CASE
              WHEN r.user_a_id = @user_id THEN r.user_b_id
              ELSE r.user_a_id
            END AS other_user_id
          FROM dbo.relationships r
          LEFT JOIN dbo.speed_round_sessions ls
            ON ls.id = r.latest_session_id
          WHERE @user_id = r.user_a_id OR @user_id = r.user_b_id
        ),
        latest_decision AS (
          SELECT
            um.connection_id,
            s.id AS session_id,
            d.decision,
            ROW_NUMBER() OVER (
              PARTITION BY um.connection_id
              ORDER BY d.updated_at DESC, d.created_at DESC
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
          LEFT JOIN dbo.speed_round_participants p_self
            ON p_self.user_id = @user_id
           AND p_self.id IN (s.participant_a_id, s.participant_b_id)
          LEFT JOIN dbo.speed_round_decisions d
            ON d.session_id = s.id
           AND d.participant_id = p_self.id
        )
        , resolved_matches AS (
          SELECT
            um.connection_id,
            um.matched_at,
            u.display_name AS alias,
            um.tier,
            CASE
              WHEN ld.row_num = 1 AND ld.decision = 'yes' THEN 'yes'
              WHEN ld.row_num = 1 AND ld.decision = 'pass' THEN 'pass'
              ELSE 'pending'
            END AS decision_status
          FROM user_matches um
          INNER JOIN dbo.users u ON u.id = um.other_user_id
          LEFT JOIN latest_decision ld
            ON ld.connection_id = um.connection_id
           AND ld.row_num = 1
        )
        SELECT
          connection_id,
          matched_at,
          alias,
          tier,
          decision_status
        FROM resolved_matches
        ORDER BY matched_at DESC;
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
