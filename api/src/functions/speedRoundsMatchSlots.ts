import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { matchSlotsForSession } from "../shared/followUpScheduling";
import { requireInternalApiKey } from "../shared/internalAuth";

type MatchSlotsRequest = {
  session_id?: string;
};

function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    jsonBody: { error: message }
  };
}

export async function speedRoundsMatchSlots(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Speed round internal slot match request received.");

  try {
    requireInternalApiKey(request);
  } catch (error) {
    return {
      status: 401,
      jsonBody: { error: error instanceof Error ? error.message : "Unauthorized" }
    };
  }

  let body: MatchSlotsRequest;

  try {
    body = (await request.json()) as MatchSlotsRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!body.session_id) {
    return badRequest("session_id is required.");
  }

  try {
    const result = await matchSlotsForSession(body.session_id);
    return {
      status: 200,
      jsonBody: {
        success: true,
        session_id: body.session_id,
        result
      }
    };
  } catch (error) {
    context.error("Speed round internal slot match failed.", error);
    return {
      status: 500,
      jsonBody: { error: error instanceof Error ? error.message : "Unknown speed round slot match error" }
    };
  }
}

app.http("speed-rounds-match-slots", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "speed-rounds/match-slots",
  handler: speedRoundsMatchSlots
});
