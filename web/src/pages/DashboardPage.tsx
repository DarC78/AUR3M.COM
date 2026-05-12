import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Video, Calendar, Clock, ThumbsUp, LogOut, Loader2, Users, MapPin, Briefcase, ArrowRight, User, CreditCard, Heart, Phone, X, CalendarHeart } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollReveal } from "@/components/ScrollReveal";
import { api, clearAuth, getAuthToken } from "@/lib/api";
import type { Profile, Match, MemberSummary, UpcomingCall, EventType } from "@/lib/api";
import AUR3MLogo from "@/components/AUR3MLogo";
import ActiveEventPrompt from "@/components/ActiveEventPrompt";
import MembershipBadge from "@/components/MembershipBadge";
import { isTestCampaign, getEventMode, setEventMode } from "@/lib/utm";
import EventCountdown from "@/components/dashboard/EventCountdown";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<UpcomingCall[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearbyMembers, setNearbyMembers] = useState<MemberSummary[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyLoadingMore, setNearbyLoadingMore] = useState(false);
  const [nearbyHasMore, setNearbyHasMore] = useState(false);
  const [nearbyOffset, setNearbyOffset] = useState(0);
  const [eventsPage] = useState(1);
  const [eventMode, setEventModeState] = useState<EventType>(getEventMode);
  const [totalMemberCount, setTotalMemberCount] = useState<number>(0);
  const [nearbyMemberCount, setNearbyMemberCount] = useState<number>(0);
  const [interestingMembers, setInterestingMembers] = useState<MemberSummary[]>([]);
  const [removingThumb, setRemovingThumb] = useState<Set<string>>(new Set());
  const [thumbedUpIds, setThumbedUpIds] = useState<Set<string>>(new Set());
  const [togglingThumb, setTogglingThumb] = useState<Set<string>>(new Set());
  const [memberMap, setMemberMap] = useState<Map<string, MemberSummary>>(new Map());
  
  const NEARBY_PAGE_SIZE = 25;
  const EVENTS_PAGE_SIZE = 5;

  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        const [profileRes, matchesRes, thumbsRes, callsRes] = await Promise.all([
          api.getProfile(),
          api.getMatches(),
          api.getThumbsUp(),
          api.getUpcomingCalls(eventMode).catch(() => ({ upcoming: [] })),
        ]);
        setProfile(profileRes);
        setActivities(callsRes.upcoming ?? []);
        setMatches(matchesRes.matches ?? []);

        // Store thumbs-up data — now thumbs_up is string[] and members is MemberSummary[]
        const thumbsData = thumbsRes.thumbs_up ?? [];
        const thumbedIds = new Set(thumbsData);
        setThumbedUpIds(thumbedIds);

        // Use members from thumbs-up response directly for interesting people
        const thumbMembers = thumbsRes.members ?? [];
        setInterestingMembers(thumbMembers);
        const map = new Map<string, MemberSummary>();
        thumbMembers.forEach((m) => map.set(m.id, m));

        // Also fetch all members to expand the map and get total count
        try {
          const membersRes = await api.getMembers({});
          (membersRes.members ?? []).forEach((m) => map.set(m.id, m));
          setTotalMemberCount(membersRes.total_count ?? membersRes.members?.length ?? 0);
        } catch {
          // Non-critical
        }
        setMemberMap(map);

        // Fetch nearby members and merge into map
        if (profileRes.location) {
          setNearbyLoading(true);
          try {
            const membersRes = await api.getMembers({ location: profileRes.location, limit: NEARBY_PAGE_SIZE });
            const nearby = membersRes.members ?? [];
            setNearbyMembers(nearby);
            setNearbyMemberCount(membersRes.total_count ?? nearby.length);
            setNearbyOffset(nearby.length);
            setNearbyHasMore(nearby.length < (membersRes.total_count ?? nearby.length));
            setMemberMap((prev) => {
              const next = new Map(prev);
              nearby.forEach((m) => next.set(m.id, m));
              return next;
            });
          } catch {
            // Non-critical
          } finally {
            setNearbyLoading(false);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate, eventMode]);

  const loadMoreNearby = async () => {
    if (!profile?.location || nearbyLoadingMore) return;
    setNearbyLoadingMore(true);
    try {
      const res = await api.getMembers({ location: profile.location, limit: NEARBY_PAGE_SIZE, offset: nearbyOffset });
      const more = res.members ?? [];
      setNearbyMembers((prev) => [...prev, ...more]);
      setNearbyOffset((prev) => prev + more.length);
      setNearbyHasMore(nearbyOffset + more.length < (res.total_count ?? 0));
      setMemberMap((prev) => {
        const next = new Map(prev);
        more.forEach((m) => next.set(m.id, m));
        return next;
      });
    } catch {
      // Non-critical
    } finally {
      setNearbyLoadingMore(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const toggleThumbsUp = async (memberId: string) => {
    if (togglingThumb.has(memberId)) return;
    const isCurrently = thumbedUpIds.has(memberId);
    setThumbedUpIds((prev) => {
      const next = new Set(prev);
      if (isCurrently) next.delete(memberId); else next.add(memberId);
      return next;
    });
    if (!isCurrently) {
      const member = memberMap.get(memberId) ?? nearbyMembers.find((m) => m.id === memberId);
      if (member) setInterestingMembers((prev) => [...prev, member]);
    } else {
      setInterestingMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
    setTogglingThumb((prev) => new Set(prev).add(memberId));
    try {
      if (isCurrently) await api.removeThumbsUp(memberId);
      else await api.addThumbsUp(memberId);
    } catch {
      setThumbedUpIds((prev) => {
        const next = new Set(prev);
        if (isCurrently) next.add(memberId); else next.delete(memberId);
        return next;
      });
      if (isCurrently) {
        const member = memberMap.get(memberId) ?? nearbyMembers.find((m) => m.id === memberId);
        if (member) setInterestingMembers((prev) => [...prev, member]);
      } else {
        setInterestingMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } finally {
      setTogglingThumb((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const nextSpeedRound = activities.find((a) => a.call_type === "speed_round");
  const nextEventDate = nextSpeedRound
    ? new Date(nextSpeedRound.scheduled_at).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const phaseLabel = (tier: string) => {
    const t = tier?.toLowerCase();
    if (t === "1" || t === "tier_1" || t === "3min") return "3 min call";
    if (t === "2" || t === "tier_2" || t === "15min") return "15 min call";
    if (t === "3" || t === "tier_3" || t === "60min") return "60 min call";
    if (t === "4" || t === "tier_4" || t === "date") return "Date";
    return tier;
  };

  const phaseColor = (tier: string) => {
    const t = tier?.toLowerCase();
    if (t === "4" || t === "tier_4" || t === "date") return "bg-primary/10 text-primary";
    if (t === "3" || t === "tier_3" || t === "60min") return "bg-amber-100 text-amber-800";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <ActiveEventPrompt autoJoin membership={profile?.membership} eventMode={eventMode} />
      {/* Top bar */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => navigate("/")} className="transition-opacity hover:opacity-80">
            <AUR3MLogo size="sm" />
          </button>
          <div className="flex items-center gap-4">
            <MembershipBadge tier={profile?.membership === "paid" ? "paid" : "free"} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {profile?.alias?.[0]?.toUpperCase() ?? "?"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/subscription")} className="cursor-pointer">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Subscription
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container py-10 max-w-4xl">
        <ScrollReveal>
          <h1 className="font-display text-3xl font-semibold text-foreground mb-2">
            {greeting()}, {profile?.alias ?? "there"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {nextSpeedRound
              ? `Your next Speed Round is ${nextEventDate}.`
              : "No upcoming speed rounds right now."}
          </p>
        </ScrollReveal>

        {nextSpeedRound && (
          <ScrollReveal delay={40}>
            <div className="mb-10">
              <EventCountdown event={nextSpeedRound} />
            </div>
          </ScrollReveal>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upcoming Activities — personal calls first, then speed rounds */}
          <ScrollReveal delay={80}>
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                Upcoming Activities
              </h2>

              {(() => {
                // Split into personal calls first, then speed rounds
                const followUps = activities
                  .filter((a) => a.call_type === "follow_up")
                  .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
                const speedRounds = activities
                  .filter((a) => a.call_type === "speed_round")
                  .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
                const sorted = [...followUps, ...speedRounds];

                if (sorted.length === 0) {
                  return (
                    <div className="p-5 rounded-xl bg-card border border-border text-muted-foreground text-sm">
                      No upcoming activities — join a speed round or wait for a match.
                    </div>
                  );
                }

                return (
                  <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border bg-card/50 pr-1">
                    <div className="space-y-3 p-2">
                      {sorted.map((item) => {
                        const itemDate = new Date(item.scheduled_at);
                        const now = new Date();
                        const diffMs = itemDate.getTime() - now.getTime();
                        const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                        const diffDays = Math.floor(diffHours / 24);
                        const countdown =
                          diffMs <= 0 ? "Starting now"
                            : diffDays > 0 ? `in ${diffDays}d ${diffHours % 24}h`
                            : `in ${diffHours}h`;

                        if (item.call_type === "follow_up") {
                          return (
                            <div
                              key={`call-${item.id}`}
                              className="p-4 rounded-xl bg-card border border-gold/20 hover:shadow-md transition-shadow duration-300 cursor-pointer"
                              onClick={() => {
                                if (diffMs <= 5 * 60 * 1000) {
                                  navigate(`/call/${item.id}`);
                                } else {
                                  navigate(`/lobby?eventId=${item.id}&scheduledAt=${encodeURIComponent(item.scheduled_at)}`);
                                }
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center font-semibold text-gold">
                                  {item.partner_alias?.[0]?.toUpperCase() ?? "?"}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-foreground">{item.partner_alias}</p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {itemDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold">
                                    {item.duration_minutes} min call
                                  </span>
                                  <span className="text-xs text-muted-foreground">{countdown}</span>
                                  {diffMs <= 5 * 60 * 1000 && (
                                    <Button variant="gold" size="sm" onClick={() => navigate(`/call/${item.id}`)}>
                                      Join
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div
                              key={`event-${item.id}`}
                              className="p-4 rounded-xl bg-card border border-border hover:shadow-md transition-shadow duration-300 cursor-pointer"
                              onClick={() => navigate(`/lobby?eventId=${item.id}&scheduledAt=${encodeURIComponent(item.scheduled_at)}`)}
                            >
                              <div className="flex items-start gap-4">
                                <div className="mt-0.5 text-forest-light">
                                  {item.status === "scheduled" ? <Calendar className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-foreground">{item.title ?? "Speed Round"}</p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {itemDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground capitalize px-2 py-1 rounded-full bg-muted">
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                );
              })()}

              <Button variant="gold" size="lg" className="w-full" onClick={() => navigate("/lobby")}>
                Enter Speed Round Lobby
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={() => navigate("/members")}>
                <Users className="w-4 h-4 mr-2" />
                Browse Members
              </Button>
            </div>
          </ScrollReveal>



          {/* Matches */}
          <ScrollReveal delay={160}>
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                <Phone className="w-5 h-5 text-forest-light" />
                Matches (you both thumb up each other after a call)
              </h2>
              {matches.filter((m) => m.decision_status === "yes").length === 0 ? (
                <div className="p-5 rounded-xl bg-card border border-border text-muted-foreground text-sm">
                  No mutual matches yet — join a speed round to find yours.
                </div>
              ) : (
                matches
                  .filter((m) => m.decision_status === "yes")
                  .slice(0, 10)
                  .map((match) => (
                    <div
                      key={match.connection_id}
                      className="p-5 rounded-xl bg-card border border-border hover:shadow-md transition-shadow duration-300 cursor-pointer"
                      onClick={() => navigate(`/match/${match.connection_id}`, { state: match })}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
                          {match.alias[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {match.alias}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${phaseColor(match.tier)}`}>
                              {phaseLabel(match.tier)}
                            </span>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-sm text-forest-light font-medium">
                          <ThumbsUp className="w-3.5 h-3.5" /> Matched
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </ScrollReveal>

          {/* Interesting People */}
          <ScrollReveal delay={240}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  People you are interested in
                </h2>
                {interestingMembers.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => navigate("/interesting")}
                  >
                    View all ({interestingMembers.length}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
              {interestingMembers.length === 0 ? (
                <div className="p-5 rounded-xl bg-card border border-border text-muted-foreground text-sm">
                  No one yet — browse members and thumbs-up profiles you like.
                </div>
              ) : (
                <>
                  {interestingMembers.slice(0, 5).map((member) => {
                    return (
                      <div
                        key={member.id}
                        className="p-5 rounded-xl bg-card border border-border hover:shadow-md transition-shadow duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
                            {member.alias?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground truncate">
                                {member.alias}
                              </p>
                              <MembershipBadge tier={member.membership === "paid" ? "paid" : "free"} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                              {member.gender} · {member.age_bracket}
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              if (removingThumb.has(member.id)) return;
                              setRemovingThumb((prev) => new Set(prev).add(member.id));
                              try {
                                await api.removeThumbsUp(member.id);
                                setInterestingMembers((prev) => prev.filter((m) => m.id !== member.id));
                                setThumbedUpIds((prev) => {
                                  const next = new Set(prev);
                                  next.delete(member.id);
                                  return next;
                                });
                              } catch {
                                // silently ignore
                              } finally {
                                setRemovingThumb((prev) => {
                                  const next = new Set(prev);
                                  next.delete(member.id);
                                  return next;
                                });
                              }
                            }}
                            disabled={removingThumb.has(member.id)}
                            className="p-1.5 rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 active:scale-95 shrink-0"
                            title="Remove from list"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {interestingMembers.length > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate("/interesting")}
                    >
                      See all {interestingMembers.length} people
                    </Button>
                  )}
                </>
              )}
            </div>
          </ScrollReveal>
        </div>

        {/* Nearby members */}
        <ScrollReveal delay={240}>
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                Members near {profile?.location ?? "you"}
              </h2>
              {nearbyMemberCount > 0 && (
                <p className="font-display text-xl font-semibold text-foreground">
                  {nearbyMemberCount.toLocaleString()} member{nearbyMemberCount !== 1 ? "s" : ""} near {profile?.location ?? "you"}
                  {totalMemberCount > 0 ? ` (out of ${totalMemberCount.toLocaleString()} total)` : ""}
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => navigate("/members")}
              >
                View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {nearbyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : nearbyMembers.length === 0 ? (
              <div className="p-5 rounded-xl bg-card border border-border text-muted-foreground text-sm text-center">
                No members found in your area yet — invite someone!
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nearbyMembers.map((member) => {
                    return (
                      <div
                        key={member.id}
                        className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow duration-300"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
                              {member.alias?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <button
                              onClick={() => toggleThumbsUp(member.id)}
                              disabled={togglingThumb.has(member.id)}
                              className={`p-1.5 rounded-full transition-all duration-200 active:scale-95 ${
                                thumbedUpIds.has(member.id)
                                  ? "text-primary bg-primary/10"
                                  : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted"
                              }`}
                              title={thumbedUpIds.has(member.id) ? "Remove priority interest" : "Priority interest"}
                            >
                              <ThumbsUp className={`w-4 h-4 ${thumbedUpIds.has(member.id) ? "fill-primary" : ""}`} />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground truncate">
                                {member.alias}
                              </p>
                              <MembershipBadge tier={member.membership === "paid" ? "paid" : "free"} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                              {member.gender} · {member.age_bracket}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {member.profession}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <p className="text-xs text-muted-foreground">
                    Showing {nearbyMembers.length.toLocaleString()} of {nearbyMemberCount.toLocaleString()}
                  </p>
                  {nearbyHasMore && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMoreNearby}
                      disabled={nearbyLoadingMore}
                    >
                      {nearbyLoadingMore ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Loading…</>
                      ) : (
                        "Load more"
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
};

export default DashboardPage;
