import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Check, User, Calendar } from "lucide-react";
import { api, getAuthToken } from "@/lib/api";
import type { Profile, AgeBracket } from "@/lib/api";
import { TravelRegionSelect } from "@/components/TravelRegionSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const AGE_BRACKETS: AgeBracket[] = ["18-25", "26-35", "36-45", "46-55", "55+"];

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [ageBracket, setAgeBracket] = useState<AgeBracket>("26-35");
  const [travelRegionCode, setTravelRegionCode] = useState("");

  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/login");
      return;
    }
    api.getProfile().then((p) => {
      setProfile(p);
      setAgeBracket(p.age_bracket);
      setTravelRegionCode(p.travel_region_code ?? "");
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [navigate]);

  const hasChanges = profile && (ageBracket !== profile.age_bracket || travelRegionCode !== (profile.travel_region_code ?? ""));

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const updated = await api.updateProfile({ age_bracket: ageBracket, travel_region_code: travelRegionCode });
      setProfile(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center h-16 gap-4">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-semibold text-foreground">My Profile</h1>
        </div>
      </header>

      <main className="container py-10 max-w-lg space-y-8">
        {/* Read-only info */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold">
              {profile?.alias?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-foreground">{profile?.alias}</p>
              <p className="text-sm text-muted-foreground">{profile?.membership === "paid" ? "Member" : "Free"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Gender</span>
              <span className="ml-auto text-foreground capitalize">{profile?.gender}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-4 h-4 text-muted-foreground text-center text-xs font-bold">💼</span>
              <span className="text-muted-foreground">Profession</span>
              <span className="ml-auto text-foreground">{profile?.profession}</span>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-5">
          <h2 className="font-display text-lg font-semibold text-foreground">Edit details</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Age bracket
            </label>
            <Select value={ageBracket} onValueChange={(v) => setAgeBracket(v as AgeBracket)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGE_BRACKETS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              Region
            </label>
            <TravelRegionSelect value={travelRegionCode} onChange={setTravelRegionCode} />
          </div>

          <Button
            variant="gold"
            size="lg"
            className="w-full"
            disabled={!hasChanges || saving}
            onClick={handleSave}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Save changes
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
