import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import AUR3MLogo from "@/components/AUR3MLogo";
import { api, getAuthToken } from "@/lib/api";
import type { ApiRequestError, DatePaymentStatusV2, EveningSlot, VerificationStatus } from "@/lib/api";
import {
  Loader2,
  CreditCard,
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants & helpers ─────────────────────────────────────────────────────

const EVENING_TIMES = [
  { value: "18:00", label: "6:00 pm" },
  { value: "18:30", label: "6:30 pm" },
  { value: "19:00", label: "7:00 pm" },
  { value: "19:30", label: "7:30 pm" },
];

function generateEveningDays(): Date[] {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 7; i <= 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d);
  }
  return days;
}

function toISODate(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "payment" | "waiting" | "verification" | "verification_processing" | "calendar";

declare global {
  interface Window {
    Stripe?: (key: string) => {
      verifyIdentity: (clientSecret: string) => Promise<{ error?: { message: string } }>;
    };
  }
}

// ─── Stripe publishable key ─────────────────────────────────────────────────
const STRIPE_PK = "pk_live_51SrgPhJypLSPrkTAXSYl93ucBRqKI7HLVV0uGC3p0Zl18GEnSpOJyWSFpfeYbhHVhm5qo3NMsfGs11jOhRmZs6OO002NgCicnx";

// ─── Component ───────────────────────────────────────────────────────────────

const DateBookingPage = () => {
  const { relationshipId } = useParams<{ relationshipId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("payment");
  const [paymentStatus, setPaymentStatus] = useState<DatePaymentStatusV2 | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("not_started");
  const [partnerVerified, setPartnerVerified] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<EveningSlot[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allDays = generateEveningDays();
  const visibleDays = allDays.slice(weekOffset * 7, weekOffset * 7 + 7);
  const maxWeekOffset = Math.max(0, Math.ceil(allDays.length / 7) - 1);

  // ─── Determine step from payment + verification state ────────────────────
  const resolveStep = useCallback((status: DatePaymentStatusV2): Step => {
    if (!status.user_paid) return "payment";
    if (!status.both_paid) return "waiting";

    const userV = status.user_verification_status ?? "not_started";
    setVerificationStatus(userV);
    setPartnerVerified(status.both_verified ?? false);

    if (userV === "processing") return "verification_processing";
    if (userV !== "verified") return "verification";
    if (!status.both_verified) return "verification"; // show partner-waiting
    return "calendar";
  }, []);

  // ─── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/login");
      return;
    }
    if (!relationshipId) return;

    const load = async () => {
      try {
        try {
          const booking = await api.getDateBooking(relationshipId);
          if (booking && booking.status === "confirmed") {
            navigate(`/date/${relationshipId}/confirmed`, { replace: true });
            return;
          }
        } catch {
          // No booking yet
        }

        const status = await api.getDatePaymentStatus(relationshipId) as DatePaymentStatusV2;
        setPaymentStatus(status);
        setStep(resolveStep(status));
      } catch (err) {
        const apiError = err as ApiRequestError;
        if (apiError.status === 409) {
          setError("This relationship is not at the date stage yet.");
          setStep("payment");
        } else if (apiError.status === 404) {
          setError("Relationship not found.");
          setStep("payment");
        } else {
          setError(apiError.message || "Failed to load date status.");
          setStep("payment");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [relationshipId, navigate, resolveStep]);

  // ─── Refetch state (used after Stripe Identity returns) ──────────────────
  const refetchState = async () => {
    if (!relationshipId) return;
    setError(null);
    try {
      const status = await api.getDatePaymentStatus(relationshipId) as DatePaymentStatusV2;
      setPaymentStatus(status);
      setStep(resolveStep(status));
    } catch {
      // keep current step
    }
  };

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!relationshipId) return;
    setSubmitting(true);
    try {
      const { url } = await api.createDatePayment(relationshipId);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setSubmitting(false);
    }
  };

  const handleStartVerification = async () => {
    if (!relationshipId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.startIdentityVerification(relationshipId);

      if (result.verification_status === "verified") {
        setVerificationStatus("verified");
        await refetchState();
        setSubmitting(false);
        return;
      }

      if (!window.Stripe || !STRIPE_PK) {
        setError("Stripe is not loaded. Please refresh the page.");
        setSubmitting(false);
        return;
      }

      const stripe = window.Stripe(STRIPE_PK);
      const { error: stripeError } = await stripe.verifyIdentity(result.client_secret);

      if (stripeError) {
        setError(stripeError.message);
      }

      // Refetch state regardless — user may have completed or cancelled
      await refetchState();
    } catch (err) {
      const apiError = err as ApiRequestError;
      if (apiError.status === 403) {
        setError("You must pay the date booking fee before verifying your identity.");
      } else if (apiError.status === 409) {
        setError("This relationship is not at the date stage.");
      } else {
        setError(apiError.message || "Verification failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSlot = (date: string, time: string) => {
    setSelectedSlots((prev) => {
      const exists = prev.some((s) => s.date === date && s.time === time);
      if (exists) return prev.filter((s) => !(s.date === date && s.time === time));
      return [...prev, { date, time }];
    });
  };

  const isSlotSelected = (date: string, time: string) =>
    selectedSlots.some((s) => s.date === date && s.time === time);

  const handleSubmitSlots = async () => {
    if (!relationshipId || selectedSlots.length === 0) return;
    setSubmitting(true);
    try {
      await api.submitDateAvailability(relationshipId, selectedSlots);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save availability");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
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
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => navigate("/")} className="transition-opacity hover:opacity-80">
            <AUR3MLogo size="sm" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        </div>
      </header>

      <main className="container py-12 max-w-lg">
        {/* ── Step: Payment ─────────────────────────────────────────────── */}
        {step === "payment" && (
          <ScrollReveal>
            <div className="text-center space-y-8">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto">
                <CalendarHeart className="w-8 h-8 text-gold" />
              </div>
              <div className="space-y-3">
                <h1 className="font-display text-2xl font-semibold text-foreground">
                  Progress to an in-person date
                </h1>
                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  You and your match both said yes after your 60-minute call.
                  The next step is a verified, safe evening date arranged by AUR³M.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-4 text-left">
                <h3 className="font-semibold text-foreground">How in-person dates work</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-gold/10 text-gold flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                    Both of you pay a one-time £200 date booking fee
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-gold/10 text-gold flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                    Verify your identity with a quick ID check
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-gold/10 text-gold flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                    Select your evening availability (6–8 pm, 7–30 days out)
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-gold/10 text-gold flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                    We match a slot, send a confirmation email, and book the venue
                  </li>
                </ul>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    If only one of you pays, we'll automatically refund after 30 days.
                  </p>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {!error && (
                <Button variant="gold" size="xl" className="w-full" onClick={handlePay} disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  ) : (
                    <><CreditCard className="w-5 h-5" /> Pay £200 — Book your date</>
                  )}
                </Button>
              )}

              {error && (
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Back to Dashboard
                </Button>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* ── Step: Waiting for partner payment ─────────────────────────── */}
        {step === "waiting" && (
          <ScrollReveal>
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-gold" />
              </div>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                Waiting for your match
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                You've paid — now we're waiting for your match to do the same.
                Once they pay, you'll both verify your identity and pick evening availability.
              </p>
              {paymentStatus?.payment_deadline && (
                <p className="text-xs text-muted-foreground">
                  If they haven't paid by{" "}
                  {new Date(paymentStatus.payment_deadline).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  , you'll be fully refunded.
                </p>
              )}
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </ScrollReveal>
        )}

        {/* ── Step: Identity Verification ───────────────────────────────── */}
        {step === "verification" && (
          <ScrollReveal>
            <div className="text-center space-y-8">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-gold" />
              </div>
              <div className="space-y-3">
                <h1 className="font-display text-2xl font-semibold text-foreground">
                  Verify your identity before your date
                </h1>
                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  Both people must complete identity verification after payment before the date can be confirmed.
                  This keeps everyone safe.
                </p>
              </div>

              {/* Status indicators */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your verification</span>
                  <VerificationBadge status={verificationStatus} />
                </div>
                <div className="border-t border-border" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your match's verification</span>
                  {partnerVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                      <Check className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {verificationStatus === "verified" && !partnerVerified ? (
                <>
                  <div className="rounded-xl border border-border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                      You're verified! Waiting for your match to complete their verification.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={refetchState}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Refresh status
                  </Button>
                </>
              ) : verificationStatus !== "verified" ? (
                <Button
                  variant="gold"
                  size="xl"
                  className="w-full"
                  onClick={handleStartVerification}
                  disabled={submitting}
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</>
                  ) : (
                    <><ShieldCheck className="w-5 h-5" /> Verify your identity</>
                  )}
                </Button>
              ) : null}

              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </ScrollReveal>
        )}

        {/* ── Step: Verification processing ─────────────────────────────── */}
        {step === "verification_processing" && (
          <ScrollReveal>
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-gold" />
              </div>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                Verification under review
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Your identity verification is being processed.
                This usually takes just a few minutes. We'll update your status automatically.
              </p>
              <Button variant="outline" size="sm" onClick={refetchState}>
                <RefreshCw className="w-4 h-4 mr-1" /> Refresh status
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </ScrollReveal>
        )}

        {/* ── Step: Calendar — evening slots ────────────────────────────── */}
        {step === "calendar" && !submitted && (
          <ScrollReveal>
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto">
                  <CalendarHeart className="w-8 h-8 text-gold" />
                </div>
                <h1 className="font-display text-2xl font-semibold text-foreground">
                  Pick your evenings
                </h1>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Select the evening slots when you're available for a date.
                  Only times between 6:00 and 8:00 pm are shown, 7–30 days from today.
                </p>
              </div>

              {/* Week navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
                  disabled={weekOffset === 0}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition-all active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-muted-foreground font-medium">
                  {visibleDays.length > 0
                    ? `${formatShortDate(visibleDays[0])} — ${formatShortDate(visibleDays[visibleDays.length - 1])}`
                    : ""}
                </span>
                <button
                  onClick={() => setWeekOffset((w) => Math.min(maxWeekOffset, w + 1))}
                  disabled={weekOffset >= maxWeekOffset}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition-all active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Slot grid */}
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left p-1.5 text-muted-foreground font-normal w-20" />
                      {visibleDays.map((d) => (
                        <th key={toISODate(d)} className="p-1.5 text-center text-muted-foreground font-normal min-w-[52px]">
                          <div className="text-[10px]">{d.toLocaleDateString("en-GB", { weekday: "short" })}</div>
                          <div className="text-foreground font-medium text-sm">{d.getDate()}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {EVENING_TIMES.map((time) => (
                      <tr key={time.value}>
                        <td className="p-1.5 text-muted-foreground whitespace-nowrap font-medium">
                          {time.label}
                        </td>
                        {visibleDays.map((d) => {
                          const dateStr = toISODate(d);
                          const selected = isSlotSelected(dateStr, time.value);
                          return (
                            <td key={`${dateStr}-${time.value}`} className="p-1 text-center">
                              <button
                                onClick={() => toggleSlot(dateStr, time.value)}
                                className={cn(
                                  "w-full h-10 rounded-lg transition-all duration-150 active:scale-90 border",
                                  selected
                                    ? "bg-gold/20 border-gold/40 shadow-sm"
                                    : "bg-card border-border hover:border-gold/30 hover:bg-gold/5"
                                )}
                              >
                                {selected && <Check className="w-3.5 h-3.5 text-gold mx-auto" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedSlots.length > 0 && (
                <p className="text-sm text-gold font-medium text-center">
                  {selectedSlots.length} evening slot{selectedSlots.length !== 1 ? "s" : ""} selected
                </p>
              )}

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button
                variant="gold"
                size="lg"
                className="w-full"
                disabled={selectedSlots.length === 0 || submitting}
                onClick={handleSubmitSlots}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : (
                  "Submit availability"
                )}
              </Button>
            </div>
          </ScrollReveal>
        )}

        {/* ── Step: Slots submitted — waiting for match ─────────────────── */}
        {step === "calendar" && submitted && (
          <ScrollReveal>
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-700" />
              </div>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                Availability submitted
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                We'll cross-reference your evening slots with your match's.
                Once we find a common time, you'll both receive a confirmation email with the venue details.
              </p>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </ScrollReveal>
        )}
      </main>
    </div>
  );
};

// ─── Verification badge sub-component ────────────────────────────────────────

const VerificationBadge = ({ status }: { status: VerificationStatus }) => {
  switch (status) {
    case "verified":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
          <Check className="w-3.5 h-3.5" /> Verified
        </span>
      );
    case "processing":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gold">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Under review
        </span>
      );
    case "requires_input":
    case "canceled":
      return (
        <span className="text-xs font-medium text-destructive">Action required</span>
      );
    default:
      return <span className="text-xs text-muted-foreground">Not started</span>;
  }
};

export default DateBookingPage;
