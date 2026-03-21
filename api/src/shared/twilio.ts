import Twilio from "twilio";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

export function createVideoAccessToken(identity: string, roomName: string): string {
  const accountSid = getRequiredEnv("TWILIO_ACCOUNT_SID_AUR3M");
  const apiKeySid = getRequiredEnv("TWILIO_API_KEY_SID_AUR3M");
  const apiKeySecret = getRequiredEnv("TWILIO_API_KEY_SECRET_AUR3M");

  const accessToken = new Twilio.jwt.AccessToken(accountSid, apiKeySid, apiKeySecret, {
    identity,
    ttl: 3600
  });

  const videoGrant = new Twilio.jwt.AccessToken.VideoGrant({
    room: roomName
  });

  accessToken.addGrant(videoGrant);

  return accessToken.toJwt();
}
