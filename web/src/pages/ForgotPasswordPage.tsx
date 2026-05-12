import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import AUR3MLogo from "@/components/AUR3MLogo";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.requestPasswordReset(email.trim());
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <button onClick={() => navigate("/")} className="mb-8 inline-block">
            <AUR3MLogo size="lg" />
          </button>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
            Reset your password
          </h1>
          <p className="text-muted-foreground">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-lg bg-primary/10 text-primary text-sm">
              If an account exists for <strong>{email}</strong>, you'll receive a
              password reset email shortly.
            </div>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate("/login")}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className={inputClass}
                  placeholder="you@email.com"
                />
              </div>
              <Button
                variant="default"
                size="lg"
                className="w-full"
                disabled={!email.trim() || loading}
                onClick={handleSubmit}
              >
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-foreground font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
