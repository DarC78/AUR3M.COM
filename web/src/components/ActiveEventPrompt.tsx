import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, getAuthToken } from "@/lib/api";
import type { SpeedRoundEvent, EventType } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface ActiveEventPromptProps {
  /** If true, auto-navigate to lobby without prompting (used on initial login) */
  autoJoin?: boolean;
  /** Current user membership — free members won't be auto-redirected */
  membership?: "free" | "paid";
  /** Event mode to fetch */
  eventMode?: EventType;
}

const POLL_INTERVAL = 30_000;

const ActiveEventPrompt = ({ autoJoin = false, membership, eventMode = "live" }: ActiveEventPromptProps) => {
  const navigate = useNavigate();
  const [activeEvent, setActiveEvent] = useState<SpeedRoundEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const hasAutoJoined = useRef(false);
  const dismissedEventIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!getAuthToken()) return;

    const checkForActiveEvent = async () => {
      try {
        const res = await api.getUpcomingSpeedRounds(eventMode);
        const events = res.events ?? [];
        const now = new Date();
        const active = events.find((e) => {
          const start = new Date(e.starts_at);
          const end = new Date(e.ends_at);
          return e.status === "active" || e.status === "test" || (now >= start && now <= end);
        });

        if (active) {
          setActiveEvent(active);

          if (autoJoin && !hasAutoJoined.current && !sessionStorage.getItem("lobbyAutoJoined")) {
            hasAutoJoined.current = true;
            sessionStorage.setItem("lobbyAutoJoined", "1");
            api.enterLobby(active.id).catch(() => {});
            navigate("/lobby");
          } else if (!autoJoin && !dismissed && !dismissedEventIds.current.has(active.id)) {
            setDialogOpen(true);
          }
        } else {
          setActiveEvent(null);
          setDialogOpen(false);
        }
      } catch {
        // Non-critical
      }
    };

    checkForActiveEvent();
    const interval = setInterval(checkForActiveEvent, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [navigate, autoJoin, dismissed, eventMode]);

  const handleJoin = () => {
    if (activeEvent) {
      api.enterLobby(activeEvent.id).catch(() => {});
    }
    setDialogOpen(false);
    navigate("/lobby");
  };

  const handleDismiss = () => {
    if (activeEvent) {
      dismissedEventIds.current.add(activeEvent.id);
    }
    setDismissed(true);
    setDialogOpen(false);
  };

  return (
    <>
      {activeEvent && (
        <div className="mx-auto max-w-4xl px-4 mt-4">
          <div className="flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/5 px-5 py-3">
            <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {activeEvent.title ?? "Speed Round"} is live!
              </p>
              <p className="text-xs text-muted-foreground">Join now to start matching</p>
            </div>
            {activeEvent.event_type && (
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {activeEvent.event_type}
              </span>
            )}
            <Button variant="gold" size="sm" onClick={handleJoin}>
              Join Lobby
            </Button>
          </div>
        </div>
      )}

      {!autoJoin && (
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-gold" />
              </div>
              <DialogTitle className="text-center">Speed Round is Live!</DialogTitle>
              <DialogDescription className="text-center">
                {activeEvent?.title
                  ? `"${activeEvent.title}" is happening right now.`
                  : "A speed round event is happening right now."}{" "}
                Would you like to join the lobby?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" className="flex-1" onClick={handleDismiss}>
                Maybe later
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleJoin}>
                Join lobby
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ActiveEventPrompt;
