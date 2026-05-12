import { ScrollReveal } from "@/components/ScrollReveal";
import { Linkedin } from "lucide-react";
import founderImage from "@/assets/founder-adrian.jpg";

export const FounderSection = () => {
  return (
    <section className="py-24 md:py-32 bg-muted/30">
      <div className="container max-w-5xl">
        <ScrollReveal>
          <div className="grid md:grid-cols-[320px_1fr] gap-12 md:gap-16 items-start">
            {/* Photo */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="w-64 h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-lg shadow-foreground/5">
                <img
                  src={founderImage}
                  alt="Adrian Defta — Founder of AUR³M"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <a
                href="https://www.linkedin.com/in/adriandefta/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors active:scale-[0.97]"
              >
                <Linkedin className="w-4 h-4" />
                Connect on LinkedIn
              </a>
            </div>

            {/* Bio */}
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase mb-2">
                  The person behind AUR³M
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground leading-tight text-wrap-balance">
                  Adrian Defta
                </h2>
                <p className="text-muted-foreground mt-1">Founder &amp; CEO</p>
              </div>

              <div className="space-y-4 text-muted-foreground leading-relaxed max-w-prose">
                <p>
                  An serial entrepreneur and community leader with over 30 million
                  video views and 50,000 followers. Adrian spent years in FinTech —
                  from confused.com to building ProveIT to fight for people who
                  can't afford a lawyer.
                </p>
                <p className="text-foreground font-medium">
                  "I built AUR³M because busy professionals deserve better than a swipe
                  and a prayer. You deserve a process that respects your time, protects
                  your identity, and connects you with people who want the same things you do."
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
