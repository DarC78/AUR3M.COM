import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { requireAuth } from "../shared/auth";
import { createVideoAccessToken } from "../shared/twilio";

type TwilioTokenRequest = {
  room_name?: string;
};

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: {
      error: message
    }
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function twilioToken(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Twilio token request received.");

  let auth;

  try {
    auth = requireAuth(request);
  } catch (error) {
    return {
      status: 401,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unauthorized"
      }
    };
  }

  let body: TwilioTokenRequest;

  try {
    body = (await request.json()) as TwilioTokenRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!isNonEmptyString(body.room_name)) {
    return badRequest("room_name is required.");
  }

  try {
    const token = createVideoAccessToken(auth.sub, body.room_name.trim());

    return {
      status: 200,
      jsonBody: {
        token,
        room_name: body.room_name.trim()
      }
    };
  } catch (error) {
    context.error("Twilio token generation failed.", error);

    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown Twilio token error"
      }
    };
  }
}

app.http("twilio-token", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "twilio/token",
  handler: twilioToken
});
