import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { getDatePaymentState } from "../shared/dateFlow";

export async function datePaymentStatus(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Date payment status request received.");

  let auth;
  try {
    auth = requireAuth(request);
  } catch (error) {
    return { status: 401, jsonBody: { error: error instanceof Error ? error.message : "Unauthorized" } };
  }

  const relationshipId = request.params.relationshipId;
  if (!relationshipId) {
    return { status: 400, jsonBody: { error: "relationshipId is required." } };
  }

  try {
    const pool = await getDbPool();
    const state = await getDatePaymentState(pool, relationshipId, auth.sub);
    return {
      status: 200,
      jsonBody: {
        relationship_id: relationshipId,
        user_paid: state.userPaid,
        partner_paid: state.partnerPaid,
        both_paid: state.bothPaid,
        payment_deadline: state.paymentDeadline
      }
    };
  } catch (error) {
    context.error("Date payment status failed.", error);
    const message = error instanceof Error ? error.message : "Unknown date payment status error";
    return { status: message.includes("not found") ? 404 : 500, jsonBody: { error: message } };
  }
}

app.http("dates-payment-status", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "dates/{relationshipId}/payment-status",
  handler: datePaymentStatus
});
