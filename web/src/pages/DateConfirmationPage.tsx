import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import AUR3MLogo from "@/components/AUR3MLogo";
import { api, getAuthToken } from "@/lib/api";
import type { DateBooking } from "@/lib/api";
import {
  Loader2,
  MapPin,
  CalendarHeart,
  Clock,
  ShieldCheck,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

const DateConfirmationPage = () => {
  const { relationshipId } = useParams<{ relationshipId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<DateBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/login");
      return;
    }
    if (!relationshipId) return;

    const load = async () => {
      try {
        const data = await api.getDateBooking(relationshipId);
        setBooking(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load booking");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [relationshipId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <Header navigate={navigate} />
        <main className="container py-16 max-w-lg text-center space-y-4">
          <p className="text-destructive font-medium">{error || "Booking not found"}</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </main>
      </div>
    );
  }

  const dateObj = new Date(booking.scheduled_at);
  const formattedDate = dateObj.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${booking.venue}, ${booking.venue_address}`
  )}`;

  return (
    <div className="min-h-screen bg-background">
      <Header navigate={navigate} />

      <main className="container py-12 max-w-lg space-y-8">
        {/* Hero confirmation */}
        <ScrollReveal>
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto">
              <CalendarHeart className="w-10 h-10 text-gold" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground leading-tight">
              Your Gold Date is confirmed
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
              You're meeting{" "}
              <span className="text-foreground font-medium">{booking.partner_first_name}</span>{" "}
              — here are the details.
            </p>
          </div>
        </ScrollReveal>

        {/* Date details card */}
        <ScrollReveal delay={0.1}>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Date & time */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Date & time</p>
                  <p className="text-foreground font-semibold mt-0.5">{formattedDate}</p>
                  <p className="text-foreground">{formattedTime}</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Venue */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground font-medium">Venue</p>
                  <p className="text-foreground font-semibold mt-0.5">{booking.venue}</p>
                  {booking.venue_address && (
                    <p className="text-sm text-muted-foreground mt-0.5">{booking.venue_address}</p>
                  )}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gold hover:text-gold-dark transition-colors mt-2 font-medium"
                  >
                    Open in Maps <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Partner */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0 text-gold font-display font-semibold text-lg">
                  {booking.partner_first_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Your date</p>
                  <p className="text-foreground font-semibold mt-0.5">
                    {booking.partner_first_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    First name only — AUR³M never shares personal details. Any exchange of contact information is entirely up to you both, in person.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Safety information */}
        <ScrollReveal delay={0.2}>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-forest-light" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                Safety & privacy
              </h2>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-light shrink-0 mt-2" />
                Both members have been verified by AUR³M through the full matching funnel.
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-light shrink-0 mt-2" />
                AUR³M will never share your personal details with your date. If you both wish to exchange contact information, that's entirely your choice to do in person.
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-light shrink-0 mt-2" />
                The venue has been vetted — it's a public, well-attended location.
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-light shrink-0 mt-2" />
                If you feel uncomfortable at any point, leave and contact our safety team.
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-light shrink-0 mt-2" />
                Let a trusted friend know where you're going and when you expect to be back.
              </li>
            </ul>
            <div className="pt-2 border-t border-border">
              <a
                href="mailto:safety@aur3m.com"
                className="text-sm text-gold hover:text-gold-dark transition-colors font-medium"
              >
                Contact safety team → safety@aur3m.com
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* Actions */}
        <ScrollReveal delay={0.3}>
          <div className="space-y-3">
            {booking.status === "completed" ? (
              <Button
                variant="gold"
                size="lg"
                className="w-full"
                onClick={() => navigate(`/date/${relationshipId}/feedback`)}
              >
                Leave feedback
              </Button>
            ) : (
              <Button
                variant="gold"
                size="lg"
                className="w-full"
                onClick={() => window.open(googleMapsUrl, "_blank")}
              >
                <MapPin className="w-5 h-5" /> Get directions
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
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

export default DateConfirmationPage;
