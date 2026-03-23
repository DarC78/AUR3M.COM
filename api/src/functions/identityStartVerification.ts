import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { requireAuth } from "../shared/auth";
import { getDbPool } from "../shared/db";
import { getDatePaymentState, getRelationshipParticipants } from "../shared/dateFlow";
import { getPublicAppUrl, getStripeClient } from "../shared/stripe";
import { createUserVerification, getLatestUserVerification } from "../shared/userVerifications";

type StartVerificationRequest = {
  relationship_id?: string;
};

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: { error: message }
  };
}

export async function identityStartVerification(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Identity start verification request received.");

  let auth;

  try {
    auth = requireAuth(request);
  } catch (error) {
    return {
      status: 401,
      jsonBody: { error: error instanceof Error ? error.message : "Unauthorized" }
    };
  }

  let body: StartVerificationRequest;

  try {
    body = (await request.json()) as StartVerificationRequest;
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
      return {
        status: 404,
        jsonBody: { error: "Relationship not found for this user." }
      };
    }

    if (relationship.stage !== "date") {
      return {
        status: 409,
        jsonBody: { error: "Relationship is not at date stage." }
      };
    }

    const paymentState = await getDatePaymentState(pool, body.relationship_id, auth.sub);

    if (!paymentState.userPaid) {
      return {
        status: 403,
        jsonBody: { error: "Identity verification is only available after your date payment is completed." }
      };
    }

    const existingVerification = await getLatestUserVerification(pool, auth.sub, body.relationship_id);

    if (existingVerification?.status === "verified") {
      return {
        status: 200,
        jsonBody: {
          verified: true,
          relationship_id: body.relationship_id,
          verification_status: "verified"
        }
      };
    }

    const stripe = getStripeClient();
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      return_url: `${getPublicAppUrl()}/date/${body.relationship_id}`,
      metadata: {
        userId: auth.sub,
        relationshipId: body.relationship_id,
        verificationPurpose: "date"
      }
    });

    await createUserVerification(pool, {
      userId: auth.sub,
      relationshipId: body.relationship_id,
      providerSessionId: session.id,
      status: session.status as "pending" | "processing" | "verified" | "requires_input" | "canceled",
      metadata: {
        type: session.type
      }
    });

    return {
      status: 200,
      jsonBody: {
        relationship_id: body.relationship_id,
        verification_session_id: session.id,
        verification_status: session.status,
        client_secret: session.client_secret
      }
    };
  } catch (error) {
    context.error("Identity start verification failed.", error);
    return {
      status: 500,
      jsonBody: { error: error instanceof Error ? error.message : "Unknown identity start verification error" }
    };
  }
}

app.http("identity-start-verification", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "identity/start-verification",
  handler: identityStartVerification
});
