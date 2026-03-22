import { Resend } from "resend";

type MembershipTier = "silver" | "gold" | "platinum";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

function getEmailCopy(tier: MembershipTier): { subject: string; html: string } {
  switch (tier) {
    case "silver":
      return {
        subject: "Welcome to AUR3M Silver",
        html: "<p>Welcome to <strong>AUR3M Silver</strong>! You now have access to 3, 15, and 60 minute calls.</p>"
      };
    case "gold":
      return {
        subject: "Welcome to AUR3M Gold",
        html: "<p>Welcome to <strong>AUR3M Gold</strong>! We'll be in touch to arrange your date.</p>"
      };
    case "platinum":
      return {
        subject: "Welcome to AUR3M Platinum",
        html: "<p>Welcome to <strong>AUR3M Platinum</strong>! Your 3 month programme will begin shortly, and our team will contact you with the next steps.</p>"
      };
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getResendClient(): { resend: Resend; from: string } {
  return {
    resend: new Resend(getRequiredEnv("RESEND_API_KEY")),
    from: process.env.RESEND_FROM_EMAIL ?? "AUR3M <hello@aur3m.com>"
  };
}

export async function sendSignupWelcomeEmail(email: string, username: string, alias: string): Promise<void> {
  const { resend, from } = getResendClient();
  const safeUsername = escapeHtml(username);
  const safeAlias = escapeHtml(alias);

  await resend.emails.send({
    from,
    to: email,
    subject: "Welcome to AUR3M",
    html: `
      <h1>Welcome to AUR3M, ${safeUsername}!</h1>
      <p>Your anonymous stage name is <strong>${safeAlias}</strong>.</p>
      <p>You're now on the Free tier.</p>
      <p>Upgrade to Silver for 3, 15, and 60 minute calls, Gold for dates, or Platinum for the 3 month programme.</p>
      <p><a href="https://aur3m.com/subscription">View plans</a></p>
      <p>The AUR3M Team<br/>A trading style of JustProveIt Ltd</p>
    `
  });
}

export async function sendMembershipUpgradeEmail(email: string, tier: MembershipTier): Promise<void> {
  const { resend, from } = getResendClient();
  const copy = getEmailCopy(tier);

  await resend.emails.send({
    from,
    to: email,
    subject: copy.subject,
    html: copy.html
  });
}
