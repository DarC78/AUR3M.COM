import { ScrollReveal } from "@/components/ScrollReveal";
import { ShieldCheck, Fingerprint, MapPin, AlertOctagon, Lock, UserCheck } from "lucide-react";

const features = [
  {
    icon: Fingerprint,
    title: "ID-Verified Members",
    description:
      "Every member submits government ID before unlocking in-person dates. You'll never wonder if the person is real.",
  },
  {
    icon: AlertOctagon,
    title: "Red Button — Instant Exit",
    description:
      "Feel uncomfortable at any point? One tap ends the call immediately, no questions asked. Your safety comes first.",
  },
  {
    icon: MapPin,
    title: "Vetted Partner Venues",
    description:
      "In-person dates happen at restaurants we've personally vetted. Staff know you're on an AUR³M date and are briefed to help if needed.",
  },
  {
    icon: Lock,
    title: "Anonymous Until You Decide",
    description:
      "Your real name, and personal details stay hidden until you choose to reveal them (if both of you choose) after a date. Never before. During the date you can reveal real first name, nothing else. Connection before exposure.",
  },
  {
    icon: UserCheck,
    title: "Human Moderation",
    description:
      "Reports are reviewed by real people — not just algorithms. Bad actors are removed swiftly and permanently.",
  },
  {
    icon: ShieldCheck,
    title: "GDPR Compliant",
    description:
      "Your data is encrypted, never sold, and you can request full deletion at any time. Privacy by design, not afterthought.",
  },
];

export const SafetySection = () => {
  return (
    <section className="py-24 md:py-32 bg-muted/30">
      <div className="container max-w-6xl">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-gold tracking-wide uppercase mb-3">
              Your safety, our obsession
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground leading-tight text-wrap-balance">
              Built around your protection
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Every feature on AUR³M was designed with one question: does this
              make our members feel safer?
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <ScrollReveal key={f.title} delay={idx * 80}>
                <div className="group p-6 rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-foreground mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
