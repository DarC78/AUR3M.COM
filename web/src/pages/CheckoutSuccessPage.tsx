import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CheckCircle, Video, Users, Calendar, ArrowRight } from "lucide-react";

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);

  const tier = searchParams.get("tier") ?? "paid";

  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Purchase', { content_name: tier });
    }
  }, [tier]);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const perks = [
    { icon: Video, label: "Access exclusive Speed Round events", available: true },
    { icon: Users, label: "Browse and connect with verified members", available: true },
    { icon: Calendar, label: "Book in-person dates (add-on)", available: true },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="absolute block w-2 h-2 rounded-full opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                backgroundColor: ["#d4a574", "#b8956a", "#a3a3a3", "#e5c07b"][i % 4],
                animation: `confetti-fall ${2 + Math.random() * 2}s ${Math.random() * 1.5}s ease-in forwards`,
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-lg w-full text-center space-y-8">
        <ScrollReveal>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground leading-tight">
            Welcome to AUR<sup className="text-[0.6em] relative -top-[0.4em]">3</sup>M
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Your membership is now active. You're part of an exclusive community of professionals ready to connect.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <div className="rounded-2xl border border-border bg-card p-6 text-left space-y-4">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              What's unlocked
            </p>
            {perks.map((perk) => (
              <div key={perk.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                  <perk.icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-foreground">{perk.label}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="flex flex-col gap-3">
            <Button
              variant="gold"
              size="lg"
              className="w-full"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate("/lobby")}
            >
              <Video className="w-4 h-4 mr-2" />
              Enter Speed Round Lobby
            </Button>
          </div>
        </ScrollReveal>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CheckoutSuccessPage;
