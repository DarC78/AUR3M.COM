import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { Gender, AgeBracket, InterestedIn } from "@/lib/api";
import { getUtmParams } from "@/lib/utm";
import AUR3MLogo from "@/components/AUR3MLogo";
import { TravelRegionSelect } from "@/components/TravelRegionSelect";
import { ProfessionAutocomplete } from "@/components/ProfessionAutocomplete";

const genderOptions: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

const ageOptions: { value: AgeBracket; label: string }[] = [
  { value: "18-25", label: "18–25" },
  { value: "26-35", label: "26–35" },
  { value: "36-45", label: "36–45" },
  { value: "46-55", label: "46–55" },
  { value: "55+", label: "55+" },
];

const interestOptions: { value: InterestedIn; label: string }[] = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "both", label: "Both" },
];

const RANDOM_NAMES = [
  "Alina", "Marcus", "Serena", "Theo", "Mila", "Jasper", "Luna", "Felix",
  "Aria", "Kai", "Elena", "Ravi", "Nadia", "Oscar", "Zara", "Leo",
  "Ivy", "Dante", "Maya", "Hugo", "Stella", "Rowan", "Clara", "Atlas",
];

function generateRandomUsername(): string {
  const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${name}${num}`;
}

const SignupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState(() => generateRandomUsername());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [ageBracket, setAgeBracket] = useState<AgeBracket | "">("");
  const [travelRegionCode, setTravelRegionCode] = useState("");
  const [profession, setProfession] = useState("");
  const [interestedIn, setInterestedIn] = useState<InterestedIn | "">("");

  const canSubmit =
    username.trim() && email.trim() && password.trim() &&
    gender && ageBracket && travelRegionCode && profession.trim() && interestedIn;

  const handleSubmit = async () => {
    if (!canSubmit || !gender || !ageBracket || !interestedIn) return;
    setLoading(true);
    setError(null);
    try {
      await api.signup({
        username: username.trim(),
        email: email.trim(),
        password,
        gender,
        age_bracket: ageBracket,
        travel_region_code: travelRegionCode,
        profession: profession.trim(),
        interested_in: interestedIn,
        ...getUtmParams(),
      });
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead');
      }
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none";
  const inputClass = "w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md">
          <h2 className="font-display text-3xl font-semibold text-primary-foreground mb-6">
            Your journey to a meaningful connection starts here.
          </h2>
          <p className="text-primary-foreground/70 leading-relaxed">
            We verify every member before a date and keep your identity private until you're
            ready for a date. No swiping. No games. Just real conversations.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div>
            <button onClick={() => navigate("/")} className="mb-8 block">
              <AUR3MLogo size="lg" />
            </button>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-1">
              Create your account
            </h1>
            <p className="text-muted-foreground text-sm">
              No credit card required. Start for free.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="Your username"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The platform generated a random username for you. You can change it but don't put any personal details.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@email.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is the only personal detail we'll ever ask from you — and we'll never share it with anyone, even if you ask us to.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Create a strong password"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className={selectClass}
                >
                  <option value="" disabled>Select</option>
                  {genderOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Age bracket
                </label>
                <select
                  value={ageBracket}
                  onChange={(e) => setAgeBracket(e.target.value as AgeBracket)}
                  className={selectClass}
                >
                  <option value="" disabled>Select</option>
                  {ageOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Region
                </label>
                <TravelRegionSelect
                  value={travelRegionCode}
                  onChange={setTravelRegionCode}
                  placeholder="Select your region"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Profession
                </label>
                <ProfessionAutocomplete
                  value={profession}
                  onChange={setProfession}
                  placeholder="e.g. Consultant"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Interested in
              </label>
              <select
                value={interestedIn}
                onChange={(e) => setInterestedIn(e.target.value as InterestedIn)}
                className={selectClass}
              >
                <option value="" disabled>Who are you looking to meet?</option>
                {interestOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <Button
              variant="gold"
              size="lg"
              className="w-full"
              disabled={!canSubmit || loading}
              onClick={handleSubmit}
            >
              {loading ? "Creating…" : "Start for free"}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already a member?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-foreground font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
