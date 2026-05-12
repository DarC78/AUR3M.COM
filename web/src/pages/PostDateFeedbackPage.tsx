import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import AUR3MLogo from "@/components/AUR3MLogo";
import { api, getAuthToken } from "@/lib/api";
import type { PostDateFeedbackResult } from "@/lib/api";
import {
  Loader2,
  Star,
  ShieldAlert,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  MapPin,
  HeartHandshake,
  Check,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { value: "conversation", label: "Great conversation", icon: MessageSquare },
  { value: "chemistry", label: "Real chemistry", icon: Sparkles },
  { value: "venue", label: "Loved the venue", icon: MapPin },
  { value: "overall_vibe", label: "Overall vibe", icon: HeartHandshake },
] as const;

const PostDateFeedbackPage = () => {
  const { relationshipId } = useParams<{ relationshipId: string }>();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [highlight, setHighlight] = useState<string>("");
  const [privateNote, setPrivateNote] = useState("");
  const [feltUnsafe, setFeltUnsafe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PostDateFeedbackResult | null>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/login");
    }
  }, [navigate]);

  const canSubmit = rating > 0 && highlight !== "";

  const handleSubmit = async () => {
    if (!relationshipId || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitPostDateFeedback({
        relationship_id: relationshipId,
        rating,
        highlight,
        private_note: privateNote.trim().slice(0, 500),
        felt_unsafe: feltUnsafe,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  // Result screen
  if (result) {
    return (
      <div className="min-h-screen bg-background">
        <Header navigate={navigate} />
        <main className="container py-12 max-w-lg">
          <ScrollReveal>
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-gold" />
              </div>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                Feedback submitted
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Thank you for sharing your experience. Your feedback helps us
                improve AUR³M for everyone.
              </p>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </ScrollReveal>
        </main>
      </div>
    );
  }

  // Feedback form
  return (
    <div className="min-h-screen bg-background">
      <Header navigate={navigate} />

      <main className="container py-12 max-w-lg space-y-8">
        <ScrollReveal>
          <div className="text-center space-y-3">
            <h1 className="font-display text-2xl font-semibold text-foreground">
              How was your date?
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Your feedback is confidential. It helps us improve the experience for everyone.
            </p>
          </div>
        </ScrollReveal>

        {/* Star rating */}
        <ScrollReveal delay={0.08}>
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <p className="text-sm font-medium text-foreground">Rate your experience</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoveredStar || rating);
                return (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1.5 rounded-lg transition-all duration-150 active:scale-90 hover:bg-gold/5"
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 transition-colors duration-150",
                        active ? "fill-gold text-gold" : "text-border"
                      )}
                    />
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {["", "Poor", "Below average", "Good", "Great", "Exceptional"][rating]}
              </p>
            )}
          </div>
        </ScrollReveal>

        {/* Highlight */}
        <ScrollReveal delay={0.14}>
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <p className="text-sm font-medium text-foreground">What stood out?</p>
            <div className="grid grid-cols-2 gap-2">
              {HIGHLIGHTS.map((h) => {
                const selected = highlight === h.value;
                const Icon = h.icon;
                return (
                  <button
                    key={h.value}
                    onClick={() => setHighlight(h.value)}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-lg border text-left text-sm transition-all duration-150 active:scale-[0.97]",
                      selected
                        ? "bg-gold/10 border-gold/40 text-foreground"
                        : "bg-background border-border text-muted-foreground hover:border-gold/25 hover:bg-gold/5"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", selected ? "text-gold" : "")} />
                    {h.label}
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Private note */}
        <ScrollReveal delay={0.2}>
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <p className="text-sm font-medium text-foreground">
              Anything else? <span className="text-muted-foreground font-normal">(optional)</span>
            </p>
            <textarea
              value={privateNote}
              onChange={(e) => setPrivateNote(e.target.value)}
              placeholder="Private note to AUR³M — your date won't see this"
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow"
            />
            <p className="text-xs text-muted-foreground text-right">{privateNote.length}/500</p>
          </div>
        </ScrollReveal>

        {/* Safety flag */}
        <ScrollReveal delay={0.26}>
          <button
            onClick={() => setFeltUnsafe((v) => !v)}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-150 active:scale-[0.98]",
              feltUnsafe
                ? "bg-destructive/5 border-destructive/30"
                : "bg-card border-border hover:border-border"
            )}
          >
            <ShieldAlert
              className={cn(
                "w-5 h-5 shrink-0",
                feltUnsafe ? "text-destructive" : "text-muted-foreground"
              )}
            />
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", feltUnsafe ? "text-destructive" : "text-foreground")}>
                I felt unsafe during this date
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Our team will review within 24 hours. This is confidential.
              </p>
            </div>
            <div
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                feltUnsafe ? "bg-destructive border-destructive" : "border-border"
              )}
            >
              {feltUnsafe && <Check className="w-3 h-3 text-destructive-foreground" />}
            </div>
          </button>
        </ScrollReveal>

        {/* Submit */}
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <ScrollReveal delay={0.3}>
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
            ) : (
              "Submit feedback"
            )}
          </Button>
        </ScrollReveal>
      </main>
    </div>
  );
};

function Header({ navigate }: { navigate: (path: string) => void }) {
  return (
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
  );
}

export default PostDateFeedbackPage;
