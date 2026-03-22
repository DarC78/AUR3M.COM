import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

export async function relationshipNotes(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Relationship notes request received.");

  let authUserId: string;

  try {
    authUserId = requireAuth(request).sub;
  } catch (error) {
    return {
      status: 401,
      jsonBody: { error: error instanceof Error ? error.message : "Unauthorized" }
    };
  }

  const relationshipId = request.params.id;
  if (!relationshipId) {
    return {
      status: 400,
      jsonBody: { error: "id is required." }
    };
  }

  try {
    const pool = await getDbPool();
    const relationshipResult = await pool.request()
      .input("relationship_id", sql.UniqueIdentifier, relationshipId)
      .input("user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        SELECT TOP 1 id
        FROM dbo.relationships
        WHERE id = @relationship_id
          AND (@user_id = user_a_id OR @user_id = user_b_id);
      `);

    if (!relationshipResult.recordset[0]) {
      return {
        status: 404,
        jsonBody: { error: "Relationship not found for this user." }
      };
    }

    const notesResult = await pool.request()
      .input("relationship_id", sql.UniqueIdentifier, relationshipId)
      .input("author_user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        SELECT id, stage, note, created_at
        FROM dbo.relationship_notes
        WHERE relationship_id = @relationship_id
          AND author_user_id = @author_user_id
        ORDER BY created_at DESC;
      `);

    return {
      status: 200,
      jsonBody: {
        notes: notesResult.recordset
      }
    };
  } catch (error) {
    context.error("Relationship notes lookup failed.", error);
    return {
      status: 500,
      jsonBody: { error: error instanceof Error ? error.message : "Unknown relationship notes error" }
    };
  }
}

app.http("relationship-notes", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "relationships/{id}/notes",
  handler: relationshipNotes
});
