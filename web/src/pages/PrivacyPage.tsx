import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Footer } from "@/components/landing/Footer";

const PrivacyPage = () => {
  const navigate = useNavigate();
  const effectiveDate = "22 March 2026";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center gap-4 h-16">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display text-lg font-semibold text-foreground">
            Privacy Policy
          </span>
        </div>
      </header>

      <main className="flex-1 container py-12 md:py-20 max-w-3xl">
        <ScrollReveal>
          <h1
            className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-3"
            style={{ lineHeight: 1.15, textWrap: "balance" } as React.CSSProperties}
          >
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-12">
            Effective date: {effectiveDate}
          </p>
        </ScrollReveal>

        <div className="prose prose-sm max-w-none text-foreground/90 space-y-10">
          <ScrollReveal delay={60}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">1. Who We Are</h2>
              <p className="text-muted-foreground leading-relaxed">
                AUR³M is a trading style of JustProveIt Limited, a company registered in England and Wales (company number 16884574) with its registered office at Ty Merlin, Caerphilly Business Park, Caerphilly, CF83 3GS. We are the data controller responsible for your personal data. You can reach us at{" "}
                <a href="mailto:hello@aur3m.com" className="underline hover:text-foreground transition-colors">hello@aur3m.com</a>.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">2. What Data We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We collect the following categories of personal data:
              </p>
              <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">Account information</h3>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li>Email address and password (hashed)</li>
                <li>Username / stage name (platform-assigned)</li>
                <li>Gender, age bracket, location (city-level), profession</li>
                <li>Matching preferences (interested in men, women, or both)</li>
              </ul>
              <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">Usage data</h3>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li>Speed Round participation and outcomes (thumbs up / thumbs down)</li>
                <li>Connection history and match records</li>
                <li>Session timestamps, device type, and IP address</li>
              </ul>
              <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">Identity verification (Phase 2 only)</h3>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li>Government-issued ID (processed by a third-party verification provider)</li>
                <li>Verification status (pass / fail) — we do not store copies of your ID</li>
              </ul>
              <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">Payment data</h3>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li>Processed securely by our payment provider — we do not store card details</li>
                <li>Transaction records (amount, date, subscription status)</li>
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">3. How We Use Your Data</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li><strong className="text-foreground">Provide the service</strong> — match you with compatible members, facilitate video calls, and arrange offline dates.</li>
                <li><strong className="text-foreground">Improve matching</strong> — analyse behavioural signals (e.g. match acceptance rates) to refine compatibility over time.</li>
                <li><strong className="text-foreground">Safety &amp; moderation</strong> — review reports, enforce our code of conduct, and prevent fraud or abuse.</li>
                <li><strong className="text-foreground">Communications</strong> — send service-related emails (confirmations, reminders, policy changes). We will not send marketing without your consent.</li>
                <li><strong className="text-foreground">Legal compliance</strong> — meet our obligations under UK data protection law.</li>
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">4. Legal Basis for Processing</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li><strong className="text-foreground">Contract</strong> — processing necessary to deliver the service you signed up for.</li>
                <li><strong className="text-foreground">Legitimate interest</strong> — improving the platform, ensuring safety, preventing abuse.</li>
                <li><strong className="text-foreground">Consent</strong> — marketing communications (where applicable).</li>
                <li><strong className="text-foreground">Legal obligation</strong> — compliance with applicable laws and regulations.</li>
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">5. Data Sharing &amp; Anonymity</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We do not sell your personal data. <strong className="text-foreground">We never share your contact details, real name, email address, phone number, or any personally identifiable information with other members — under any circumstances.</strong>
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Identity verification (ID checks) is conducted solely for safety and security purposes. The results are never disclosed to other members — only a pass/fail status is recorded internally.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong className="text-foreground">Everything on AUR³M is anonymous until you personally decide otherwise.</strong> The only way your contact details are ever shared is if <em>you</em> choose to share them yourself, during or after an in-person date. The platform will never automate or facilitate this reveal.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We may share limited, non-identifying data with:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li><strong className="text-foreground">Other members</strong> — only your stage name, gender, age bracket, general location, profession, and membership tier are visible when browsing. Your real identity is never revealed.</li>
                <li><strong className="text-foreground">Service providers</strong> — payment processors, identity verification providers, video call infrastructure (Twilio), hosting providers, and email delivery services — all bound by data processing agreements.</li>
                <li><strong className="text-foreground">Law enforcement</strong> — where required by law or to protect the safety of our members.</li>
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">6. Video Calls &amp; Recordings</h2>
              <p className="text-muted-foreground leading-relaxed">
                AUR³M does <strong className="text-foreground">not</strong> record video calls. Calls are peer-to-peer and encrypted in transit via our video provider (Twilio). Members are strictly prohibited from recording, screenshotting, or capturing any part of a call. Violations result in immediate account termination.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={180}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">7. Data Retention</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li>Account data is retained while your account is active and for 30 days after deletion to allow recovery.</li>
                <li>After 30 days, personal data is permanently deleted or anonymised.</li>
                <li>Transaction records may be retained for up to 7 years for legal and accounting purposes.</li>
                <li>Reports and moderation logs are retained for 12 months after resolution.</li>
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">8. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Under UK GDPR, you have the right to:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li><strong className="text-foreground">Access</strong> — request a copy of your personal data.</li>
                <li><strong className="text-foreground">Rectification</strong> — correct inaccurate data.</li>
                <li><strong className="text-foreground">Erasure</strong> — request deletion of your data ("right to be forgotten").</li>
                <li><strong className="text-foreground">Restriction</strong> — limit how we process your data.</li>
                <li><strong className="text-foreground">Portability</strong> — receive your data in a machine-readable format.</li>
                <li><strong className="text-foreground">Object</strong> — object to processing based on legitimate interest.</li>
                <li><strong className="text-foreground">Withdraw consent</strong> — where processing is based on consent.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                To exercise any of these rights, email us at{" "}
                <a href="mailto:hello@aur3m.com" className="underline hover:text-foreground transition-colors">hello@aur3m.com</a>. We will respond within 30 days.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={220}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">9. Cookies &amp; Local Storage</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use browser local storage to keep you signed in across sessions. Specifically:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li><strong className="text-foreground">Authentication token</strong> — a JSON Web Token (JWT) stored in local storage that identifies your session. This token persists for up to <strong className="text-foreground">13 months</strong> from your last login, after which you will be asked to sign in again.</li>
                <li><strong className="text-foreground">Token expiry timestamp</strong> — a numeric timestamp stored alongside the token to enforce the 13-month session limit on the client side.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                These are strictly necessary for the operation of the service and do not track you across other websites. We do not currently use third-party tracking cookies or advertising pixels. If this changes, we will update this policy and obtain your consent where required.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                You can clear your session at any time by logging out or clearing your browser's local storage.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={240}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">10. International Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data is primarily processed within the United Kingdom and European Economic Area. Where data is transferred outside these regions (e.g. to cloud infrastructure providers), we ensure appropriate safeguards are in place, such as Standard Contractual Clauses.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={260}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">11. Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organisational measures to protect your data, including encryption in transit (TLS), hashed passwords, role-based access controls, and regular security reviews. No system is 100% secure, and we encourage you to use a strong, unique password for your AUR³M account.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={280}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">12. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this policy from time to time. Material changes will be communicated via email or in-app notification at least 14 days before taking effect.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">13. Complaints</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you are unhappy with how we handle your data, you can contact us at{" "}
                <a href="mailto:hello@aur3m.com" className="underline hover:text-foreground transition-colors">hello@aur3m.com</a>. You also have the right to lodge a complaint with the{" "}
                <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Information Commissioner's Office (ICO)</a>.
              </p>
            </section>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
