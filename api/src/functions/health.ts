import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function health(
  _request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Health check request received.");

  return {
    status: 200,
    jsonBody: {
      service: "aur3m-api",
      status: "ok",
      timestamp: new Date().toISOString()
    }
  };
}

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: health
});
