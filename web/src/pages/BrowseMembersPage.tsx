import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Users, MapPin, Briefcase, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TravelRegionSelect } from "@/components/TravelRegionSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollReveal } from "@/components/ScrollReveal";
import MembershipBadge from "@/components/MembershipBadge";
import { api, getAuthToken } from "@/lib/api";
import type { MemberSummary, Gender, AgeBracket } from "@/lib/api";

const BrowseMembersPage = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbedUp, setThumbedUp] = useState<Set<string>>(new Set());
  const [togglingThumb, setTogglingThumb] = useState<Set<string>>(new Set());

  // Filters
  const [gender, setGender] = useState<Gender | "">("");
  const [ageBracket, setAgeBracket] = useState<AgeBracket | "">("");
  const [location, setLocation] = useState("");
  const [profession, setProfession] = useState("");

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const g = gender as string;
      const a = ageBracket as string;
      const hasFilters = (g && g !== "all") || (a && a !== "all") || !!location.trim() || !!profession.trim();
      const res = await api.getMembers({
        gender: g && g !== "all" ? gender as Gender : undefined,
        age_bracket: a && a !== "all" ? ageBracket as AgeBracket : undefined,
        location: location.trim() || undefined,
        profession: profession.trim() || undefined,
      });
      setMembers(res.members ?? []);
      setFilteredCount(res.total_count ?? res.members?.length ?? 0);
      setHasActiveFilters(hasFilters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [gender, ageBracket, location, profession]);

  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/login");
      return;
    }
    api.getMembers({}).then((res) => setTotalCount(res.total_count ?? res.members?.length ?? 0)).catch(() => {});
    api.getThumbsUp().then((res) => {
      setThumbedUp(new Set(res.thumbs_up ?? []));
    }).catch(() => {});
    fetchMembers();
  }, [navigate, fetchMembers]);

  const toggleThumbsUp = async (memberId: string) => {
    if (togglingThumb.has(memberId)) return;
    const isCurrently = thumbedUp.has(memberId);
    setThumbedUp((prev) => {
      const next = new Set(prev);
      if (isCurrently) next.delete(memberId); else next.add(memberId);
      return next;
    });
    setTogglingThumb((prev) => new Set(prev).add(memberId));
    try {
      if (isCurrently) await api.removeThumbsUp(memberId);
      else await api.addThumbsUp(memberId);
    } catch {
      setThumbedUp((prev) => {
        const next = new Set(prev);
        if (isCurrently) next.add(memberId); else next.delete(memberId);
        return next;
      });
    } finally {
      setTogglingThumb((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  const clearFilters = () => {
    setGender("");
    setAgeBracket("");
    setLocation("");
    setProfession("");
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center gap-4 h-16">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-semibold text-foreground">
            Browse Members
          </h1>
        </div>
      </header>

      <main className="container py-8 max-w-5xl">
        {/* Filters */}
        <ScrollReveal>
          <div className="rounded-xl border border-border bg-card p-5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filters</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Gender</Label>
                <Select
                  value={gender}
                  onValueChange={(v) => setGender(v as Gender | "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Age</Label>
                <Select
                  value={ageBracket}
                  onValueChange={(v) => setAgeBracket(v as AgeBracket | "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="18-25">18–25</SelectItem>
                    <SelectItem value="26-35">26–35</SelectItem>
                    <SelectItem value="36-45">36–45</SelectItem>
                    <SelectItem value="46-55">46–55</SelectItem>
                    <SelectItem value="55+">55+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Region</Label>
                <TravelRegionSelect
                  value={location}
                  onChange={setLocation}
                  allowAll
                  placeholder="All regions"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Profession</Label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Surgeon"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <Button size="sm" onClick={fetchMembers}>
                Apply Filters
              </Button>
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchMembers}>
              Retry
            </Button>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">
              No members found matching your filters.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {hasActiveFilters
                ? `${filteredCount} member${filteredCount !== 1 ? "s" : ""} matching your criteria${totalCount > 0 ? ` (out of ${totalCount.toLocaleString()} total)` : ""}`
                : `${filteredCount.toLocaleString()} member${filteredCount !== 1 ? "s" : ""}`}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member, i) => (
              <ScrollReveal key={member.id} delay={i * 60}>
                <div className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow duration-300 group">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
                        {member.alias?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <button
                        onClick={() => toggleThumbsUp(member.id)}
                        disabled={togglingThumb.has(member.id)}
                        className={`p-1.5 rounded-full transition-all duration-200 active:scale-95 ${
                          thumbedUp.has(member.id)
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted"
                        }`}
                        title={thumbedUp.has(member.id) ? "Remove priority interest" : "Priority interest"}
                      >
                        <ThumbsUp className={`w-4 h-4 ${thumbedUp.has(member.id) ? "fill-primary" : ""}`} />
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
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {member.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {member.profession}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
          </>
        )}
      </main>
    </div>
  );
};

export default BrowseMembersPage;
