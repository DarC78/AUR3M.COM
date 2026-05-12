import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, setAuthToken } from "@/lib/api";
import AUR3MLogo from "@/components/AUR3MLogo";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justVerified = searchParams.get("verified") === "true";
  const verificationFailed = searchParams.get("verified") === "false";
  const failReason = searchParams.get("reason");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ email: email.trim(), password });
      setAuthToken(res.token);
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      // If backend returns email_not_verified, redirect to verification screen
      if (message.toLowerCase().includes("email_not_verified") || message.toLowerCase().includes("verify your email")) {
        navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <button onClick={() => navigate("/")} className="mb-8 inline-block">
            <AUR3MLogo size="lg" />
          </button>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        {justVerified && (
          <div className="p-3 rounded-lg bg-forest/10 text-forest text-sm font-medium">
            Email verified successfully! You can now sign in.
          </div>
        )}

        {verificationFailed && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {failReason === "invalid_token"
              ? "This verification link is invalid or has expired."
              : failReason === "missing_token"
              ? "Verification link is incomplete."
              : "Something went wrong verifying your email."}{" "}
            <button
              onClick={() => navigate("/verify-email")}
              className="underline font-medium hover:text-destructive/80"
            >
              Resend verification email
            </button>
          </div>
        )}

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
              className={inputClass}
              placeholder="you@email.com"
            />
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
              placeholder="Your password"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <Button
            variant="default"
            size="lg"
            className="w-full"
            disabled={!email.trim() || !password.trim() || loading}
            onClick={handleLogin}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Not a member yet?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-foreground font-medium hover:underline"
          >
            Join AUR3M
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
