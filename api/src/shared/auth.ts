import { HttpRequest } from "@azure/functions";
import { verifyAuthToken, type AuthTokenPayload } from "./jwt";

export function getBearerToken(request: HttpRequest): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export function requireAuth(request: HttpRequest): AuthTokenPayload {
  const token = getBearerToken(request);

  if (!token) {
    throw new Error("Missing or invalid Authorization header.");
  }

  return verifyAuthToken(token);
}
