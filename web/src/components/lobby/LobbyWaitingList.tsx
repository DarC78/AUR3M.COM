import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import type { LobbyUser } from "@/lib/api";
import { Users, Zap, Loader2 } from "lucide-react";

interface LobbyWaitingListProps {
  eventId: string;
  isVisible: boolean;
}

const UserRow = ({ user }: { user: LobbyUser }) => (
  <li className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-primary-foreground/5">
    <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-xs font-semibold text-gold shrink-0">
      {user.alias?.[0]?.toUpperCase() ?? "?"}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-primary-foreground truncate">
        {user.alias}
      </p>
      <p className="text-[11px] text-primary-foreground/40 capitalize">
        {user.gender} · {user.age_bracket}
      </p>
    </div>
    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
  </li>
);

const LobbyWaitingList = ({ eventId, isVisible }: LobbyWaitingListProps) => {
  const [lobbyUsers, setLobbyUsers] = useState<LobbyUser[]>([]);
  const [matchingUsers, setMatchingUsers] = useState<LobbyUser[]>([]);
  const [totalLobby, setTotalLobby] = useState(0);
  const [totalMatching, setTotalMatching] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchLobby = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await api.getLobbyUsers(eventId);
      if (!mountedRef.current) return;

      const nextLobby = Array.isArray(res.lobby_users) ? res.lobby_users : [];
      const nextMatching = Array.isArray(res.matching_users) ? res.matching_users : [];

      setLobbyUsers(nextLobby);
      setMatchingUsers(nextMatching);
      setTotalLobby(typeof res.total_lobby === "number" ? res.total_lobby : nextLobby.length);
      setTotalMatching(typeof res.total_matching === "number" ? res.total_matching : nextMatching.length);
    } catch {
      // silently fail — next poll will retry
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [eventId]);

  useEffect(() => {
    mountedRef.current = true;

    if (!isVisible || !eventId) return;

    // Reset state for fresh mount
    setLoading(true);
    setLobbyUsers([]);
    setMatchingUsers([]);
    setTotalLobby(0);
    setTotalMatching(0);

    // Fetch immediately
    fetchLobby();

    // Then poll on a fixed interval — simple and reliable
    intervalRef.current = setInterval(fetchLobby, 5000);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [eventId, isVisible, fetchLobby]);

  if (!isVisible) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary-foreground/30" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto mt-6 space-y-4">
      {/* Actively matching */}
      <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-semibold text-primary-foreground">
            Actively matching
          </h3>
          <span className="ml-auto text-xs font-mono tabular-nums text-gold/70">
            {totalMatching}
          </span>
        </div>

        {matchingUsers.length === 0 ? (
          <p className="text-xs text-primary-foreground/40 text-center py-3">
            No one is matching yet
          </p>
        ) : (
          <ul className="space-y-2 max-h-36 overflow-y-auto">
            {matchingUsers.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </ul>
        )}
      </div>

      {/* In the lobby (browsing) */}
      <div className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary-foreground/50" />
          <h3 className="text-sm font-semibold text-primary-foreground">
            In the lobby
          </h3>
          <span className="ml-auto text-xs font-mono tabular-nums text-primary-foreground/50">
            {totalLobby}
          </span>
        </div>

        {lobbyUsers.length === 0 ? (
          <p className="text-xs text-primary-foreground/40 text-center py-3">
            No one else in the lobby right now
          </p>
        ) : (
          <ul className="space-y-2 max-h-36 overflow-y-auto">
            {lobbyUsers.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LobbyWaitingList;
