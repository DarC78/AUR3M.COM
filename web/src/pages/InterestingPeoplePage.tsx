import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {
  Heart, Loader2, ArrowLeft, X, Briefcase, MapPin, ThumbsUp,
  Search,
} from "lucide-react";
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
import type { MemberSummary } from "@/lib/api";
import AUR3MLogo from "@/components/AUR3MLogo";


const AGE_OPTIONS = [
  { value: "all", label: "All ages" },
  { value: "18-25", label: "18–25" },
  { value: "26-35", label: "26–35" },
  { value: "36-45", label: "36–45" },
  { value: "46-55", label: "46–55" },
  { value: "55+", label: "55+" },
];

const InterestingPeoplePage = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  // Filters
  const [searchLocation, setSearchLocation] = useState("");
  const [searchProfession, setSearchProfession] = useState("");
  const [ageFilter, setAgeFilter] = useState("all");
  

  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/login");
      return;
    }
    const load = async () => {
      try {
        const res = await api.getThumbsUp();
        setMembers(res.members ?? []);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleRemove = async (id: string) => {
    if (removing.has(id)) return;
    setRemoving((prev) => new Set(prev).add(id));
    try {
      await api.removeThumbsUp(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // silently ignore
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const filtered = members.filter((m) => {
    if (ageFilter !== "all" && m.age_bracket !== ageFilter) return false;
    if (
      searchLocation &&
      !m.location?.toLowerCase().includes(searchLocation.toLowerCase())
    )
      return false;
    if (
      searchProfession &&
      !m.profession?.toLowerCase().includes(searchProfession.toLowerCase())
    )
      return false;
    return true;
  });


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => navigate("/")}
            className="transition-opacity hover:opacity-80"
          >
            <AUR3MLogo size="sm" />
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        </div>
      </header>

      <main className="container py-10 max-w-4xl">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-6 h-6 text-primary" />
            <h1 className="font-display text-3xl font-semibold text-foreground">
              People you are interested in
            </h1>
          </div>
          <p className="text-muted-foreground mb-8">
            {members.length} {members.length === 1 ? "person" : "people"} you've
            marked as interesting
          </p>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal delay={60}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Age bracket" />
              </SelectTrigger>
              <SelectContent>
                {AGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filter by location"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filter by profession"
                value={searchProfession}
                onChange={(e) => setSearchProfession(e.target.value)}
                className="pl-9"
              />
            </div>

          </div>
        </ScrollReveal>

        {/* Results count */}
        {(searchLocation || searchProfession || ageFilter !== "all") && (
          <p className="text-sm text-muted-foreground mb-4">
            {filtered.length} of {members.length} matching your filters
          </p>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <div className="p-8 rounded-xl bg-card border border-border text-muted-foreground text-sm text-center">
            {members.length === 0
              ? "No one here yet — browse members and thumbs-up profiles you like."
              : "No results match your current filters."}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((member, i) => (
              <ScrollReveal key={member.id} delay={80 + i * 40}>
                <div className="p-5 rounded-xl bg-card border border-border hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
                        {member.alias?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <ThumbsUp className="w-4 h-4 text-primary fill-primary" />
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
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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
                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={removing.has(member.id)}
                      className="p-1.5 rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 active:scale-95 shrink-0"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default InterestingPeoplePage;
