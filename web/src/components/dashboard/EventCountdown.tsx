import { useState, useEffect } from "react";
import { CalendarHeart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { UpcomingCall } from "@/lib/api";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(targetDate: Date): TimeLeft | null {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

interface EventCountdownProps {
  event: UpcomingCall;
}

const EventCountdown = ({ event }: EventCountdownProps) => {
  const navigate = useNavigate();
  const targetDate = new Date(event.scheduled_at);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      const tl = getTimeLeft(targetDate);
      setTimeLeft(tl);
      if (!tl) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate.getTime()]);

  const isLive = !timeLeft;
  const formattedDate = targetDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative rounded-2xl border-2 border-gold/30 bg-gradient-to-br from-gold/5 via-card to-gold/5 p-6 md:p-8 overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        {/* Icon & event info */}
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
            <CalendarHeart className="w-6 h-6 text-gold" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gold mb-1">
              {isLive ? "Happening now" : "Next Speed Round"}
            </p>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {event.title ?? "Speed Round"}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5" />
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Countdown digits */}
        {isLive ? (
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-light opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-forest-light" />
            </span>
            <Button
              variant="gold"
              size="lg"
              onClick={() => navigate(`/lobby?eventId=${event.id}&scheduledAt=${encodeURIComponent(event.scheduled_at)}`)}
            >
              Join now
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {[
              { value: timeLeft.days, label: "days" },
              { value: timeLeft.hours, label: "hrs" },
              { value: timeLeft.minutes, label: "min" },
              { value: timeLeft.seconds, label: "sec" },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center">
                <span className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-display text-2xl font-bold text-foreground tabular-nums">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCountdown;
