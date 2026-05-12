import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, ShieldAlert, Briefcase, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Decision = "yes" | "pass";
export type CallTier = "3min" | "15min" | "60min";

interface TimeSlot {
  date: string;
  period: "morning" | "afternoon" | "evening";
}

interface PostCallDecisionProps {
  onSubmit: (data: {
    decision: Decision;
    wasProfessional: boolean | null;
    feltUnsafe: boolean | null;
    privateNote: string;
    availableSlots: TimeSlot[];
  }) => void;
  submitting?: boolean;
  callTier?: CallTier;
}

const PERIODS = [
  { key: "morning" as const, label: "Morning", sub: "9 am – 12 pm" },
  { key: "afternoon" as const, label: "Afternoon", sub: "12 – 5 pm" },
  { key: "evening" as const, label: "Evening", sub: "5 – 9 pm" },
];

const TIER_CONFIG: Record<CallTier, { weeks: number; nextLabel: string; nextDuration: string }> = {
  "3min": { weeks: 3, nextLabel: "15-minute video call", nextDuration: "15 min" },
  "15min": { weeks: 4, nextLabel: "60-minute video call", nextDuration: "60 min" },
  "60min": { weeks: 0, nextLabel: "", nextDuration: "" },
};

type Step = "professional" | "unsafe" | "decision" | "details";

function generateDays(startOffset = 1, count: number): Date[] {
  const days: Date[] = [];
  const now = new Date();
  for (let i = startOffset; i < startOffset + count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function toISODate(d: Date) {
  return d.toISOString().split("T")[0];
}

const PostCallDecision = ({ onSubmit, submitting, callTier = "3min" }: PostCallDecisionProps) => {
  const [step, setStep] = useState<Step>("professional");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [wasProfessional, setWasProfessional] = useState<boolean | null>(null);
  const [feltUnsafe, setFeltUnsafe] = useState<boolean | null>(null);
  const [privateNote, setPrivateNote] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  const config = TIER_CONFIG[callTier];
  const totalDays = config.weeks * 7;
  const allDays = totalDays > 0 ? generateDays(1, totalDays) : [];
  const visibleDays = allDays.slice(weekOffset * 7, weekOffset * 7 + 7);
  const maxWeekOffset = Math.max(0, config.weeks - 1);
  const canGoBack = weekOffset > 0;
  const canGoForward = weekOffset < maxWeekOffset;
  const showSlotPicker = decision === "yes" && totalDays > 0;

  const nextCallDuration = callTier === "3min" ? "15-minute" : "60-minute";

  const toggleSlot = (date: string, period: TimeSlot["period"]) => {
    setSelectedSlots((prev) => {
      const exists = prev.some((s) => s.date === date && s.period === period);
      if (exists) return prev.filter((s) => !(s.date === date && s.period === period));
      return [...prev, { date, period }];
    });
  };

  const isSlotSelected = (date: string, period: TimeSlot["period"]) =>
    selectedSlots.some((s) => s.date === date && s.period === period);

  const handleSubmit = () => {
    if (!decision) return;
    onSubmit({
      decision,
      wasProfessional,
      feltUnsafe,
      privateNote,
      availableSlots: decision === "yes" ? selectedSlots : [],
    });
  };

  // ── Step 1: Was the member professional? ──
  if (step === "professional") {
    return (
      <div className="text-center space-y-8 animate-fade-in max-w-md mx-auto">
        <h2 className="font-display text-2xl font-semibold text-primary-foreground">
          Quick feedback
        </h2>
        <div className="p-5 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Briefcase className="w-5 h-5 text-primary-foreground/40" />
            <span className="text-primary-foreground/80">Was the member professional?</span>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => { setWasProfessional(true); setStep("unsafe"); }}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.97]",
                "bg-primary-foreground/5 text-primary-foreground/60 border border-primary-foreground/10 hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
              )}
            >
              Yes
            </button>
            <button
              onClick={() => { setWasProfessional(false); setStep("unsafe"); }}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.97]",
                "bg-primary-foreground/5 text-primary-foreground/60 border border-primary-foreground/10 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              )}
            >
              No
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Did you feel uncomfortable? ──
  if (step === "unsafe") {
    return (
      <div className="text-center space-y-8 animate-fade-in max-w-md mx-auto">
        <button onClick={() => setStep("professional")} className="flex items-center gap-1.5 text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors active:scale-[0.97] mx-auto">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="font-display text-2xl font-semibold text-primary-foreground">
          Your safety matters
        </h2>
        <div className="p-5 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <ShieldAlert className="w-5 h-5 text-primary-foreground/40" />
            <span className="text-primary-foreground/80">Did you feel uncomfortable or threatened?</span>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => { setFeltUnsafe(false); setStep("decision"); }}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.97]",
                "bg-primary-foreground/5 text-primary-foreground/60 border border-primary-foreground/10 hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
              )}
            >
              No, all good
            </button>
            <button
              onClick={() => { setFeltUnsafe(true); setStep("decision"); }}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.97]",
                "bg-primary-foreground/5 text-primary-foreground/60 border border-primary-foreground/10 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              )}
            >
              Yes, I did
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Thumbs up / down decision ──
  if (step === "decision") {
    const decisionText =
      callTier === "60min"
        ? "Would you like to progress to an in-person date with this person?"
        : `Would you like to have a ${nextCallDuration} anonymous conversation with this person?`;

    return (
      <div className="text-center space-y-8 animate-fade-in max-w-md mx-auto">
        <button onClick={() => setStep("unsafe")} className="flex items-center gap-1.5 text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors active:scale-[0.97] mx-auto">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="font-display text-2xl font-semibold text-primary-foreground">
          Your decision
        </h2>
        <p className="text-primary-foreground/60 leading-relaxed">
          {decisionText}
        </p>
        <p className="text-primary-foreground/40 text-sm">
          They won't know your decision, and they won't know your details.
        </p>
        <div className="flex justify-center gap-5">
          <button
            onClick={() => { setDecision("pass"); setStep("details"); }}
            className="group flex flex-col items-center gap-2.5 px-8 py-5 rounded-xl border-2 border-primary-foreground/15 hover:border-primary-foreground/30 bg-primary-foreground/5 hover:bg-primary-foreground/10 transition-all duration-200 active:scale-[0.97]"
          >
            <ThumbsDown className="w-7 h-7 text-primary-foreground/50 group-hover:text-primary-foreground/70 transition-colors" />
            <span className="text-primary-foreground/70 group-hover:text-primary-foreground font-medium transition-colors">
              Pass
            </span>
          </button>
          <button
            onClick={() => { setDecision("yes"); setStep("details"); }}
            className="group flex flex-col items-center gap-2.5 px-8 py-5 rounded-xl border-2 border-gold/30 hover:border-gold/60 bg-gold/10 hover:bg-gold/20 transition-all duration-200 active:scale-[0.97]"
          >
            <ThumbsUp className="w-7 h-7 text-gold group-hover:text-gold-dark transition-colors" />
            <span className="text-gold group-hover:text-gold-dark font-medium transition-colors">
              {callTier === "60min" ? "Yes, let's meet" : "Yes, continue"}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ── Step 4: Private notes + availability (if yes) ──
  return (
    <div className="animate-fade-in max-w-xl mx-auto space-y-8">
      {/* Back + Decision summary */}
      <button onClick={() => { setDecision(null); setStep("decision"); }} className="flex items-center gap-1.5 text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors active:scale-[0.97]">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="text-center">
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
          decision === "yes"
            ? "bg-gold/15 text-gold"
            : "bg-primary-foreground/10 text-primary-foreground/60"
        )}>
          {decision === "yes" ? (
            <><ThumbsUp className="w-4 h-4" /> You said yes</>
          ) : (
            <><ThumbsDown className="w-4 h-4" /> You passed</>
          )}
        </div>
      </div>

      {/* Private notes */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-primary-foreground/50 uppercase tracking-wider">
          Private notes
        </h3>
        <p className="text-xs text-primary-foreground/40">
          Only you can see this. Jot down your impressions for later.
        </p>
        <Textarea
          value={privateNote}
          onChange={(e) => setPrivateNote(e.target.value)}
          placeholder="What stood out? Any thoughts for later…"
          className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/25 min-h-[80px] resize-none"
          maxLength={500}
        />
      </div>

      {/* Slot picker — only if yes */}
      {showSlotPicker && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-primary-foreground/50 uppercase tracking-wider">
            Your availability (next {config.weeks} weeks)
          </h3>
          <p className="text-xs text-primary-foreground/40">
            Pick the time slots when you're free for a {config.nextDuration} call. If it's mutual, we'll find a common slot.
          </p>

          {/* Week navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              disabled={!canGoBack}
              className="p-1.5 rounded-md text-primary-foreground/40 hover:text-primary-foreground/70 disabled:opacity-20 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-primary-foreground/50">
              {visibleDays.length > 0
                ? `${formatShortDate(visibleDays[0])} — ${formatShortDate(visibleDays[visibleDays.length - 1])}`
                : ""}
            </span>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              disabled={!canGoForward}
              className="p-1.5 rounded-md text-primary-foreground/40 hover:text-primary-foreground/70 disabled:opacity-20 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-1 text-primary-foreground/30 font-normal" />
                  {visibleDays.map((d) => (
                    <th key={toISODate(d)} className="p-1 text-center text-primary-foreground/40 font-normal min-w-[52px]">
                      <div>{d.toLocaleDateString("en-GB", { weekday: "short" })}</div>
                      <div className="text-primary-foreground/60 font-medium">{d.getDate()}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period) => (
                  <tr key={period.key}>
                    <td className="p-1 pr-2 text-primary-foreground/40 whitespace-nowrap">
                      <div>{period.label}</div>
                      <div className="text-[10px] text-primary-foreground/25">{period.sub}</div>
                    </td>
                    {visibleDays.map((d) => {
                      const dateStr = toISODate(d);
                      const selected = isSlotSelected(dateStr, period.key);
                      return (
                        <td key={`${dateStr}-${period.key}`} className="p-0.5 text-center">
                          <button
                            onClick={() => toggleSlot(dateStr, period.key)}
                            className={cn(
                              "w-full aspect-square rounded-md transition-all duration-150 active:scale-90",
                              selected
                                ? "bg-gold/25 border border-gold/40"
                                : "bg-primary-foreground/5 border border-primary-foreground/8 hover:border-primary-foreground/20"
                            )}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedSlots.length > 0 && (
            <p className="text-xs text-gold/70">
              {selectedSlots.length} slot{selectedSlots.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </div>
      )}

      {/* 60min mutual yes → Gold upgrade prompt */}
      {callTier === "60min" && decision === "yes" && (
        <div className="p-5 rounded-xl bg-gold/10 border border-gold/20 space-y-2">
          <p className="text-sm font-medium text-gold">
            If the feeling is mutual, you'll both have the option to progress to an in-person Gold date.
          </p>
          <p className="text-xs text-primary-foreground/50">
            Gold dates are verified, safe meetings arranged by AUR³M — you'll see the upgrade option on your dashboard.
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="pt-2">
        <Button
          variant="gold"
          size="lg"
          className="w-full"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Submitting…" : "Submit & continue"}
        </Button>
      </div>
    </div>
  );
};

export default PostCallDecision;
