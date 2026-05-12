import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import AUR3MLogo from "@/components/AUR3MLogo";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const valid = password.length >= 8 && password === confirm && token;

  const handleReset = async () => {
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <AUR3MLogo size="lg" />
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Invalid reset link
          </h1>
          <p className="text-muted-foreground">
            This link is invalid or has expired. Please request a new one.
          </p>
          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={() => navigate("/forgot-password")}
          >
            Request new link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <button onClick={() => navigate("/")} className="mb-8 inline-block">
            <AUR3MLogo size="lg" />
          </button>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
            Set new password
          </h1>
          <p className="text-muted-foreground">
            Choose a strong password for your account
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-lg bg-primary/10 text-primary text-sm">
              Your password has been reset successfully.
            </div>
            <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={() => navigate("/login")}
            >
              Sign in
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
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  className={inputClass}
                  placeholder="Re-enter password"
                />
                {confirm && password !== confirm && (
                  <p className="text-destructive text-xs mt-1">Passwords don't match</p>
                )}
              </div>
              <Button
                variant="default"
                size="lg"
                className="w-full"
                disabled={!valid || loading}
                onClick={handleReset}
              >
                {loading ? "Resetting…" : "Reset password"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
