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
        html: "<p>Welcome to <strong>AUR3M Silver</strong>! You now have access to Speed Rounds and video calls.</p>"
      };
    case "gold":
      return {
        subject: "Welcome to AUR3M Gold",
        html: "<p>Welcome to <strong>AUR3M Gold</strong>! We'll be in touch to arrange your first premium date.</p>"
      };
    case "platinum":
      return {
        subject: "Welcome to AUR3M Platinum",
        html: "<p>Welcome to <strong>AUR3M Platinum</strong>! Your Personal Relationship Professional will reach out within 48 hours.</p>"
      };
  }
}

export async function sendMembershipUpgradeEmail(email: string, tier: MembershipTier): Promise<void> {
  const resend = new Resend(getRequiredEnv("RESEND_API_KEY"));
  const from = process.env.RESEND_FROM_EMAIL ?? "AUR3M <hello@aur3m.com>";
  const copy = getEmailCopy(tier);

  await resend.emails.send({
    from,
    to: email,
    subject: copy.subject,
    html: copy.html
  });
}
