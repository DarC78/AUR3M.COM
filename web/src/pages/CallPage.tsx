import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Clock } from "lucide-react";
import { api, getAuthToken } from "@/lib/api";
import type { ApiRequestError, UpcomingCall, SlotPeriod } from "@/lib/api";
import AUR3MLogo from "@/components/AUR3MLogo";
import PostCallDecision from "@/components/lobby/PostCallDecision";
import PartnerDetails from "@/components/call/PartnerDetails";
import CallGuidelines from "@/components/call/CallGuidelines";
import type { CallTier } from "@/components/lobby/PostCallDecision";
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

type PageStatus = "waiting" | "countdown" | "in-call" | "decision";

const CallPage = () => {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();

  const [call, setCall] = useState<UpcomingCall | null>(null);
  const [status, setStatus] = useState<PageStatus>("waiting");
  const [countdown, setCountdown] = useState(0);
  const [timeUntilStart, setTimeUntilStart] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const joinAttemptedRef = useRef(false);

  // Derive call tier from duration
  const callTier: CallTier = call?.duration_minutes === 60 ? "60min" : "15min";
  const callDuration = (call?.duration_minutes ?? 15) * 60; // seconds

  // Fetch call details
  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/login");
      return;
    }

    const fetchCall = async () => {
      try {
        const res = await api.getUpcomingCalls();
        const found = (res.upcoming ?? []).find((c) => c.id === callId);
        if (!found) {
          setError("Call not found");
          return;
        }
        setCall(found);
        setSessionId(found.session_id);

        const startTime = new Date(found.scheduled_at).getTime();
        const now = Date.now();
        if (now >= startTime - 60_000) {
          // Within 1 minute — ready to join
          setStatus("countdown");
        } else {
          setStatus("countdown");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load call");
      }
    };

    fetchCall();
  }, [callId, navigate]);

  // Update countdown to start time
  useEffect(() => {
    if (!call || status === "in-call" || status === "decision") return;

    const update = () => {
      const startTime = new Date(call.scheduled_at).getTime();
      const diffMs = startTime - Date.now();

      if (diffMs <= 0) {
        setTimeUntilStart("Starting now");
        // Auto-join
        if (!joinAttemptedRef.current) {
          joinAttemptedRef.current = true;
          joinCall();
        }
        return;
      }

      const mins = Math.floor(diffMs / 60_000);
      const secs = Math.floor((diffMs % 60_000) / 1000);

      if (mins > 60) {
        const hours = Math.floor(mins / 60);
        setTimeUntilStart(`${hours}h ${mins % 60}m`);
      } else {
        setTimeUntilStart(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [call, status]);

  const completeSessionOnBackend = useCallback(() => {
    if (sessionId) {
      api.completeSession(sessionId).catch(() => {});
    }
  }, [sessionId]);

  // In-call countdown
  useEffect(() => {
    if (status !== "in-call") return;
    if (countdown <= 0) {
      cleanupRoom();
      completeSessionOnBackend();
      setStatus("decision");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown]);

  const cleanupRoom = useCallback(() => {
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
  }, []);

  useEffect(() => {
    return () => cleanupRoom();
  }, [cleanupRoom]);

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

  const joinCall = async () => {
    if (!call) return;
    setError(null);

    try {
      const tokenRes = await api.getTwilioToken(call.room_name);
      const room = await twilioConnect(tokenRes.token, {
        name: tokenRes.room_name,
        audio: true,
        video: { width: 640, height: 480 },
      });

      roomRef.current = room;

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
        cleanupRoom();
        completeSessionOnBackend();
        setStatus("decision");
      });
      room.on("disconnected", () => {
        cleanupRoom();
        completeSessionOnBackend();
        setStatus("decision");
      });

      setCountdown(callDuration);
      setStatus("in-call");
    } catch (err) {
      const apiError = err as ApiRequestError;
      const is409 = apiError.status === 409 || apiError.message?.includes("409");
      if (is409) {
        setError("This session has expired and can no longer be joined.");
        setStatus("countdown");
      } else {
        setError(apiError.message || "Failed to join call");
      }
      joinAttemptedRef.current = false;
    }
  };

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
      await api.submitDecision({ session_id: sessionId, decision: data.decision });

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

      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (error && !call) {
    return (
      <div className="min-h-screen bg-foreground flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <p className="text-primary-foreground/70">{error}</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foreground flex flex-col">
      <header className="border-b border-primary-foreground/10 px-6 py-4 flex items-center justify-between">
        <AUR3MLogo size="sm" className="brightness-0 invert" />
        <div className="text-sm text-primary-foreground/60">
          {call ? `${call.duration_minutes} min call with ${call.partner_alias}` : "Loading…"}
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

        {status === "countdown" && call && (
          <div className="text-center space-y-8 animate-fade-in max-w-md">
            <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-gold" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold text-primary-foreground mb-3">
                {call.duration_minutes} min call
              </h1>
              <p className="text-primary-foreground/60 leading-relaxed mb-2">
                with <span className="text-gold font-medium">{call.partner_alias}</span>
              </p>
              <p className="text-2xl font-mono tabular-nums text-primary-foreground/80">
                {timeUntilStart}
              </p>
            </div>
            <Button
              variant="gold"
              size="xl"
              onClick={joinCall}
              disabled={new Date(call.scheduled_at).getTime() - Date.now() > 5 * 60_000}
            >
              {new Date(call.scheduled_at).getTime() - Date.now() > 5 * 60_000
                ? "Opens 5 min before"
                : "Join now"}
            </Button>
            <button
              onClick={() => navigate("/dashboard")}
              className="block mx-auto text-sm text-primary-foreground/40 hover:text-primary-foreground/60 transition-colors"
            >
              ← Back to dashboard
            </button>
          </div>
        )}

        {status === "waiting" && (
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        )}

        {status === "in-call" && (
          <div className="w-full max-w-6xl animate-scale-in flex gap-6 items-start">
            {/* Left sidebar — partner details & guidelines */}
            <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
              {call && <PartnerDetails call={call} />}
              <CallGuidelines />
            </div>

            {/* Center — video */}
            <div className="flex-1 min-w-0">
              <div className="relative aspect-video bg-muted/20 rounded-2xl overflow-hidden mb-6">
                <div ref={remoteVideoRef} className="absolute inset-0" />

                <div className="absolute top-4 right-4 bg-foreground/80 backdrop-blur-sm rounded-full px-4 py-2">
                  <span
                    className={`font-mono text-lg font-semibold tabular-nums ${
                      countdown <= 30 ? "text-destructive" : "text-primary-foreground"
                    }`}
                  >
                    {formatTime(countdown)}
                  </span>
                </div>

                <div className="absolute bottom-4 right-4 w-40 aspect-video rounded-lg border-2 border-gold/40 overflow-hidden shadow-lg z-10">
                  <div ref={localVideoRef} className="w-full h-full bg-muted/30" />
                  <span className="absolute bottom-1 left-2 text-xs text-primary-foreground/70 font-medium">You</span>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => {
                    cleanupRoom();
                    completeSessionOnBackend();
                    setStatus("decision");
                  }}
                >
                  End call
                </Button>
              </div>

              {/* Mobile: details & guidelines below video */}
              <div className="lg:hidden mt-6 space-y-4">
                {call && <PartnerDetails call={call} />}
                <CallGuidelines />
              </div>
            </div>
          </div>
        )}

        {status === "decision" && (
          <div className="w-full max-w-xl py-4">
            <PostCallDecision
              onSubmit={handlePostCallSubmit}
              submitting={decisionSubmitting}
              callTier={callTier}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CallPage;
