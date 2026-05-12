import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";

import { TrustSection } from "@/components/landing/TrustSection";
import { SafetySection } from "@/components/landing/SafetySection";
import { SuccessMetricsSection } from "@/components/landing/SuccessMetricsSection";
import { ReviewsSection } from "@/components/landing/ReviewsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FounderSection } from "@/components/landing/FounderSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { getAuthToken } from "@/lib/api";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (getAuthToken()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      
      <SafetySection />
      <TrustSection />
      <SuccessMetricsSection />
      <ReviewsSection />
      <FAQSection />
      <FounderSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
