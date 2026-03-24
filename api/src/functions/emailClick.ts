import sql from "mssql";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getDbPool } from "../shared/db";
import { verifyEmailClickToken } from "../shared/emailClickTracking";

function getClientIp(request: HttpRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("x-client-ip");
}

function redirect(location: string): HttpResponseInit {
  return {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": "no-store"
    }
  };
}

export async function emailClick(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const token = request.query.get("token")?.trim();

  if (!token) {
    return {
      status: 400,
      jsonBody: { error: "token is required." }
    };
  }

  try {
    const payload = verifyEmailClickToken(token);
    const pool = await getDbPool();
    const userAgent = request.headers.get("user-agent");
    const ipAddress = getClientIp(request);

    const userResult = await pool.request()
      .input("email", sql.NVarChar(255), payload.recipientEmail)
      .query(`
        SELECT TOP 1 id
        FROM dbo.users
        WHERE email = @email;
      `);

    const userId = (userResult.recordset[0] as { id: string } | undefined)?.id ?? null;

    await pool.request()
      .input("recipient_email", sql.NVarChar(255), payload.recipientEmail)
      .input("recipient_user_id", sql.UniqueIdentifier, userId)
      .input("email_type", sql.NVarChar(100), payload.emailType)
      .input("button_id", sql.NVarChar(100), payload.buttonId)
      .input("target_url", sql.NVarChar(1000), payload.targetUrl)
      .input("user_agent", sql.NVarChar(1000), userAgent)
      .input("ip_address", sql.NVarChar(255), ipAddress)
      .query(`
        INSERT INTO dbo.email_click_logs (
          recipient_email,
          recipient_user_id,
          email_type,
          button_id,
          target_url,
          user_agent,
          ip_address
        )
        VALUES (
          @recipient_email,
          @recipient_user_id,
          @email_type,
          @button_id,
          @target_url,
          @user_agent,
          @ip_address
        );
      `);

    return redirect(payload.targetUrl);
  } catch (error) {
    context.error("Email click tracking failed.", error);
    return {
      status: 400,
      jsonBody: { error: error instanceof Error ? error.message : "Invalid email click token." }
    };
  }
}

app.http("email-click", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "email/click",
  handler: emailClick
});
