import { useState, useEffect, useRef, useCallback } from "react";
import type { SlotPeriod } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Users, Loader2, AlertCircle, Zap, Clock, ArrowLeft } from "lucide-react";
import { api, getAuthToken } from "@/lib/api";
import type { JoinResult } from "@/lib/api";
import { getEventMode } from "@/lib/utm";
import AUR3MLogo from "@/components/AUR3MLogo";
import LobbyWaitingList from "@/components/lobby/LobbyWaitingList";
import PostCallDecision from "@/components/lobby/PostCallDecision";
import {
  connect as twilioConnect,
  Room,
  LocalVideoTrack,
  LocalAudioTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteVideoTrack,
  RemoteAudioTrack,
} from "twilio-video";

type LobbyStatus = "browsing" | "matching" | "in-call" | "decision" | "complete";

const CALL_DURATION = 180; // 3 minutes

const LobbyPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scheduledAtParam = searchParams.get("scheduledAt");
  const eventIdParam = searchParams.get("eventId");

  // Future-event countdown state
  const [futureCountdown, setFutureCountdown] = useState<string | null>(null);

  const [status, setStatus] = useState<LobbyStatus>("browsing");
  const [countdown, setCountdown] = useState(CALL_DURATION);
  const [callNumber, setCallNumber] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isTestUser, setIsTestUser] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(eventIdParam);
  const [partnerInfo, setPartnerInfo] = useState<{ alias?: string; gender?: string; age_bracket?: string; location?: string } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedSessionRef = useRef<string | null>(null);
  const statusRef = useRef<LobbyStatus>("browsing");
  const matchingRunRef = useRef(0);

  // Video refs
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);

  // Track the effective event id for enter/leave lobby
  const effectiveEventId = eventId || (isTestUser ? "test-event" : "");

  // Countdown for future events
  useEffect(() => {
    if (!scheduledAtParam) return;
    const target = new Date(scheduledAtParam).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setFutureCountdown(null);
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      const parts: string[] = [];
      if (d > 0) parts.push(`${d}d`);
      if (h > 0) parts.push(`${h}h`);
      parts.push(`${m}m`);
      parts.push(`${s}s`);
      setFutureCountdown(parts.join(" "));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [scheduledAtParam]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const completeSessionOnBackend = useCallback((sid?: string | null) => {
    const targetSessionId = sid ?? sessionId;
    if (!targetSessionId || completedSessionRef.current === targetSessionId) return;
    completedSessionRef.current = targetSessionId;
    api.completeSession(targetSessionId).catch(() => {
      completedSessionRef.current = null;
    });
  }, [sessionId]);

  // Init: check auth, membership, load event, enter lobby
  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/login");
      return;
    }

    let userIsTest = false;
    let resolvedEventId: string | null = null;

    const init = async () => {
      try {
        const profile = await api.getProfile();
        if (profile.membership === "free" || !profile.membership) {
          navigate("/subscription");
          return;
        }
        if (profile.alias?.toLowerCase().includes("ionpopescu")) {
          userIsTest = true;
          setIsTestUser(true);
        }
      } catch {
        // continue
      }

      try {
        const res = await api.getUpcomingSpeedRounds(getEventMode());
        if (res.events?.length) {
          resolvedEventId = res.events[0].id;
          setEventId(resolvedEventId);
        } else if (!userIsTest) {
          setError("No speed round events are currently scheduled. Please check back later.");
        }
      } catch {
        if (!userIsTest) {
          setError("Could not load events. Please check back later.");
        }
      }

      // Enter lobby so others can see us
      const eid = resolvedEventId || (userIsTest ? "test-event" : "");
      if (eid) {
        api.enterLobby(eid).catch(() => {});
      }
    };

    init();

    // Leave lobby on unmount
    return () => {
      const eid = resolvedEventId || (userIsTest ? "test-event" : "");
      if (eid) {
        api.leaveLobby(eid).catch(() => {});
      }
    };
  }, [navigate]);

  // Re-enter lobby whenever user is back in browsing state
  useEffect(() => {
    if (status !== "browsing" || !effectiveEventId) return;
    api.enterLobby(effectiveEventId).catch(() => {});
  }, [status, effectiveEventId]);

  // Countdown timer for in-call
  useEffect(() => {
    if (status !== "in-call") return;
    if (countdown <= 0) {
      completeSessionOnBackend();
      cleanupRoom();
      setStatus("decision");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, completeSessionOnBackend]);

  const stopPolling = useCallback(() => {
    matchingRunRef.current += 1;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const cleanupRoom = useCallback(() => {
    stopPolling();
    if (roomRef.current) {
      roomRef.current.localParticipant.tracks.forEach((pub) => {
        if (pub.track && (pub.track instanceof LocalVideoTrack || pub.track instanceof LocalAudioTrack)) {
          pub.track.stop();
        }
      });
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.innerHTML = "";
    if (remoteVideoRef.current) remoteVideoRef.current.innerHTML = "";
  }, [stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
      cleanupRoom();
    };
  }, [cleanupRoom, stopPolling]);

  const attachRemoteParticipant = (participant: RemoteParticipant) => {
    const handleTrack = (track: RemoteTrack) => {
      if (track.kind === "video" || track.kind === "audio") {
        const el = (track as RemoteVideoTrack | RemoteAudioTrack).attach();
        if (track.kind === "video") {
          el.style.width = "100%";
          el.style.height = "100%";
          el.style.objectFit = "cover";
        }
        remoteVideoRef.current?.appendChild(el);
      }
    };
    participant.tracks.forEach((pub) => {
      if (pub.isSubscribed && pub.track) handleTrack(pub.track);
    });
    participant.on("trackSubscribed", handleTrack);
  };

  const connectToRoom = async (joinRes: JoinResult) => {
    if (!joinRes.session_id || !joinRes.room_name) return;
    if (statusRef.current !== "matching") {
      completeSessionOnBackend(joinRes.session_id);
      return;
    }

    stopPolling();
    completedSessionRef.current = null;
    setSessionId(joinRes.session_id);
    setPartnerInfo({
      alias: joinRes.partner_alias,
      gender: joinRes.partner_gender,
      age_bracket: joinRes.partner_age_bracket,
      location: joinRes.partner_location,
    });
    setCallNumber((n) => n + 1);

    const tokenRes = await api.getTwilioToken(joinRes.room_name);

    const room = await twilioConnect(tokenRes.token, {
      name: tokenRes.room_name,
      audio: true,
      video: { width: 640, height: 480 },
    });

    roomRef.current = room;

    // Safety: if no remote participant joins within 12s, abort (stale match)
    const soloTimeout = setTimeout(() => {
      if (room.participants.size === 0 && roomRef.current === room) {
        console.warn("[Lobby] No remote participant after 12s — aborting stale match");
        completeSessionOnBackend(joinRes.session_id);
        cleanupRoom();
        setStatus("browsing");
      }
    }, 12_000);

    room.on("participantConnected", () => clearTimeout(soloTimeout));
    // If already connected, clear immediately
    if (room.participants.size > 0) clearTimeout(soloTimeout);

    const attachLocalVideo = (track: LocalVideoTrack) => {
      const el = track.attach();
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.objectFit = "cover";
      localVideoRef.current?.appendChild(el);
    };

    room.localParticipant.videoTracks.forEach((pub) => {
      if (pub.track) attachLocalVideo(pub.track as LocalVideoTrack);
    });

    // Handle tracks that publish after connect
    room.localParticipant.on("trackPublished", (pub) => {
      if (pub.track && pub.track.kind === "video") {
        attachLocalVideo(pub.track as LocalVideoTrack);
      }
    });

    room.participants.forEach(attachRemoteParticipant);
    room.on("participantConnected", attachRemoteParticipant);
    room.on("participantDisconnected", () => {
      completeSessionOnBackend(joinRes.session_id);
      cleanupRoom();
      setStatus("decision");
    });
    room.on("disconnected", () => {
      completeSessionOnBackend(joinRes.session_id);
      cleanupRoom();
      setStatus("decision");
    });

    setCountdown(CALL_DURATION);
    setStatus("in-call");
  };

  const startMatching = async () => {
    const currentEventId = effectiveEventId;
    if (!currentEventId) {
      setError("No speed round event is currently scheduled.");
      return;
    }

    const runId = matchingRunRef.current + 1;
    matchingRunRef.current = runId;
    setError(null);
    setStatus("matching");

    try {
      const joinRes: JoinResult = await api.joinSpeedRound(currentEventId);

      if (runId !== matchingRunRef.current || statusRef.current !== "matching") {
        if (joinRes.session_id) completeSessionOnBackend(joinRes.session_id);
        return;
      }

      if (joinRes.matched && joinRes.session_id && joinRes.room_name) {
        await connectToRoom(joinRes);
        return;
      }

      // Not matched yet — poll every 4s, but DON'T start video
      pollingRef.current = setInterval(async () => {
        try {
          const pollRes: JoinResult = await api.joinSpeedRound(currentEventId);

          if (runId !== matchingRunRef.current || statusRef.current !== "matching") {
            if (pollRes.session_id) completeSessionOnBackend(pollRes.session_id);
            return;
          }

          if (pollRes.matched && pollRes.session_id && pollRes.room_name) {
            await connectToRoom(pollRes);
          }
        } catch (err) {
          if (runId !== matchingRunRef.current || statusRef.current !== "matching") return;
          stopPolling();
          setError(err instanceof Error ? err.message : "Polling failed");
          setStatus("browsing");
        }
      }, 4000);
    } catch (err) {
      if (runId !== matchingRunRef.current || statusRef.current !== "matching") return;
      setError(err instanceof Error ? err.message : "Failed to connect");
      setStatus("browsing");
    }
  };

  const cancelMatching = () => {
    stopPolling();
    setStatus("browsing");
  };

  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  const handlePostCallSubmit = async (data: {
    decision: "yes" | "pass";
    wasProfessional: boolean | null;
    feltUnsafe: boolean | null;
    privateNote: string;
    availableSlots: { date: string; period: SlotPeriod }[];
  }) => {
    if (!sessionId) return;
    setError(null);
    setDecisionSubmitting(true);
    try {
      const res = await api.submitDecision({ session_id: sessionId, decision: data.decision });

      api.submitFeedback({
        session_id: sessionId,
        was_professional: data.wasProfessional,
        felt_unsafe: data.feltUnsafe,
        private_note: data.privateNote,
      }).catch(() => {});

      if (data.decision === "yes" && data.availableSlots.length > 0) {
        api.submitAvailability({
          session_id: sessionId,
          slots: data.availableSlots,
        }).catch(() => {});
      }

      if (res.both_decided && res.matched) {
        // TODO: Show "Matched!" celebration
      }

      // Clean reset: clear ALL call/session state before returning to lobby
      const targetEventId = effectiveEventId;
      setSessionId(null);
      setPartnerInfo(null);
      completedSessionRef.current = null;
      stopPolling();

      // Re-enter lobby and wait for it to register before showing the list
      if (targetEventId) {
        await api.enterLobby(targetEventId).catch(() => {});
      }

      // Bump callNumber to force LobbyWaitingList to get a fresh key/remount
      setCallNumber((n) => n + 1);
      setStatus("browsing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit decision");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-foreground flex flex-col">
      <header className="border-b border-primary-foreground/10 px-6 py-4 flex items-center justify-between">
        <AUR3MLogo size="sm" className="brightness-0 invert" />
        <div className="text-sm text-primary-foreground/60">
          {callNumber > 0
            ? `Speed Round · Call ${callNumber}`
            : "Speed Round Lobby"}
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        {error && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 max-w-md">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          </div>
        )}

        {/* Future event countdown */}
        {futureCountdown && (
          <div className="text-center space-y-8 animate-fade-in max-w-md w-full">
            <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-gold" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold text-primary-foreground mb-3">
                This event starts in
              </h1>
              <p className="font-mono text-4xl font-bold text-gold tabular-nums tracking-wide mb-4">
                {futureCountdown}
              </p>
              <p className="text-primary-foreground/60 leading-relaxed">
                Come back when the countdown reaches zero to join the speed round.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="border-gold/40 text-gold hover:bg-gold/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        )}

        {/* Browsing or Matching — show lists + action button */}
        {!futureCountdown && (status === "browsing" || status === "matching") && (
          <div className="text-center space-y-8 animate-fade-in max-w-md w-full">
            <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mx-auto">
              {status === "matching" ? (
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
              ) : (
                <Users className="w-8 h-8 text-gold" />
              )}
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold text-primary-foreground mb-3">
                {status === "matching"
                  ? "Finding your match…"
                  : "Ready for your anonymous video call?"}
              </h1>
              <p className="text-primary-foreground/60 leading-relaxed">
                {status === "matching"
                  ? "We're looking for someone who matches your profile. The video will start once we find a match."
                  : "You'll be connected with someone who matches your profile. The call is completely anonymous — just be yourself."}
              </p>
            </div>

            {status === "browsing" ? (
              <Button
                variant="gold"
                size="xl"
                disabled={!eventId && !isTestUser}
                onClick={startMatching}
              >
                {!eventId && !isTestUser ? "No event scheduled" : "Start matching"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={cancelMatching}
                className="border-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground"
              >
                Cancel matching
              </Button>
            )}

            <button
              onClick={() => navigate("/dashboard")}
              className="block mx-auto text-sm text-primary-foreground/40 hover:text-primary-foreground/60 transition-colors"
            >
              ← Back to dashboard
            </button>

            {/* Both lists always visible while in lobby */}
            {(eventId || isTestUser) && (
              <LobbyWaitingList
                key={`lobby-${callNumber}`}
                eventId={effectiveEventId}
                isVisible={true}
              />
            )}
          </div>
        )}

        {status === "in-call" && (
          <div className="w-full max-w-3xl animate-scale-in">
            {/* Partner profile bar */}
            {partnerInfo && (partnerInfo.alias || partnerInfo.gender || partnerInfo.age_bracket) && (
              <div className="flex items-center justify-center gap-4 mb-4 py-2 px-4 rounded-lg bg-foreground/60 text-primary-foreground/80 text-sm">
                {partnerInfo.alias && (
                  <span className="font-medium text-gold">{partnerInfo.alias}</span>
                )}
                {partnerInfo.gender && (
                  <span className="capitalize">{partnerInfo.gender}</span>
                )}
                {partnerInfo.age_bracket && (
                  <span>{partnerInfo.age_bracket}</span>
                )}
                {partnerInfo.location && (
                  <span>{partnerInfo.location}</span>
                )}
              </div>
            )}

            <div className="relative aspect-video bg-muted/20 rounded-2xl overflow-hidden mb-6">
              <div
                ref={remoteVideoRef}
                className="absolute inset-0"
              />

              <div className="absolute top-4 right-4 bg-foreground/80 backdrop-blur-sm rounded-full px-4 py-2">
                <span
                  className={`font-mono text-lg font-semibold tabular-nums ${
                    countdown <= 30
                      ? "text-destructive"
                      : "text-primary-foreground"
                  }`}
                >
                  {formatTime(countdown)}
                </span>
              </div>

              <div className="absolute bottom-4 right-4 w-40 aspect-video rounded-lg border-2 border-gold/40 overflow-hidden shadow-lg z-10">
                <div
                  ref={localVideoRef}
                  className="w-full h-full bg-muted/30"
                />
                <span className="absolute bottom-1 left-2 text-xs text-primary-foreground/70 font-medium">You</span>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button
                variant="destructive"
                size="lg"
                onClick={() => {
                  completeSessionOnBackend();
                  cleanupRoom();
                  setStatus("decision");
                }}
              >
                End call
              </Button>
            </div>
          </div>
        )}

        {status === "decision" && (
          <div className="w-full max-w-xl py-4">
            <PostCallDecision
              onSubmit={handlePostCallSubmit}
              submitting={decisionSubmitting}
              callTier="3min"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyPage;
