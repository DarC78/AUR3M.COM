import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { getDatePaymentPriceId, getStripeClient } from "../shared/stripe";
import { getRelationshipParticipants, upsertDatePaymentCheckoutSession } from "../shared/dateFlow";

type DateCreatePaymentRequest = {
  relationship_id?: string;
};

function badRequest(message: string): HttpResponseInit {
  return { status: 400, jsonBody: { error: message } };
}

export async function dateCreatePayment(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Date create payment request received.");

  let auth;
  try {
    auth = requireAuth(request);
  } catch (error) {
    return { status: 401, jsonBody: { error: error instanceof Error ? error.message : "Unauthorized" } };
  }

  let body: DateCreatePaymentRequest;
  try {
    body = (await request.json()) as DateCreatePaymentRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!body.relationship_id) {
    return badRequest("relationship_id is required.");
  }

  try {
    const pool = await getDbPool();
    const relationship = await getRelationshipParticipants(pool, body.relationship_id, auth.sub);

    if (!relationship) {
      return { status: 404, jsonBody: { error: "Relationship not found for this user." } };
    }

    if (relationship.stage !== "date") {
      return { status: 400, jsonBody: { error: "Relationship not at date stage." } };
    }

    const paymentState = await pool.request()
      .input("relationship_id", body.relationship_id)
      .input("user_id", auth.sub)
      .query(`
        SELECT TOP 1 status
        FROM dbo.date_payments
        WHERE relationship_id = @relationship_id
          AND user_id = @user_id;
      `);

    const existing = paymentState.recordset[0] as { status: string } | undefined;
    if (existing?.status === "paid") {
      return { status: 409, jsonBody: { error: "User has already paid for this date." } };
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: getDatePaymentPriceId(), quantity: 1 }],
      success_url: `https://aur3m.com/date/${body.relationship_id}`,
      cancel_url: `https://aur3m.com/date/${body.relationship_id}`,
      metadata: {
        paymentType: "offline_date",
        relationshipId: body.relationship_id,
        userId: auth.sub
      }
    });

    await upsertDatePaymentCheckoutSession(pool, body.relationship_id, auth.sub, session.id);

    return { status: 200, jsonBody: { url: session.url } };
  } catch (error) {
    context.error("Date create payment failed.", error);
    return { status: 500, jsonBody: { error: error instanceof Error ? error.message : "Unknown date create payment error" } };
  }
}

app.http("dates-create-payment", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "dates/create-payment",
  handler: dateCreatePayment
});
