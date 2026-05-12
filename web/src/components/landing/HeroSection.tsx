import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroPattern from "@/assets/hero-pattern.jpg";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroPattern}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-primary/70" />
      </div>

      <div className="container relative z-10 py-24 md:py-32">
        <div className="max-w-2xl space-y-8">
          <p
            className="text-gold-light font-body text-sm tracking-[0.25em] uppercase animate-reveal-up"
          >
            For London professionals done with swiping
          </p>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-primary-foreground leading-[1.1] animate-reveal-up stagger-1"
          >
            You're not looking
            <br />
            for another swipe.
            <br />
            You're looking for
            <br />
            the one.
          </h1>
          <p
            className="text-primary-foreground/80 font-body text-lg md:text-xl max-w-lg leading-relaxed animate-reveal-up stagger-2"
          >
            No ghosting! No endless scrolling! No wasted evenings!
            AUR³M is a structured dating journey — from anonymous calls
            to verified dinner dates — built for busy professionals
            who are serious about finding a life partner.
          </p>
          <div className="flex flex-wrap gap-4 animate-reveal-up stagger-3">
            <Button
              variant="gold"
              size="xl"
              onClick={() => navigate("/signup")}
            >
              Start for free
            </Button>
            <Button
              variant="hero-outline"
              size="xl"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See how it works
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-primary-foreground/60 text-sm font-body animate-reveal-up stagger-4">
             <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
              Just £20/month to start connecting
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
              30-day money-back guarantee
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
              Anonymous until you both decide to reveal verified identity
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
