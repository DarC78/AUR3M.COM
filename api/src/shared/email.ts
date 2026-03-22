import { Resend } from "resend";
import { enqueueEmail } from "./emailQueue";

type MembershipTier = "silver" | "gold" | "platinum";
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
    case "silver":
      return {
        subject: "Welcome to AUR3M Silver",
        html: `
          <div style="margin:0;padding:32px 16px;background-color:#eef1f4;font-family:Georgia, 'Times New Roman', serif;color:#1b2430;">
            <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fbfcfd;border:1px solid #d6dde5;">
              <tr>
                <td style="padding:20px 28px;border-bottom:1px solid #dde4eb;background:linear-gradient(135deg,#f6f8fb 0%,#dfe7ef 100%);">
                  <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#60758d;">AUR3M Silver</div>
                  <div style="margin-top:10px;font-size:34px;line-height:1.15;color:#1b2430;">Your Silver access is now live</div>
                  <div style="margin-top:8px;font-size:16px;line-height:1.6;color:#44576d;">
                    You now have access to structured live calls inside AUR3M.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <div style="font-size:17px;line-height:1.8;color:#2c3a4a;">
                    Silver is designed to move things beyond passive browsing and into real-time interaction.
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
    case "gold":
      return {
        subject: "Welcome to AUR3M Gold",
        html: `
          <div style="margin:0;padding:32px 16px;background-color:#f6f1e8;font-family:Georgia, 'Times New Roman', serif;color:#2a2118;">
            <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdfa;border:1px solid #e2d6c8;">
              <tr>
                <td style="padding:20px 28px;border-bottom:1px solid #eadfd3;background:linear-gradient(135deg,#fbf6ef 0%,#f1dfc5 100%);">
                  <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#9a7744;">AUR3M Gold</div>
                  <div style="margin-top:10px;font-size:34px;line-height:1.15;color:#2a2118;">Your Gold membership is confirmed</div>
                  <div style="margin-top:8px;font-size:16px;line-height:1.6;color:#6a5540;">
                    Gold is designed for members ready to move toward a real date.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <div style="font-size:17px;line-height:1.8;color:#47392c;">
                    We will now take the next steps to arrange your date experience.
                  </div>
                  <table role="presentation" style="width:100%;margin-top:24px;border-collapse:separate;border-spacing:0 12px;">
                    <tr>
                      <td style="width:44px;vertical-align:top;font-size:20px;color:#9a7744;">01</td>
                      <td style="font-size:15px;line-height:1.7;color:#47392c;">Your Gold upgrade has been recorded successfully.</td>
                    </tr>
                    <tr>
                      <td style="width:44px;vertical-align:top;font-size:20px;color:#9a7744;">02</td>
                      <td style="font-size:15px;line-height:1.7;color:#47392c;">Our team will follow up with the relevant next steps for your date arrangement.</td>
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
    case "platinum":
      return {
        subject: "Welcome to AUR3M Platinum",
        html: `
          <div style="margin:0;padding:32px 16px;background-color:#f1edf5;font-family:Georgia, 'Times New Roman', serif;color:#241c2b;">
            <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fefcff;border:1px solid #ddd5e4;">
              <tr>
                <td style="padding:20px 28px;border-bottom:1px solid #e6deed;background:linear-gradient(135deg,#f8f5fb 0%,#e5dced 100%);">
                  <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#7a6791;">AUR3M Platinum</div>
                  <div style="margin-top:10px;font-size:34px;line-height:1.15;color:#241c2b;">Welcome to Platinum</div>
                  <div style="margin-top:8px;font-size:16px;line-height:1.6;color:#5d4f6d;">
                    Your 3 month programme is now underway.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <div style="font-size:17px;line-height:1.8;color:#3a3045;">
                    Platinum is the most involved AUR3M experience, built for members who want a more guided and hands-on path.
                  </div>
                  <table role="presentation" style="width:100%;margin-top:24px;border-collapse:separate;border-spacing:0 12px;">
                    <tr>
                      <td style="width:44px;vertical-align:top;font-size:20px;color:#7a6791;">01</td>
                      <td style="font-size:15px;line-height:1.7;color:#3a3045;">Your Platinum upgrade has been recorded and your programme is active.</td>
                    </tr>
                    <tr>
                      <td style="width:44px;vertical-align:top;font-size:20px;color:#7a6791;">02</td>
                      <td style="font-size:15px;line-height:1.7;color:#3a3045;">Our team will contact you with the next steps and programme coordination details.</td>
                    </tr>
                    <tr>
                      <td style="width:44px;vertical-align:top;font-size:20px;color:#7a6791;">03</td>
                      <td style="font-size:15px;line-height:1.7;color:#3a3045;">You can continue to access your account while the programme setup moves forward.</td>
                    </tr>
                  </table>
                  <div style="margin-top:28px;padding:18px 20px;background-color:#f7f3fa;border-left:4px solid #8f7aa7;font-size:15px;line-height:1.7;color:#473b54;">
                    Best next step: watch for our follow-up so the 3 month programme can begin properly.
                  </div>
                  <table role="presentation" style="margin-top:28px;border-collapse:collapse;">
                    <tr>
                      <td>
                        <a href="https://aur3m.com/dashboard" style="display:inline-block;padding:14px 22px;background-color:#241c2b;color:#fefcff;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Open Dashboard</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:22px 28px;border-top:1px solid #e6deed;background-color:#faf7fc;font-size:13px;line-height:1.7;color:#6e6180;">
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
                <p style="margin:0 0 16px 0;">Hi ${safeUsername}, one of the core ideas behind AUR3M is that people should be able to explore genuine compatibility without exposing too much too early.</p>
                <p style="margin:0 0 16px 0;">That means you can participate on the platform through your alias first, keep your privacy intact, and only move further when both sides want to.</p>
                <div style="padding:18px 20px;background-color:#f8f3ec;border-left:4px solid #b08a5a;color:#3e342d;">
                  The point is simple: less pressure, better boundaries, and more control over how things progress.
                </div>
                <p style="margin:24px 0 0 0;"><a href="https://aur3m.com/dashboard" style="display:inline-block;padding:14px 22px;background-color:#1f1a17;color:#fffdf9;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Open Dashboard</a></p>
              </td>
            </tr>
          </table>
        </div>
      `
    },
    {
      from,
      subject: "Feature 2: discover compatible people more deliberately",
      html: `
        <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
          <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid #e7ddd2;background:linear-gradient(135deg,#f7f1e8 0%,#efe2d1 100%);">
                <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#8a6f52;">AUR3M Feature 2</div>
                <div style="margin-top:10px;font-size:32px;line-height:1.15;color:#1f1a17;">Better filtering, less noise</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.8;color:#342b25;">
                <p style="margin:0 0 16px 0;">AUR3M is meant to feel more selective than the usual swipe-and-scroll experience.</p>
                <p style="margin:0 0 16px 0;">Your profile details help shape which members make sense for you, so completing your profile properly improves the quality of the people you explore.</p>
                <div style="padding:18px 20px;background-color:#f8f3ec;border-left:4px solid #b08a5a;color:#3e342d;">
                  Better profile detail means better introductions and less wasted time.
                </div>
                <p style="margin:24px 0 0 0;"><a href="https://aur3m.com/profile" style="display:inline-block;padding:14px 22px;background-color:#1f1a17;color:#fffdf9;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Review Profile</a></p>
              </td>
            </tr>
          </table>
        </div>
      `
    },
    {
      from,
      subject: "Feature 3: connections only happen when interest is mutual",
      html: `
        <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
          <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid #e7ddd2;background:linear-gradient(135deg,#f7f1e8 0%,#efe2d1 100%);">
                <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#8a6f52;">AUR3M Feature 3</div>
                <div style="margin-top:10px;font-size:32px;line-height:1.15;color:#1f1a17;">Mutual interest matters</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.8;color:#342b25;">
                <p style="margin:0 0 16px 0;">On AUR3M, a connection is created when the interest goes both ways.</p>
                <p style="margin:0 0 16px 0;">That keeps things cleaner. You are not pushed into endless one-sided outreach or unnecessary exposure.</p>
                <div style="padding:18px 20px;background-color:#f8f3ec;border-left:4px solid #b08a5a;color:#3e342d;">
                  The platform is designed to move people forward only when there is genuine reciprocal intent.
                </div>
                <p style="margin:24px 0 0 0;"><a href="https://aur3m.com/dashboard" style="display:inline-block;padding:14px 22px;background-color:#1f1a17;color:#fffdf9;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Explore Members</a></p>
              </td>
            </tr>
          </table>
        </div>
      `
    },
    {
      from,
      subject: "Feature 4: progress from interest to real interaction",
      html: `
        <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
          <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid #e7ddd2;background:linear-gradient(135deg,#f7f1e8 0%,#efe2d1 100%);">
                <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#8a6f52;">AUR3M Feature 4</div>
                <div style="margin-top:10px;font-size:32px;line-height:1.15;color:#1f1a17;">A clear path forward</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.8;color:#342b25;">
                <p style="margin:0 0 16px 0;">AUR3M is not supposed to stop at passive browsing.</p>
                <p style="margin:0 0 16px 0;">If you want more direct interaction, Silver unlocks 3, 15, and 60 minute calls, Gold is built around dates, and Platinum is the full 3 month programme.</p>
                <div style="padding:18px 20px;background-color:#f8f3ec;border-left:4px solid #b08a5a;color:#3e342d;">
                  The idea is progression: from profile, to mutual interest, to conversation, to meeting.
                </div>
                <p style="margin:24px 0 0 0;"><a href="https://aur3m.com/subscription" style="display:inline-block;padding:14px 22px;background-color:#1f1a17;color:#fffdf9;text-decoration:none;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">View Membership Options</a></p>
              </td>
            </tr>
          </table>
        </div>
      `
    },
    {
      from,
      subject: "Feature 5: ID verification before meeting",
      html: `
        <div style="margin:0;padding:32px 16px;background-color:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#1f1a17;">
          <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background-color:#fffdf9;border:1px solid #ded4c7;">
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid #e7ddd2;background:linear-gradient(135deg,#f7f1e8 0%,#efe2d1 100%);">
                <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#8a6f52;">AUR3M Feature 5</div>
                <div style="margin-top:10px;font-size:32px;line-height:1.15;color:#1f1a17;">Verification before meeting</div>
                <div style="margin-top:8px;font-size:16px;line-height:1.6;color:#54473c;">
                  Privacy first does not mean safety last.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.8;color:#342b25;">
                <p style="margin:0 0 16px 0;">AUR3M begins with anonymity, but before an in-person meeting there is an ID verification step.</p>
                <p style="margin:0 0 16px 0;">That balance is deliberate: you keep control early on, while the process becomes more accountable before things move offline.</p>
                <div style="padding:18px 20px;background-color:#f8f3ec;border-left:4px solid #b08a5a;color:#3e342d;">
                  Anonymous at the start. Verified before meeting. That is one of the key trust mechanisms behind the platform.
                </div>
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
