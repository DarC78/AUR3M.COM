import jwt from "jsonwebtoken";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  username: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET_AUR3M;

  if (!secret) {
    throw new Error("Missing JWT_SECRET_AUR3M environment variable.");
  }

  return secret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: "7d"
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (typeof decoded === "string") {
    throw new Error("Invalid JWT payload.");
  }

  return {
    sub: String(decoded.sub),
    email: String(decoded.email),
    username: String(decoded.username)
  };
}
