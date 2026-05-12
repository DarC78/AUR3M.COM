import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useNavigate } from "react-router-dom";

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 md:py-32 bg-primary">
      <div className="container max-w-2xl text-center">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-primary-foreground mb-6">
            You deserve better than another swipe
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            Join thousands of London professionals who stopped settling
            for surface-level connections and started investing in
            finding a real partner.
          </p>
          <Button
            variant="gold"
            size="xl"
            onClick={() => navigate("/signup")}
            >
            Start for free
          </Button>
          <p className="text-primary-foreground/50 text-sm mt-4">
            Just £20/month · 30-day money-back guarantee · Cancel anytime
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
};
