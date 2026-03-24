import jwt from "jsonwebtoken";

export type EmailClickTokenPayload = {
  recipientEmail: string;
  emailType: string;
  buttonId: string;
  targetUrl: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET_AUR3M ?? process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Missing JWT_SECRET_AUR3M environment variable.");
  }

  return secret;
}

function getPublicAppBaseUrl(): string {
  return process.env.PUBLIC_APP_URL ?? "https://aur3m.com";
}

export function signEmailClickToken(payload: EmailClickTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: "365d"
  });
}

export function verifyEmailClickToken(token: string): EmailClickTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (typeof decoded === "string") {
    throw new Error("Invalid email click token payload.");
  }

  return {
    recipientEmail: String(decoded.recipientEmail),
    emailType: String(decoded.emailType),
    buttonId: String(decoded.buttonId),
    targetUrl: String(decoded.targetUrl)
  };
}

export function buildTrackedEmailClickUrl(payload: EmailClickTokenPayload): string {
  const token = signEmailClickToken(payload);
  return `${getPublicAppBaseUrl()}/api/email/click?token=${encodeURIComponent(token)}`;
}
