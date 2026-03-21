import jwt from "jsonwebtoken";

type AuthTokenPayload = {
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
