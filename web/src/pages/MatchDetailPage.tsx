import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, MapPin, Briefcase, Calendar, ThumbsUp, Check, ArrowRight, Crown } from "lucide-react";
import AUR3MLogo from "@/components/AUR3MLogo";
import { format } from "date-fns";
import { api, getAuthToken } from "@/lib/api";
import type { Profile } from "@/lib/api";

interface MatchState {
  connection_id: string;
  matched_at: string;
  alias: string;
  tier: string;
  decision_status: string;
  gender?: string;
  location?: string;
  profession?: string;
  private_note?: string;
  next_call_at?: string;
}

const TIER_ORDER = ["3min", "15min", "60min", "date"];

const tierLabel = (tier: string) => {
  switch (tier) {
    case "3min": return "3-min Speed Round";
    case "15min": return "15-min Video Call";
    case "60min": return "60-min Deep Dive";
    case "date": return "In-person Date";
    default: return tier;
  }
};

const nextTier = (current: string): string | null => {
  const idx = TIER_ORDER.indexOf(current);
  if (idx === -1 || idx >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1];
};

const MatchDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const match = location.state as MatchState | undefined;
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (getAuthToken()) {
      api.getProfile().then(setProfile).catch(() => {});
    }
  }, []);

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground mb-4">Match not found</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const matchedDate = match.matched_at ? format(new Date(match.matched_at), "PPP 'at' p") : "Unknown";
  const next = nextTier(match.tier);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <AUR3MLogo size="sm" />
      </header>

      <div className="max-w-lg mx-auto px-6 py-10 space-y-8">
        {/* Avatar & Name */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mx-auto">
            <span className="text-3xl font-bold text-gold">{match.alias[0]?.toUpperCase()}</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{match.alias}</h1>
          <span className="inline-flex items-center gap-1.5 text-sm text-forest-light font-medium">
            <ThumbsUp className="w-4 h-4" /> Mutual Match
          </span>
        </div>

        {/* Info Card */}
        <div className="rounded-xl bg-card border border-border p-6 space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Matched on</p>
              <p className="text-foreground font-medium">{matchedDate}</p>
            </div>
          </div>

          {/* Completed phase */}
          <div className="flex items-center gap-3 text-sm">
            <Check className="w-4 h-4 text-forest-light shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Completed</p>
              <p className="text-foreground font-medium">{tierLabel(match.tier)}</p>
            </div>
          </div>

          {/* Next phase */}
          {next && (
            <div className="flex items-center gap-3 text-sm">
              <ArrowRight className="w-4 h-4 text-gold shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Next</p>
                <p className="text-foreground font-medium">{tierLabel(next)}</p>
                {match.next_call_at && (
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Scheduled: {format(new Date(match.next_call_at), "PPP 'at' p")}
                  </p>
                )}
              </div>
            </div>
          )}

          {match.gender && (
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Gender</p>
                <p className="text-foreground font-medium capitalize">{match.gender}</p>
              </div>
            </div>
          )}

          {match.location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Location</p>
                <p className="text-foreground font-medium">{match.location}</p>
              </div>
            </div>
          )}

          {match.profession && (
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Profession</p>
                <p className="text-foreground font-medium">{match.profession}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="rounded-xl bg-card border border-border p-6 space-y-2">
          <h2 className="font-display text-sm font-semibold text-foreground">My Notes</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {match.private_note || "No notes saved for this match."}
          </p>
        </div>

        {next === "date" && profile && profile.membership === "paid" && (
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={() => navigate(`/date/${match.connection_id}`)}
          >
            <Crown className="w-5 h-5 mr-2" />
            Book In-person Date
          </Button>
        )}

        {next === "date" && profile && profile.membership !== "paid" && (
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={() => navigate("/subscription")}
          >
            <Crown className="w-5 h-5 mr-2" />
            Become a Member for In-person Dates
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default MatchDetailPage;
