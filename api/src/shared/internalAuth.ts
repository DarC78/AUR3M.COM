import type { HttpRequest } from "@azure/functions";

export function requireInternalApiKey(request: HttpRequest): void {
  const expected = process.env.INTERNAL_API_KEY;

  if (!expected) {
    throw new Error("INTERNAL_API_KEY is not configured.");
  }

  const provided = request.headers.get("x-aur3m-internal-key");

  if (!provided || provided !== expected) {
    throw new Error("Unauthorized internal request.");
  }
}
