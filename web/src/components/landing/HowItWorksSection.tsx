import { ScrollReveal } from "@/components/ScrollReveal";
import { Video, Calendar, Heart, Utensils, Star } from "lucide-react";

const phases = [
  {
    phase: "Membership",
    title: "£20/month",
    color: "gold" as const,
    steps: [
      {
        icon: Video,
        tier: "Tier 1",
        title: "Speed Rounds",
        description:
          "Twenty 3-minute anonymous video calls, like in the office. No photos, no profiles — just real conversations. Think of it as the coffee chat you'd have at a networking event, without the small talk about the weather. Both say yes? You advance.",
      },
      {
        icon: Calendar,
        tier: "Tier 2",
        title: "The 15-Minute Conversation",
        description:
          "Pick times that work around your schedule — the platform finds a slot that suits both of you. Still anonymous, still no pressure. You'll know within minutes whether there's real chemistry.",
      },
      {
        icon: Heart,
        tier: "Tier 3",
        title: "The Deep Conversation",
        description:
          "A full 60-minute anonymous video call. This is where you explore values, ambitions, and what you're really looking for in a partner. Red button available at any moment — you're always in control. If you both agree, you can book a safe, verified in-person date.",
      },
    ],
  },
  {
    phase: "Add-on",
    title: "£200/date",
    color: "gold" as const,
    steps: [
      {
        icon: Utensils,
        tier: "In-person Date",
        title: "Meet in Person",
        description:
          "Identities revealed — both members pass ID verification first. No catfishing, no surprises. You pick a restaurant from our curated London venues (dinner £50–£150, everything included). Staff are briefed, the environment is safe, and both parties must agree to leave together — otherwise you're escorted out separately.",
      },
    ],
  },
  {
    phase: "Add-on",
    title: "£1,000/programme",
    color: "gold" as const,
    steps: [
      {
        icon: Star,
        tier: "Coaching Programme",
        title: "Personal Relationship Coach",
        description:
          "You've validated real chemistry over dinner. Now invest in making it last. A 3-month coaching programme designed for new couples — navigating the early challenges, building communication habits, and giving your relationship the strongest possible start. Think of it as a personal trainer for the most important partnership of your life.",
      },
    ],
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-background">
      <div className="container max-w-4xl">
        <ScrollReveal>
          <p className="text-gold font-body text-sm tracking-[0.25em] uppercase text-center mb-3">
            The Journey
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground text-center mb-4">
            From stranger to life partner — without wasting your time
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-16 text-lg">
            A structured process that respects your schedule and builds trust
            at every stage. No swiping, no guesswork, no ghosting.
          </p>
        </ScrollReveal>

        <div className="space-y-16">
          {phases.map((phase, phaseIdx) => (
            <ScrollReveal key={`${phase.phase}-${phaseIdx}`} delay={phaseIdx * 100}>
              <div className="relative">
                {/* Phase header */}
                <div className="flex items-center gap-4 mb-8">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-gold/15 text-gold-dark">
                    {phase.phase}
                  </span>
                  <span className="text-muted-foreground font-body text-sm">
                    {phase.title}
                  </span>
                </div>

                {/* Steps */}
                <div className="space-y-6 pl-6 border-l-2 border-gold">
                  {phase.steps.map((step, stepIdx) => (
                    <ScrollReveal
                      key={step.tier}
                      delay={phaseIdx * 100 + stepIdx * 80}
                    >
                      <div className="relative pl-8">
                        {/* Dot on the line */}
                        <div className="absolute -left-[calc(0.5rem+1px)] top-1 w-4 h-4 rounded-full border-2 bg-background border-gold" />

                        <div className="flex items-start gap-4">
                          <div className="mt-0.5 text-gold-dark">
                            <step.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                              {step.tier}
                            </p>
                            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                              {step.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed max-w-lg">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
