import sql from "mssql";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getDbPool } from "../shared/db";
import { sendGoogleAdsLeadWelcomeEmail } from "../shared/email";

type GoogleAdsLeadField = {
  column_id?: string;
  string_value?: string;
};

type GoogleAdsLeadWebhookBody = {
  lead_id?: string;
  google_key?: string;
  campaign_id?: string | number;
  adgroup_id?: string | number;
  creative_id?: string | number;
  asset_group_id?: string | number;
  form_id?: string | number;
  lead_stage?: string;
  is_test?: boolean | string;
  lead_submit_time?: string;
  user_column_data?: GoogleAdsLeadField[];
};

function getRequiredGoogleAdsWebhookKey(): string {
  const value = process.env.GOOGLE_ADS_LEAD_WEBHOOK_KEY ?? process.env.PMAX_WEBHOOK_SECRET;

  if (!value) {
    throw new Error("Missing GOOGLE_ADS_LEAD_WEBHOOK_KEY environment variable.");
  }

  return value;
}

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: { error: message }
  };
}

function unauthorized(message: string): HttpResponseInit {
  return {
    status: 401,
    jsonBody: { error: message }
  };
}

function parseBigIntValue(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLeadSubmitTime(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseIsTest(value: boolean | string | undefined): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }

  return false;
}

function extractEmail(fields: GoogleAdsLeadField[] | undefined): string | null {
  if (!fields) {
    return null;
  }

  for (const field of fields) {
    const columnId = field.column_id?.trim().toLowerCase();
    const value = field.string_value?.trim();

    if (!value) {
      continue;
    }

    if (columnId === "email" || columnId === "work_email") {
      return value.toLowerCase();
    }
  }

  return null;
}

export async function googleAdsLeadWebhook(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Google Ads lead webhook received.");

  let body: GoogleAdsLeadWebhookBody;

  try {
    body = (await request.json()) as GoogleAdsLeadWebhookBody;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!body.lead_id?.trim()) {
    return badRequest("lead_id is required.");
  }

  const providedKey = body.google_key?.trim();

  if (!providedKey) {
    return unauthorized("google_key is required.");
  }

  try {
    const expectedKey = getRequiredGoogleAdsWebhookKey();

    if (providedKey !== expectedKey) {
      return unauthorized("Invalid google_key.");
    }

    const email = extractEmail(body.user_column_data);
    const leadSubmitTime = parseLeadSubmitTime(body.lead_submit_time);
    const pool = await getDbPool();
    const existingResult = await pool.request()
      .input("lead_id", sql.NVarChar(255), body.lead_id.trim())
      .query(`
        SELECT TOP 1 id
        FROM dbo.google_ads_leads
        WHERE lead_id = @lead_id;
      `);

    const isNewLead = existingResult.recordset.length === 0;

    await pool.request()
      .input("lead_id", sql.NVarChar(255), body.lead_id.trim())
      .input("email", sql.NVarChar(255), email)
      .input("form_id", sql.BigInt, parseBigIntValue(body.form_id))
      .input("campaign_id", sql.BigInt, parseBigIntValue(body.campaign_id))
      .input("adgroup_id", sql.BigInt, parseBigIntValue(body.adgroup_id))
      .input("creative_id", sql.BigInt, parseBigIntValue(body.creative_id))
      .input("asset_group_id", sql.BigInt, parseBigIntValue(body.asset_group_id))
      .input("google_key", sql.NVarChar(255), providedKey)
      .input("lead_stage", sql.NVarChar(100), body.lead_stage ?? null)
      .input("lead_submit_time", sql.DateTime2, leadSubmitTime)
      .input("is_test", sql.Bit, parseIsTest(body.is_test))
      .input("raw_payload_json", sql.NVarChar(sql.MAX), JSON.stringify(body))
      .query(`
        MERGE dbo.google_ads_leads AS target
        USING (
          SELECT
            @lead_id AS lead_id,
            @email AS email,
            @form_id AS form_id,
            @campaign_id AS campaign_id,
            @adgroup_id AS adgroup_id,
            @creative_id AS creative_id,
            @asset_group_id AS asset_group_id,
            @google_key AS google_key,
            @lead_stage AS lead_stage,
            @lead_submit_time AS lead_submit_time,
            @is_test AS is_test,
            @raw_payload_json AS raw_payload_json
        ) AS source
        ON target.lead_id = source.lead_id
        WHEN MATCHED THEN
          UPDATE SET
            email = source.email,
            form_id = source.form_id,
            campaign_id = source.campaign_id,
            adgroup_id = source.adgroup_id,
            creative_id = source.creative_id,
            asset_group_id = source.asset_group_id,
            google_key = source.google_key,
            lead_stage = source.lead_stage,
            lead_submit_time = source.lead_submit_time,
            is_test = source.is_test,
            raw_payload_json = source.raw_payload_json,
            updated_at = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (
            lead_id,
            email,
            form_id,
            campaign_id,
            adgroup_id,
            creative_id,
            asset_group_id,
            google_key,
            lead_stage,
            lead_submit_time,
            is_test,
            raw_payload_json
          )
          VALUES (
            source.lead_id,
            source.email,
            source.form_id,
            source.campaign_id,
            source.adgroup_id,
            source.creative_id,
            source.asset_group_id,
            source.google_key,
            source.lead_stage,
            source.lead_submit_time,
            source.is_test,
            source.raw_payload_json
          );
      `);

    if (isNewLead && email) {
      try {
        await sendGoogleAdsLeadWelcomeEmail(email);
      } catch (emailError) {
        context.error("Google Ads lead welcome email failed.", emailError);
      }
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        lead_id: body.lead_id.trim(),
        email,
        emailed: Boolean(isNewLead && email)
      }
    };
  } catch (error) {
    context.error("Google Ads lead webhook failed.", error);
    return {
      status: 500,
      jsonBody: { error: error instanceof Error ? error.message : "Unknown webhook error" }
    };
  }
}

app.http("google-ads-lead-webhook", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "marketing/google-ads/lead-webhook",
  handler: googleAdsLeadWebhook
});
