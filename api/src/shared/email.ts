import { Resend } from "resend";
import { enqueueEmail } from "./emailQueue";

type MembershipTier = "paid" | "coaching_program";
type EmailCopy = { from: string; subject: string; html: string };

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

function getEmailCopy(tier: MembershipTier): { subject: string; html: string } {
  switch (tier) {
    case "paid":
      return {
        subject: "Your AUR3M paid membership is live",
        html: `
          <div style="margin:0;padding:32px 16px;background-color:#eef1f4;font-family:Georgia, 'Times New Roman', serif;color:#1b2430;">
            <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fbfcfd;border:1px solid #d6dde5;">
              <tr>
                <td style="padding:20px 28px;border-bottom:1px solid #dde4eb;background:linear-gradient(135deg,#f6f8fb 0%,#dfe7ef 100%);">
                  <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#60758d;">AUR3M Paid</div>
                  <div style="margin-top:10px;font-size:34px;line-height:1.15;color:#1b2430;">Your paid membership is now live</div>
                  <div style="margin-top:8px;font-size:16px;line-height:1.6;color:#44576d;">
                    You now have access to structured live calls inside AUR3M.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <div style="font-size:17px;line-height:1.8;color:#2c3a4a;">
                    Paid membership is designed to move things beyond passive browsing and into real-time interaction.
                  </div>
                  <table role="presentation" style="width:100%;margin-top:24px;border-collapse:separate;border-spacing:0 12px;">
                    <tr>
                      <td style="width:44px;vertical-align:top;font-size:20px;color:#60758d;">01</td>
                      <td style="font-size:15px;line-height:1.7;color:#2c3a4a;">Start with 3 minute calls for quick first impressions.</td>
                    </tr>
                    <tr>
                      <td style="width:44px;vertical-align:top;font-size:20px;color:#60758d;">02</td>
                      <td style="font-size:15px;line-height:1.7;color:#2c3a4a;">Use 15 minute calls when you want more substance.</td>
                    </tr>
                    <tr>
                      <td style="width:44px;vertical-align:top;font-size:20px;color:#60758d;">03</td>
                      <td style="font-size:15px;line-height:1.7;color:#2c3a4a;">Book 60 minute calls when there is clear potential and you want proper conversation.</td>
                    </tr>
                  </table>
                  <div style="margin-top:28px;padding:18px 20px;background-color:#f3f6f9;border-left:4px solid #7d93aa;font-size:15px;line-height:1.7;color:#354658;">
                    Best next step: sign in and start using your call access.
                  </div>
                  <table role="presentation" style="margin-top:28px;border-collapse:collapse;">
                    <tr>
                      <td>
                        <a href="https://aur3m.com/dashboard" style="display:inline-block;padding:14px 22px;background-color:#1b2430;color:#fbfcfd;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Open Dashboard</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:22px 28px;border-top:1px solid #dde4eb;background-color:#f7f9fb;font-size:13px;line-height:1.7;color:#617182;">
                  The AUR3M Team<br/>
                  A trading style of JustProveIt Ltd
                </td>
              </tr>
            </table>
          </div>
        `
      };
    case "coaching_program":
      return {
        subject: "Your AUR3M coaching programme is confirmed",
        html: `
          <div style="margin:0;padding:32px 16px;background-color:#f6f1e8;font-family:Georgia, 'Times New Roman', serif;color:#2a2118;">
            <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdfa;border:1px solid #e2d6c8;">
              <tr>
                <td style="padding:20px 28px;border-bottom:1px solid #eadfd3;background:linear-gradient(135deg,#fbf6ef 0%,#f1dfc5 100%);">
                  <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#9a7744;">AUR3M Coaching Programme</div>
                  <div style="margin-top:10px;font-size:34px;line-height:1.15;color:#2a2118;">Your coaching programme is confirmed</div>
                  <div style="margin-top:8px;font-size:16px;line-height:1.6;color:#6a5540;">
                    Your 3 month coaching programme is now underway.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <div style="font-size:17px;line-height:1.8;color:#47392c;">
                    We will now take the next steps to arrange your coaching programme.
                  </div>
                  <table role="presentation" style="width:100%;margin-top:24px;border-collapse:separate;border-spacing:0 12px;">
                    <tr>
                      <td style="width:44px;vertical-align:top;font-size:20px;color:#9a7744;">01</td>
                      <td style="font-size:15px;line-height:1.7;color:#47392c;">Your coaching programme purchase has been recorded successfully.</td>
                    </tr>
                    <tr>
                      <td style="width:44px;vertical-align:top;font-size:20px;color:#9a7744;">02</td>
                      <td style="font-size:15px;line-height:1.7;color:#47392c;">Our team will follow up with the relevant next steps for your programme arrangement.</td>
                    </tr>
                    <tr>
                      <td style="width:44px;vertical-align:top;font-size:20px;color:#9a7744;">03</td>
                      <td style="font-size:15px;line-height:1.7;color:#47392c;">You can continue using your dashboard while we progress things from our side.</td>
                    </tr>
                  </table>
                  <div style="margin-top:28px;padding:18px 20px;background-color:#fbf4eb;border-left:4px solid #c39b63;font-size:15px;line-height:1.7;color:#534131;">
                    Best next step: keep an eye on your inbox for follow-up communication from AUR3M.
                  </div>
                  <table role="presentation" style="margin-top:28px;border-collapse:collapse;">
                    <tr>
                      <td>
                        <a href="https://aur3m.com/dashboard" style="display:inline-block;padding:14px 22px;background-color:#2a2118;color:#fffdfa;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Open Dashboard</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:22px 28px;border-top:1px solid #eadfd3;background-color:#fcf8f2;font-size:13px;line-height:1.7;color:#7a6754;">
                  The AUR3M Team<br/>
                  A trading style of JustProveIt Ltd
                </td>
              </tr>
            </table>
          </div>
        `
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

function getPublicAppBaseUrl(): string {
  return process.env.PUBLIC_APP_URL ?? "https://aur3m.com";
}

function getVerificationEmailCopy(username: string, verificationUrl: string): EmailCopy {
  const { from } = getResendClient();
  const safeUsername = escapeHtml(username);
  const safeUrl = escapeHtml(verificationUrl);

  return {
    from,
    subject: "Verify your AUR3M email",
    html: `
      <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
        <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
          <tr>
            <td style="padding:20px 28px;border-bottom:1px solid #e7ddd2;background:linear-gradient(135deg,#f7f1e8 0%,#efe2d1 100%);">
              <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#8a6f52;">AUR3M</div>
              <div style="margin-top:10px;font-size:32px;line-height:1.15;color:#1f1a17;">Verify your email</div>
              <div style="margin-top:8px;font-size:16px;line-height:1.6;color:#54473c;">
                One more step before you can sign in, ${safeUsername}.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-size:15px;line-height:1.8;color:#342b25;">
              <p style="margin:0 0 16px 0;">Click the button below to verify your email address and activate your account.</p>
              <p style="margin:24px 0;">
                <a href="${safeUrl}" style="display:inline-block;padding:14px 22px;background-color:#1f1a17;color:#fffdf9;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Verify Email</a>
              </p>
              <p style="margin:0;color:#6a5a4b;">This verification link expires in 24 hours.</p>
            </td>
          </tr>
        </table>
      </div>
    `
  };
}

function getSignupWelcomeEmailCopy(username: string, alias: string): EmailCopy {
  const { from } = getResendClient();
  const safeUsername = escapeHtml(username);
  const safeAlias = escapeHtml(alias);

  return {
    from,
    subject: "Welcome to AUR3M",
    html: `
      <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
        <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
          <tr>
            <td style="padding:20px 28px;border-bottom:1px solid #e7ddd2;background:linear-gradient(135deg,#f7f1e8 0%,#efe2d1 100%);">
              <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#8a6f52;">AUR3M</div>
              <div style="margin-top:10px;font-size:34px;line-height:1.15;color:#1f1a17;">Welcome, ${safeUsername}</div>
              <div style="margin-top:8px;font-size:16px;line-height:1.6;color:#54473c;">
                Your profile is now live on the <strong>Free tier</strong> under the alias <strong>${safeAlias}</strong>.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <div style="font-size:17px;line-height:1.8;color:#342b25;">
                AUR3M is built for people who want a more intentional route from introduction to real connection.
              </div>
              <table role="presentation" style="width:100%;margin-top:24px;border-collapse:separate;border-spacing:0 12px;">
                <tr>
                  <td style="width:44px;vertical-align:top;font-size:20px;color:#8a6f52;">01</td>
                  <td style="font-size:15px;line-height:1.7;color:#342b25;">You join the platform under your alias rather than your real name.</td>
                </tr>
                <tr>
                  <td style="width:44px;vertical-align:top;font-size:20px;color:#8a6f52;">02</td>
                  <td style="font-size:15px;line-height:1.7;color:#342b25;">You explore compatible members and express interest where there is genuine potential.</td>
                </tr>
                <tr>
                  <td style="width:44px;vertical-align:top;font-size:20px;color:#8a6f52;">03</td>
                  <td style="font-size:15px;line-height:1.7;color:#342b25;">When interest is mutual, a connection is created and things can move forward.</td>
                </tr>
                <tr>
                  <td style="width:44px;vertical-align:top;font-size:20px;color:#8a6f52;">04</td>
                  <td style="font-size:15px;line-height:1.7;color:#342b25;">If you want a faster path, paid tiers unlock live calls, dates, and the 3 month programme.</td>
                </tr>
              </table>
              <div style="margin-top:28px;padding:18px 20px;background-color:#f8f3ec;border-left:4px solid #b08a5a;font-size:15px;line-height:1.7;color:#3e342d;">
                Best next step: sign in, review your profile, and start exploring members.
              </div>
              <table role="presentation" style="margin-top:28px;border-collapse:collapse;">
                <tr>
                  <td style="padding:0 12px 12px 0;">
                    <a href="https://aur3m.com/dashboard" style="display:inline-block;padding:14px 22px;background-color:#1f1a17;color:#fffdf9;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Open Dashboard</a>
                  </td>
                  <td style="padding:0 0 12px 0;">
                    <a href="https://aur3m.com/subscription" style="display:inline-block;padding:14px 22px;border:1px solid #1f1a17;color:#1f1a17;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">View Membership Options</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 28px;border-top:1px solid #e7ddd2;background-color:#fbf7f1;font-size:13px;line-height:1.7;color:#6a5a4b;">
              The AUR3M Team<br/>
              A trading style of JustProveIt Ltd
            </td>
          </tr>
        </table>
      </div>
    `
  };
}

function getMembershipUpgradeEmailCopy(tier: MembershipTier): EmailCopy {
  const { from } = getResendClient();
  const copy = getEmailCopy(tier);

  return {
    from,
    subject: copy.subject,
    html: copy.html
  };
}

function getPasswordResetEmailCopy(username: string, resetToken: string): EmailCopy {
  const { from } = getResendClient();
  const safeUsername = escapeHtml(username);
  const resetUrl = `${getPublicAppBaseUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;

  return {
    from,
    subject: "Reset your AUR3M password",
    html: `
      <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
        <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
          <tr>
            <td style="padding:20px 28px;border-bottom:1px solid #e7ddd2;background:linear-gradient(135deg,#f7f1e8 0%,#efe2d1 100%);">
              <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#8a6f52;">AUR3M Security</div>
              <div style="margin-top:10px;font-size:32px;line-height:1.15;color:#1f1a17;">Reset your password</div>
              <div style="margin-top:8px;font-size:16px;line-height:1.6;color:#54473c;">
                A password reset was requested for your account, ${safeUsername}.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-size:15px;line-height:1.8;color:#342b25;">
              <p style="margin:0 0 16px 0;">Use the button below to set a new password. This reset link expires in 1 hour.</p>
              <p style="margin:24px 0;">
                <a href="${resetUrl}" style="display:inline-block;padding:14px 22px;background-color:#1f1a17;color:#fffdf9;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Reset Password</a>
              </p>
              <p style="margin:0 0 16px 0;">If the button does not open, use this link:</p>
              <p style="margin:0;word-break:break-word;color:#6a5a4b;">${resetUrl}</p>
              <div style="margin-top:24px;padding:18px 20px;background-color:#f8f3ec;border-left:4px solid #b08a5a;color:#3e342d;">
                If you did not request this, you can ignore this email.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 28px;border-top:1px solid #e7ddd2;background-color:#fbf7f1;font-size:13px;line-height:1.7;color:#6a5a4b;">
              The AUR3M Team<br/>
              A trading style of JustProveIt Ltd
            </td>
          </tr>
        </table>
      </div>
    `
  };
}

function getSignupFollowUpEmailCopies(username: string, alias: string): EmailCopy[] {
  const { from } = getResendClient();
  const safeUsername = escapeHtml(username);
  const safeAlias = escapeHtml(alias);

  return [
    {
      from,
      subject: "Feature 1: stay anonymous until both want more",
      html: `
        <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
          <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid #e7ddd2;background:linear-gradient(135deg,#f7f1e8 0%,#efe2d1 100%);">
                <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#8a6f52;">AUR3M Feature 1</div>
                <div style="margin-top:10px;font-size:32px;line-height:1.15;color:#1f1a17;">Anonymous first</div>
                <div style="margin-top:8px;font-size:16px;line-height:1.6;color:#54473c;">
                  Your profile is visible under the alias <strong>${safeAlias}</strong>, not your real identity.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.8;color:#342b25;">
                <p style="margin:0 0 16px 0;">Hi ${safeUsername}, one of the strongest protections on AUR3M is that identity is treated as something valuable, not something to hand over at the very beginning.</p>
                <p style="margin:0 0 16px 0;">Too often, people reveal a real name, Instagram, LinkedIn, phone number, or place of work before trust has been earned. It can feel harmless in the moment. Then interest becomes one-sided, boundaries are ignored, or someone starts pushing for access they have not earned. What began as curiosity turns into unwanted messages, pressure outside the platform, or the uneasy feeling that a near-stranger now knows far more than they should.</p>
                <p style="margin:0 0 16px 0;">That is the moment AUR3M is built to prevent. Here, you begin through your alias <strong>${safeAlias}</strong>. You are given room to assess character, conversation, and compatibility before your real identity enters the equation.</p>
                <div style="padding:18px 20px;background-color:#f8f3ec;border-left:4px solid #b08a5a;color:#3e342d;">
                  On AUR3M, identities are revealed only when both people are ready, never before identity verification is complete, and never before both sides explicitly agree.
                </div>
                <p style="margin:16px 0 16px 0;">This is not about making things cold or distant. It is about allowing trust to form in the right order. First comes interest. Then consistency. Then mutual confidence. Only after that should identity be placed on the table.</p>
                <p style="margin:0 0 16px 0;">The result is a calmer, more intentional experience. Less pressure. Better boundaries. More dignity for both people. And far more control over when something personal becomes truly personal.</p>
                <p style="margin:24px 0 0 0;"><a href="https://aur3m.com/dashboard" style="display:inline-block;padding:14px 22px;background-color:#1f1a17;color:#fffdf9;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Open Dashboard</a></p>
              </td>
            </tr>
          </table>
        </div>
      `
    },
    {
      from,
      subject: `${safeUsername}, a better way than waiting and ghosting`,
      html: `
        <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
          <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid #e7ddd2;background:linear-gradient(135deg,#f7f1e8 0%,#efe2d1 100%);">
                <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#8a6f52;">AUR3M Feature 2</div>
                <div style="margin-top:10px;font-size:32px;line-height:1.15;color:#1f1a17;">Less waiting. Less ghosting.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.8;color:#342b25;">
                <p style="margin:0 0 16px 0;">Most matchmaking platforms waste an extraordinary amount of time. People wait for replies, wait for momentum, wait for someone to finally make a plan, and then often get ghosted anyway.</p>
                <p style="margin:0 0 16px 0;">AUR3M is designed to move in a clearer direction. You can review tens or even hundreds of people, decide where there seems to be real common ground, and take that interest forward into a structured 15 minute conversation.</p>
                <p style="margin:0 0 16px 0;">If that first conversation goes well, things progress to a one hour conversation. The idea is simple: less endless texting, less ambiguity, and a much faster path to finding out whether there is actually something there.</p>
                <div style="padding:18px 20px;background-color:#f8f3ec;border-left:4px solid #b08a5a;color:#3e342d;">
                  No time wasted. No ghosting rewarded. Every member has to actively say yes before things move forward.
                </div>
                <p style="margin:16px 0 16px 0;">It is completely fine to say no. It is completely fine to say yes. What is not fine is saying yes and then not showing up.</p>
                <p style="margin:0 0 16px 0;">On AUR3M, members who ghost others are removed from the platform after three ghostings. That standard protects everyone who is participating in good faith.</p>
                <p style="margin:24px 0 0 0;"><a href="https://aur3m.com/profile" style="display:inline-block;padding:14px 22px;background-color:#1f1a17;color:#fffdf9;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Review Profile</a></p>
              </td>
            </tr>
          </table>
        </div>
      `
    },
    {
      from,
      subject: `${safeUsername}, saying no is part of finding the right person`,
      html: `
        <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
          <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid #e7ddd2;background:linear-gradient(135deg,#f7f1e8 0%,#efe2d1 100%);">
                <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#8a6f52;">AUR3M Feature 3</div>
                <div style="margin-top:10px;font-size:32px;line-height:1.15;color:#1f1a17;">Saying no is part of the process</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.8;color:#342b25;">
                <p style="margin:0 0 16px 0;">One of the healthiest ideas on AUR3M is that saying no is completely normal. In real life, most of us are only genuinely compatible with perhaps 3% to 5% of the people we meet. That means, in reality, we need to say no to the other 95%.</p>
                <p style="margin:0 0 16px 0;">The point is not to force chemistry where it does not exist. The point is to filter well, respectfully, and without wasting months of time.</p>
                <p style="margin:0 0 16px 0;">That is why AUR3M works as a three-step filter. After the 3 minute call, you usually eliminate 50% to 60% of people. After the 15 minute call, you eliminate a further 20% to 30%. Then, after the one hour call, you decide whether this is actually someone you want to meet on a real date.</p>
                <div style="padding:18px 20px;background-color:#f8f3ec;border-left:4px solid #b08a5a;color:#3e342d;">
                  Every stage moves forward only when both people say they want more. No pressure, no forced momentum, and no need to pretend.
                </div>
                <p style="margin:16px 0 16px 0;">One of the worst parts of an ordinary date is sitting through dinner with someone and realising there is nothing meaningful to talk about. But if you have already gone through three calls in which both of you kept saying yes, then at the very least you know there is already some real common ground to explore.</p>
                <p style="margin:0 0 16px 0;">And who knows, if the date goes well and both of you agree, you might leave the restaurant together. Or you may simply part ways respectfully, still without exposing your real identity too early. Everything in the process is designed with your safety in mind.</p>
                <p style="margin:24px 0 0 0;"><a href="https://aur3m.com/dashboard" style="display:inline-block;padding:14px 22px;background-color:#1f1a17;color:#fffdf9;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Explore Members</a></p>
              </td>
            </tr>
          </table>
        </div>
      `
    },
    {
      from,
      subject: `${safeUsername}, the one hour call matters more than you think`,
      html: `
        <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
          <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid #e7ddd2;background:linear-gradient(135deg,#f7f1e8 0%,#efe2d1 100%);">
                <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#8a6f52;">AUR3M Feature 4</div>
                <div style="margin-top:10px;font-size:32px;line-height:1.15;color:#1f1a17;">The one hour call is where things become real</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.8;color:#342b25;">
                <p style="margin:0 0 16px 0;">By the time two people reach the one hour call on AUR3M, something meaningful has already happened. They have both moved through the earlier filters, both chosen to continue, and both shown that there is at least some real interest worth exploring.</p>
                <p style="margin:0 0 16px 0;">That one hour conversation matters because it is long enough to properly test whether the two of you genuinely have things in common, whether the interest is mutual, and whether spending time together in person would actually make sense.</p>
                <p style="margin:0 0 16px 0;">This is also the stage where both of you decide whether you want to go on a date. And even here, identities are still not revealed. Safety comes first. Only the two of you can decide whether you want to progress further or not.</p>
                <div style="padding:18px 20px;background-color:#f8f3ec;border-left:4px solid #b08a5a;color:#3e342d;">
                  If both agree to go on a date, the platform validates both identities, but does not reveal them to each other. That step exists to reduce the chance of scammers and to make sure the meeting is built on something real.
                </div>
                <p style="margin:16px 0 16px 0;">During the date, if both people want to, they can exchange contact details. But that happens only at the end of the date, not before. If they do not wish to do that, the restaurant ensures they leave safely and separately.</p>
                <p style="margin:0 0 16px 0;">The entire structure is designed to balance chemistry with caution, and progress with protection.</p>
                <p style="margin:24px 0 0 0;"><a href="https://aur3m.com/subscription" style="display:inline-block;padding:14px 22px;background-color:#1f1a17;color:#fffdf9;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">View Membership Options</a></p>
              </td>
            </tr>
          </table>
        </div>
      `
    },
    {
      from,
      subject: `${safeUsername}, verified before meeting, private until the end`,
      html: `
        <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
          <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid #e7ddd2;background:linear-gradient(135deg,#f7f1e8 0%,#efe2d1 100%);">
                <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#8a6f52;">AUR3M Feature 5</div>
                <div style="margin-top:10px;font-size:32px;line-height:1.15;color:#1f1a17;">Verification before meeting</div>
                <div style="margin-top:8px;font-size:16px;line-height:1.6;color:#54473c;">
                  Confidentiality is protected all the way through the process.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.8;color:#342b25;">
                <p style="margin:0 0 16px 0;">Before a real life date on AUR3M, both of you are ID verified, but you still do not know each other’s true identity. That distinction matters. Verification exists for safety. Confidentiality remains in place for protection.</p>
                <p style="margin:0 0 16px 0;">The date itself is organised to be highly secure. Only you can decide, at the end of the date, whether you want to reveal who you really are. Until then, privacy is preserved.</p>
                <div style="padding:18px 20px;background-color:#f8f3ec;border-left:4px solid #b08a5a;color:#3e342d;">
                  After the date, both people must agree if they want to leave together. If one person says no, you go your separate ways.
                </div>
                <p style="margin:16px 0 16px 0;">That rule is there for a reason. There is no pressure, no assumption, and no automatic continuation just because a date happened. Both people must want the same next step.</p>
                <p style="margin:0 0 16px 0;">If that shared yes is not there, the restaurant helps make sure both of you leave safely and separately, and you do not continue together. The entire structure is designed so that meeting in person never means giving up control.</p>
                <p style="margin:24px 0 0 0;"><a href="https://aur3m.com/dashboard" style="display:inline-block;padding:14px 22px;background-color:#1f1a17;color:#fffdf9;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Return to AUR3M</a></p>
              </td>
            </tr>
          </table>
        </div>
      `
    }
  ];
}

function formatUtcDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(value);
}

function getFollowUpCallScheduledEmailCopy(alias: string, scheduledAt: Date): EmailCopy {
  const { from } = getResendClient();
  const safeAlias = escapeHtml(alias);
  const formatted = escapeHtml(`${formatUtcDateTime(scheduledAt)} UTC`);

  return {
    from,
    subject: `Your next AUR3M call is confirmed — ${formatted}`,
    html: `
      <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
        <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
          <tr>
            <td style="padding:24px 28px;border-bottom:1px solid #e7ddd2;background:linear-gradient(135deg,#f7f1e8 0%,#efe2d1 100%);">
              <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#8a6f52;">AUR3M Follow-up Call</div>
              <div style="margin-top:10px;font-size:32px;line-height:1.2;color:#1f1a17;">Your next call with ${safeAlias} is confirmed</div>
              <div style="margin-top:10px;font-size:16px;line-height:1.7;color:#54473c;">Scheduled for <strong>${formatted}</strong>.</div>
            </td>
          </tr>
        </table>
      </div>
    `
  };
}

function getNoCommonSlotsEmailCopy(alias: string): EmailCopy {
  const { from } = getResendClient();
  const safeAlias = escapeHtml(alias);

  return {
    from,
    subject: "Update your availability on AUR3M",
    html: `
      <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
        <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
          <tr>
            <td style="padding:24px 28px;">
              <div style="font-size:30px;line-height:1.2;color:#1f1a17;">No common availability yet</div>
              <p style="font-size:16px;line-height:1.8;color:#54473c;">We could not find an overlapping slot with ${safeAlias}. Update your availability so AUR3M can book the next call.</p>
            </td>
          </tr>
        </table>
      </div>
    `
  };
}

function getUpcomingCallReminderEmailCopy(alias: string, scheduledAt: Date): EmailCopy {
  const { from } = getResendClient();
  const safeAlias = escapeHtml(alias);
  const formatted = escapeHtml(`${formatUtcDateTime(scheduledAt)} UTC`);

  return {
    from,
    subject: "Your AUR3M call starts in 1 hour",
    html: `
      <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
        <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
          <tr>
            <td style="padding:24px 28px;">
              <div style="font-size:30px;line-height:1.2;color:#1f1a17;">Your AUR3M call is coming up</div>
              <p style="font-size:16px;line-height:1.8;color:#54473c;">Your call with ${safeAlias} starts in 1 hour at ${formatted}.</p>
            </td>
          </tr>
        </table>
      </div>
    `
  };
}

function getPartnerPassedEmailCopy(): EmailCopy {
  const { from } = getResendClient();

  return {
    from,
    subject: "Your recent AUR3M connection",
    html: `
      <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
        <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
          <tr>
            <td style="padding:24px 28px;">
              <div style="font-size:30px;line-height:1.2;color:#1f1a17;">Your recent AUR3M connection</div>
              <p style="font-size:16px;line-height:1.8;color:#54473c;">That connection will not be progressing further. No identities have been revealed.</p>
            </td>
          </tr>
        </table>
      </div>
    `
  };
}

function getDatePaymentReceivedEmailCopy(alias: string): EmailCopy {
  const { from } = getResendClient();
  const safeAlias = escapeHtml(alias);

  return {
    from,
    subject: "Your AUR3M date payment is confirmed",
    html: `
      <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
        <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
          <tr><td style="padding:24px 28px;"><div style="font-size:30px;line-height:1.2;color:#1f1a17;">Payment received</div><p style="font-size:16px;line-height:1.8;color:#54473c;">Your offline date payment is in. We are now waiting for ${safeAlias} to complete their side.</p></td></tr>
        </table>
      </div>
    `
  };
}

function getDateSlotsOpenEmailCopy(alias: string): EmailCopy {
  const { from } = getResendClient();
  const safeAlias = escapeHtml(alias);

  return {
    from,
    subject: "Both payments are in — choose your AUR3M date slots",
    html: `
      <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
        <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
          <tr><td style="padding:24px 28px;"><div style="font-size:30px;line-height:1.2;color:#1f1a17;">Date booking is open</div><p style="font-size:16px;line-height:1.8;color:#54473c;">Both you and ${safeAlias} have paid. Submit your evening availability to lock in the date.</p></td></tr>
        </table>
      </div>
    `
  };
}

function getDateBookedEmailCopy(alias: string, scheduledAt: Date, venue: string, venueAddress: string): EmailCopy {
  const { from } = getResendClient();
  const safeAlias = escapeHtml(alias);
  const safeVenue = escapeHtml(venue);
  const safeAddress = escapeHtml(venueAddress);
  const formatted = escapeHtml(`${formatUtcDateTime(scheduledAt)} UTC`);

  return {
    from,
    subject: "Your AUR3M date is booked",
    html: `
      <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
        <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
          <tr><td style="padding:24px 28px;"><div style="font-size:30px;line-height:1.2;color:#1f1a17;">Your date is confirmed</div><p style="font-size:16px;line-height:1.8;color:#54473c;">You and ${safeAlias} are booked for ${formatted} at <strong>${safeVenue}</strong>.</p><p style="font-size:15px;line-height:1.8;color:#54473c;">${safeAddress}</p></td></tr>
        </table>
      </div>
    `
  };
}

function getDateRefundIssuedEmailCopy(): EmailCopy {
  const { from } = getResendClient();

  return {
    from,
    subject: "Your AUR3M offline date payment has been refunded",
    html: `
      <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
        <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
          <tr><td style="padding:24px 28px;"><div style="font-size:30px;line-height:1.2;color:#1f1a17;">Refund issued</div><p style="font-size:16px;line-height:1.8;color:#54473c;">The other side did not complete payment within the 30 day window, so your offline date payment has been refunded in full.</p></td></tr>
        </table>
      </div>
    `
  };
}

export async function sendEmail(from: string, to: string, subject: string, html: string): Promise<void> {
  const { resend } = getResendClient();

  await resend.emails.send({
    from,
    to,
    subject,
    html
  });
}

export async function sendSignupWelcomeEmail(email: string, username: string, alias: string): Promise<void> {
  const copy = getSignupWelcomeEmailCopy(username, alias);

  await sendEmail(copy.from, email, copy.subject, copy.html);
}

export async function sendMembershipUpgradeEmail(email: string, tier: MembershipTier): Promise<void> {
  const copy = getMembershipUpgradeEmailCopy(tier);

  await sendEmail(copy.from, email, copy.subject, copy.html);
}

export async function sendPasswordResetEmail(
  email: string,
  username: string,
  resetToken: string
): Promise<void> {
  const copy = getPasswordResetEmailCopy(username, resetToken);

  await sendEmail(copy.from, email, copy.subject, copy.html);
}

export async function sendVerificationEmail(
  email: string,
  username: string,
  verificationUrl: string
): Promise<void> {
  const copy = getVerificationEmailCopy(username, verificationUrl);
  await sendEmail(copy.from, email, copy.subject, copy.html);
}

export async function enqueueSignupFollowUpEmails(
  email: string,
  username: string,
  alias: string,
  signupDate: Date
): Promise<void> {
  const followUps = getSignupFollowUpEmailCopies(username, alias);

  for (const [index, followUp] of followUps.entries()) {
    const toSendAfterDate = new Date(signupDate);
    toSendAfterDate.setUTCDate(toSendAfterDate.getUTCDate() + index + 1);

    await enqueueEmail({
      emailType: `signup_followup_day_${index + 1}`,
      fromEmail: followUp.from,
      toEmail: email,
      subject: followUp.subject,
      htmlBody: followUp.html,
      toSendAfterDate
    });
  }
}

export async function sendFollowUpCallScheduledEmail(email: string, alias: string, scheduledAt: Date): Promise<void> {
  const copy = getFollowUpCallScheduledEmailCopy(alias, scheduledAt);
  await sendEmail(copy.from, email, copy.subject, copy.html);
}

export async function sendNoCommonAvailabilityEmail(email: string, alias: string): Promise<void> {
  const copy = getNoCommonSlotsEmailCopy(alias);
  await sendEmail(copy.from, email, copy.subject, copy.html);
}

export async function enqueueUpcomingCallReminderEmail(
  email: string,
  alias: string,
  scheduledAt: Date,
  reminderKey: string
): Promise<void> {
  const copy = getUpcomingCallReminderEmailCopy(alias, scheduledAt);
  const toSendAfterDate = new Date(scheduledAt.getTime() - (60 * 60 * 1000));

  await enqueueEmail({
    emailType: reminderKey,
    fromEmail: copy.from,
    toEmail: email,
    subject: copy.subject,
    htmlBody: copy.html,
    toSendAfterDate
  });
}

export async function sendPartnerPassedEmail(email: string): Promise<void> {
  const copy = getPartnerPassedEmailCopy();
  await sendEmail(copy.from, email, copy.subject, copy.html);
}

export async function sendDatePaymentReceivedEmail(email: string, alias: string): Promise<void> {
  const copy = getDatePaymentReceivedEmailCopy(alias);
  await sendEmail(copy.from, email, copy.subject, copy.html);
}

export async function sendDateSlotsOpenEmail(email: string, alias: string): Promise<void> {
  const copy = getDateSlotsOpenEmailCopy(alias);
  await sendEmail(copy.from, email, copy.subject, copy.html);
}

export async function sendDateBookedEmail(
  email: string,
  alias: string,
  scheduledAt: Date,
  venue: string,
  venueAddress: string
): Promise<void> {
  const copy = getDateBookedEmailCopy(alias, scheduledAt, venue, venueAddress);
  await sendEmail(copy.from, email, copy.subject, copy.html);
}

export async function sendDateRefundIssuedEmail(email: string): Promise<void> {
  const copy = getDateRefundIssuedEmailCopy();
  await sendEmail(copy.from, email, copy.subject, copy.html);
}
