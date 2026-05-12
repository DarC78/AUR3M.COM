import { ScrollReveal } from "@/components/ScrollReveal";
import { Video, Clock, MessageCircle, Heart, MapPin, Wine } from "lucide-react";

const phases = [
  {
    phase: "Phase 1",
    label: "The Spark",
    icon: Video,
    duration: "3-minute anonymous call",
    description:
      "Voices only, cameras off. No profile photo to overthink, no bio to dissect. Just three minutes of honest conversation — the kind you'd have at a dinner party, not a job interview.",
    detail: "No spark? No problem. Neither of you sees the other, and there's zero follow-up.",
  },
  {
    phase: "Phase 2",
    label: "The Deep Dive",
    icon: MessageCircle,
    duration: "15 or 60-minute video call",
    description:
      "Liked what you heard? Book a longer call around your schedule. This is where you explore what actually matters — career ambitions, family values, what weekends look like. Still anonymous if you prefer.",
    detail: "Red button available at any moment. You're always in control.",
  },
  {
    phase: "Phase 3",
    label: "The Real Date",
    icon: Wine,
    duration: "Verified dinner at a London venue",
    description:
      "Ready to meet? AUR³M arranges dinner at one of our vetted London restaurants. Both members are ID-verified. No catfishing, no last-minute cancellations — just two people who already know they click.",
    detail: "The kind of date you'd actually tell your friends about.",
  },
];

export const DateUnfoldsSection = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container max-w-5xl">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-gold tracking-wide uppercase mb-3">
              What a date actually looks like
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground leading-tight text-wrap-balance">
              From a 3-minute call to dinner in Mayfair
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Every connection follows a natural progression — designed so trust
              builds before faces are ever revealed. No wasted evenings, no awkward first messages.
            </p>
          </div>
        </ScrollReveal>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical connector line (desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

          <div className="space-y-12 md:space-y-0">
            {phases.map((p, idx) => {
              const Icon = p.icon;
              const isEven = idx % 2 === 0;

              return (
                <ScrollReveal key={p.phase} delay={idx * 120}>
                  <div className="relative md:grid md:grid-cols-2 md:gap-16 md:py-12">
                    {/* Connector dot */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary items-center justify-center z-10 shadow-md">
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>

                    {/* Content — alternating sides */}
                    <div
                      className={`${
                        isEven ? "md:text-right md:pr-12" : "md:col-start-2 md:pl-12"
                      }`}
                    >
                      <div className="flex items-center gap-3 md:hidden mb-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {p.phase}
                        </span>
                      </div>

                      <p className="hidden md:block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        {p.phase}
                      </p>
                      <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                        {p.label}
                      </h3>
                      <p className="text-sm font-medium text-gold mb-3 flex items-center gap-1.5 md:justify-end md:flex-row-reverse"
                        style={isEven ? {} : { justifyContent: "flex-start", flexDirection: "row" }}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {p.duration}
                      </p>
                      <p className="text-muted-foreground leading-relaxed mb-2">
                        {p.description}
                      </p>
                      <p className="text-sm text-muted-foreground/80 italic">
                        {p.detail}
                      </p>
                    </div>

                    {/* Empty column for layout */}
                    {isEven && <div className="hidden md:block" />}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
