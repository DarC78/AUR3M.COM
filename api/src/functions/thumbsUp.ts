import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import sql from "mssql";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";

type CreateThumbsUpRequest = {
  to_user_id?: string;
};

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: {
      error: message
    }
  };
}

function unauthorized(error: unknown): HttpResponseInit {
  return {
    status: 401,
    jsonBody: {
      error: error instanceof Error ? error.message : "Unauthorized"
    }
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function createThumbsUp(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Create thumbs up request received.");

  let authUserId: string;

  try {
    authUserId = requireAuth(request).sub;
  } catch (error) {
    return unauthorized(error);
  }

  let body: CreateThumbsUpRequest;

  try {
    body = (await request.json()) as CreateThumbsUpRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!isNonEmptyString(body.to_user_id)) {
    return badRequest("to_user_id is required.");
  }

  if (body.to_user_id.toLowerCase() === authUserId.toLowerCase()) {
    return badRequest("You cannot thumbs up yourself.");
  }

  try {
    const pool = await getDbPool();
    const targetUserResult = await pool.request()
      .input("id", sql.UniqueIdentifier, body.to_user_id)
      .query(`
        SELECT id
        FROM dbo.users
        WHERE id = @id
          AND is_active = 1;
      `);

    if (!targetUserResult.recordset[0]) {
      return {
        status: 404,
        jsonBody: {
          error: "Target user not found."
        }
      };
    }

    await pool.request()
      .input("from_user_id", sql.UniqueIdentifier, authUserId)
      .input("to_user_id", sql.UniqueIdentifier, body.to_user_id)
      .query(`
        IF NOT EXISTS (
          SELECT 1
          FROM dbo.thumbs_up
          WHERE from_user_id = @from_user_id
            AND to_user_id = @to_user_id
        )
        BEGIN
          INSERT INTO dbo.thumbs_up (from_user_id, to_user_id)
          VALUES (@from_user_id, @to_user_id);
        END;
      `);

    return {
      status: 200,
      jsonBody: {
        success: true,
        to_user_id: body.to_user_id
      }
    };
  } catch (error) {
    context.error("Create thumbs up failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown thumbs up error"
      }
    };
  }
}

export async function deleteThumbsUp(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Delete thumbs up request received.");

  let authUserId: string;

  try {
    authUserId = requireAuth(request).sub;
  } catch (error) {
    return unauthorized(error);
  }

  const toUserId = request.params.to_user_id;

  if (!isNonEmptyString(toUserId)) {
    return badRequest("to_user_id is required.");
  }

  try {
    const pool = await getDbPool();
    await pool.request()
      .input("from_user_id", sql.UniqueIdentifier, authUserId)
      .input("to_user_id", sql.UniqueIdentifier, toUserId)
      .query(`
        DELETE FROM dbo.thumbs_up
        WHERE from_user_id = @from_user_id
          AND to_user_id = @to_user_id;
      `);

    return {
      status: 200,
      jsonBody: {
        success: true,
        to_user_id: toUserId
      }
    };
  } catch (error) {
    context.error("Delete thumbs up failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown delete thumbs up error"
      }
    };
  }
}

export async function listThumbsUp(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("List thumbs up request received.");

  let authUserId: string;

  try {
    authUserId = requireAuth(request).sub;
  } catch (error) {
    return unauthorized(error);
  }

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input("from_user_id", sql.UniqueIdentifier, authUserId)
      .query(`
        SELECT to_user_id, created_at
        FROM dbo.thumbs_up
        WHERE from_user_id = @from_user_id
        ORDER BY created_at DESC;
      `);

    return {
      status: 200,
      jsonBody: {
        thumbs_up: result.recordset.map((row) => row.to_user_id)
      }
    };
  } catch (error) {
    context.error("List thumbs up failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown list thumbs up error"
      }
    };
  }
}

app.http("thumbs-up-create", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "thumbs-up",
  handler: createThumbsUp
});

app.http("thumbs-up-delete", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "thumbs-up/{to_user_id}",
  handler: deleteThumbsUp
});

app.http("thumbs-up-list", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "thumbs-up",
  handler: listThumbsUp
});
