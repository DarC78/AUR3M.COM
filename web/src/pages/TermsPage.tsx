import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Footer } from "@/components/landing/Footer";

const TermsPage = () => {
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
            Terms &amp; Conditions
          </span>
        </div>
      </header>

      <main className="flex-1 container py-12 md:py-20 max-w-3xl">
        <ScrollReveal>
          <h1
            className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-3"
            style={{ lineHeight: 1.15, textWrap: "balance" } as React.CSSProperties}
          >
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-muted-foreground mb-12">
            Effective date: {effectiveDate}
          </p>
        </ScrollReveal>

        <div className="prose prose-sm max-w-none text-foreground/90 space-y-10">
          <ScrollReveal delay={60}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">1. About AUR³M</h2>
              <p className="text-muted-foreground leading-relaxed">
                AUR³M is a trading style of JustProveIt Limited, a company registered in England and Wales (company number 16884574) with its registered office at Ty Merlin, Caerphilly Business Park, Caerphilly, CF83 3GS ("we", "us", "our"). We operate a curated dating platform accessible at aur3m.com. By creating an account or using our services you agree to these Terms &amp; Conditions. If you do not agree, please do not use the platform.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">2. Eligibility</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li>You must be at least 18 years old.</li>
                <li>You must provide accurate information during signup.</li>
                <li>You may only maintain one account at a time.</li>
                <li>We reserve the right to refuse or revoke access at our discretion.</li>
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">3. Membership Tiers &amp; Pricing</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                AUR³M offers three membership tiers:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li><strong className="text-foreground">Silver (£20/month)</strong> — access to anonymous Speed Rounds (3-min, 15-min, and 60-min video calls).</li>
                <li><strong className="text-foreground">Gold (£200 per date)</strong> — verified offline dates at premium venues, including dinner.</li>
                <li><strong className="text-foreground">Platinum (£1,000 per programme)</strong> — a 3-month guided relationship coaching programme.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Prices are in GBP and inclusive of VAT where applicable. We may update pricing with 30 days' notice.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">4. Cancellation &amp; Refunds</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li>Silver memberships can be cancelled at any time from your account settings.</li>
                <li>If you cancel within 30 days of your first payment, you will receive a full refund — no questions asked.</li>
                <li>Gold and Platinum fees are non-refundable once the service has been delivered (i.e. the date has taken place or coaching sessions have begun).</li>
                <li>If a Gold date is cancelled by AUR³M (e.g. venue issue), you will receive a full refund or a rescheduled date at no extra cost.</li>
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">5. Anonymous Video Calls — Code of Conduct</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                During all anonymous video calls (Phase 1), the following rules apply. Violations may result in warnings, suspension, or permanent removal.
              </p>
              <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">You must not:</h3>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li>Share your real name, surname, or any personally identifiable information during anonymous video calls.</li>
                <li>Exchange phone numbers, email addresses, social media handles, or any contact details during anonymous video calls.</li>
                <li>Disclose your specific location (street, neighbourhood, postcode, or workplace address).</li>
                <li>Name your employer or job title if it could identify you.</li>
                <li>Use explicit, sexual, discriminatory, or offensive language.</li>
                <li>Discuss income, net worth, or financial details.</li>
                <li>Record, screenshot, or capture any part of a video call.</li>
                <li>Pressure, intimidate, or manipulate another member.</li>
              </ul>
              <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">You may:</h3>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li>Use your platform-assigned stage name.</li>
                <li>Refer to your general area (e.g. "I'm based in London").</li>
                <li>Share your profession or industry in general terms.</li>
                <li>Discuss interests, hobbies, values, goals, travel, and relationship outlook.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Every call includes a <strong className="text-foreground">red button</strong> to immediately end the session and file a report. Reports are reviewed within 24 hours.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">6. Privacy &amp; Personal Details</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                AUR³M <strong className="text-foreground">never shares, reveals, or exchanges your contact details — or any personally identifiable information — with anybody</strong>, including other members. We do not disclose surnames, email addresses, phone numbers, home addresses, social media handles, or workplace information to any other user at any stage of the process.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Before an offline date, we validate your government-issued ID solely for safety and security purposes — to confirm you are who you say you are. This verification data is stored securely by AUR³M and is <strong className="text-foreground">never disclosed to the other member or any third party</strong>.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong className="text-foreground">Everything on AUR³M is anonymous until you personally decide otherwise.</strong> You are the only person who can choose to share your contact details — and only during or after an in-person date, at your own discretion.
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                <li>During anonymous video calls, users are identified only by their platform-assigned stage name.</li>
                <li><strong className="text-foreground">Members are strictly and completely forbidden from exchanging any contact details, personal information, or anything that could reveal their true identity during video calls.</strong> This includes — but is not limited to — full names, phone numbers, email addresses, social media usernames, workplace names, and specific locations. Violations will result in immediate suspension or permanent removal from the platform.</li>
                <li>For confirmed Gold Dates, the platform displays each member's <strong className="text-foreground">real first name only</strong> on the confirmation page for practical purposes.</li>
                <li>If, during or after a date, both members mutually decide to exchange contact information, that is entirely their own choice. The platform plays no role in facilitating or mediating this exchange.</li>
                <li>Verification data is handled in accordance with our <button onClick={() => navigate("/privacy")} className="underline hover:text-foreground transition-colors">Privacy Policy</button>.</li>
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">7. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content, branding, and technology on the platform are owned by AUR³M or its licensors. You may not reproduce, distribute, or create derivative works without our written consent.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={220}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                AUR³M facilitates connections but does not guarantee compatibility, safety, or outcomes of any interaction — online or offline. We are not liable for any damages, losses, or disputes arising from interactions between members. By using the platform, you acknowledge that you participate at your own risk.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={240}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">9. Account Suspension &amp; Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may suspend or terminate your account if you breach these terms, engage in prohibited conduct, or at our reasonable discretion. You may also delete your account at any time by contacting us at hello@aur3m.com.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={260}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">10. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms are governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={280}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">11. Changes to These Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these terms from time to time. Material changes will be communicated via email or an in-app notification at least 14 days before taking effect. Continued use of the platform after the effective date constitutes acceptance.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">12. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about these terms, contact us at{" "}
                <a href="mailto:hello@aur3m.com" className="underline hover:text-foreground transition-colors">hello@aur3m.com</a>.
              </p>
            </section>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
