import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Crown, Check, Utensils, Star } from "lucide-react";
import { api, getAuthToken } from "@/lib/api";
import { toast } from "sonner";
import type { Membership, PaymentStatus } from "@/lib/api";

interface PlanInfo {
  tier: Membership;
  name: string;
  price: string;
  features: string[];
}

interface AddOnInfo {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: React.ElementType;
}

const FREE_PLAN: PlanInfo = {
  tier: "free",
  name: "Free",
  price: "£0",
  features: [
    "Browse member directory",
    "View upcoming Speed Rounds",
    "Preview profiles",
  ],
};

const PAID_PLAN: PlanInfo = {
  tier: "paid",
  name: "Member",
  price: "£20/month",
  features: [
    "Anonymous 3-minute Speed Rounds",
    "15-minute & 60-minute video calls (mutually agreed)",
    "Mutual match notifications",
    "Browse member directory",
  ],
};

const ADD_ONS: AddOnInfo[] = [
  {
    id: "date",
    name: "In-person Date",
    price: "£200/date",
    description: "Meet your match at a premium London restaurant — ID-verified, safe, and curated.",
    features: [
      "Premium restaurant offline date",
      "ID-verified connections",
      "Venue briefed for your comfort",
    ],
    icon: Utensils,
  },
  {
    id: "coaching",
    name: "Coaching Programme",
    price: "£1,000/programme",
    description: "A 3-month relationship coaching programme for couples ready to invest in lasting love.",
    features: [
      "Personal Relationship Professional",
      "3-month structured programme",
      "Priority support",
    ],
    icon: Star,
  },
];

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'InitiateCheckout');
      }
      const { url } = await api.createCheckoutSession("paid");
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout");
      setUpgrading(false);
    }
  };

  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/login");
      return;
    }
    api.getPaymentStatus()
      .then((ps) => {
        setPaymentStatus(ps);
        setLoading(false);
      })
      .catch(() => {
        // If payment status fails (e.g. free user with no record), fall back to profile
        api.getProfile().then((p) => {
          setPaymentStatus({
            membership: p.membership,
            status: "none",
            current_period_end: "",
            cancel_at_period_end: false,
          });
          setLoading(false);
        }).catch(() => setLoading(false));
      });
  }, [navigate]);

  const isPaid = paymentStatus?.membership === "paid";
  const currentPlan = isPaid ? PAID_PLAN : FREE_PLAN;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center h-16 gap-4">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-semibold text-foreground">Subscription</h1>
        </div>
      </header>

      <main className="container py-10 max-w-4xl space-y-12">
        {/* Current plan status */}
        <p className="text-muted-foreground">
          You're currently on the <span className="font-semibold text-foreground">{currentPlan.name}</span> plan.
        </p>

        {/* All plan & add-on cards in one uniform grid */}
        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl items-stretch">
          {/* Free plan */}
          <div
            className={`rounded-xl border-2 bg-card p-6 flex flex-col transition-shadow duration-300 hover:shadow-lg ${
              !isPaid ? "border-foreground/20 ring-2 ring-foreground/10 ring-offset-2 ring-offset-background" : "border-border"
            }`}
          >
            <h3 className="font-display text-lg font-semibold text-foreground mb-1">{FREE_PLAN.name}</h3>
            <p className="text-2xl font-bold text-foreground mb-4">{FREE_PLAN.price}</p>

            <ul className="space-y-2 flex-1 mb-6">
              {FREE_PLAN.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-forest-light shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              {!isPaid ? (
                <Button variant="outline" disabled className="w-full">
                  Current plan
                </Button>
              ) : (
                <Button variant="outline" disabled className="w-full text-muted-foreground">
                  Free tier
                </Button>
              )}
              <p className="text-center text-sm mt-3 invisible">placeholder</p>
            </div>
          </div>

          {/* Paid plan */}
          <div
            className={`rounded-xl border-2 bg-card p-6 flex flex-col transition-shadow duration-300 hover:shadow-lg ${
              isPaid ? "border-gold ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-gold" />
              <h3 className="font-display text-lg font-semibold text-foreground">{PAID_PLAN.name}</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-4">{PAID_PLAN.price}</p>

            <ul className="space-y-2 flex-1 mb-6">
              {PAID_PLAN.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-forest-light shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              {isPaid ? (
                <Button variant="outline" disabled className="w-full">
                  Current plan
                </Button>
              ) : (
                <Button
                  variant="gold"
                  className="w-full"
                  disabled={upgrading}
                  onClick={handleUpgrade}
                >
                  {upgrading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Upgrade to Member — £20/month
                </Button>
              )}
              <p className="text-center text-sm font-medium text-gold mt-3">
                30-day money-back guarantee
              </p>
            </div>
          </div>

          {/* Add-on cards */}
          {ADD_ONS.map((addon) => (
            <div
              key={addon.id}
              className="rounded-xl border-2 border-border bg-card p-6 flex flex-col transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <addon.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">{addon.name}</h3>
                  <p className="text-lg font-bold text-foreground">{addon.price}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{addon.description}</p>

              <ul className="space-y-2 flex-1 mb-6">
                {addon.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-forest-light shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {!isPaid ? (
                  <Button variant="outline" disabled className="w-full text-muted-foreground">
                    Available only to members
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/dashboard")}
                  >
                    Book via your matches
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SubscriptionPage;
