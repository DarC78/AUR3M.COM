import { ScrollReveal } from "@/components/ScrollReveal";
import { Shield, Eye, Lock, UserCheck, ShieldAlert } from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "No More Ghosting",
    description: "The structured progression means both people are invested before they meet. You don't exchange numbers and hope — you build trust through conversation first.",
  },
  {
    icon: UserCheck,
    title: "Personality First, Always",
    description: "No swiping. You connect on conversation, values, and chemistry — the things that actually predict a lasting relationship.",
  },
  {
    icon: ShieldAlert,
    title: "Not Another App",
    description: "Tinder gamifies attention. Matchmaking agencies charge thousands and make promises they can't keep. AUR³M sits in the middle — structured, affordable, and transparent.",
  },
  {
    icon: Lock,
    title: "Built for Busy Schedules",
    description: "Three-minute speed calls fit into a lunch break. Longer calls are scheduled around your availability. No commitment until you're ready — and no time wasted.",
  },
  {
    icon: Shield,
    title: "Serious Members Only",
    description: "The paid tiers and verification process filter out casual browsers. Everyone here is looking for the same thing: a real, lasting partnership.",
  },
];

export const TrustSection = () => {
  return (
    <section className="py-24 md:py-32 bg-cream-dark">
      <div className="container max-w-5xl">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground text-center mb-4">
            Why professionals choose AUR³M over apps
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-16 text-lg">
            You've tried the apps. You've considered the agencies.
            Here's why this is different.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, idx) => (
            <ScrollReveal key={feature.title} delay={idx * 80}>
              <div className="flex gap-5 p-6 rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="mt-1 text-forest-light shrink-0">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
