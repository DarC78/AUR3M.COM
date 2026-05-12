import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Mail, RefreshCw } from "lucide-react";
import AUR3MLogo from "@/components/AUR3MLogo";

const COOLDOWN_SECONDS = 60;

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'CompleteRegistration');
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    try {
      await api.resendVerification(email);
      setCooldown(COOLDOWN_SECONDS);
    } catch {
      // silently handle — don't reveal if email exists
    } finally {
      setResending(false);
    }
  }, [email, cooldown]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md text-center space-y-6">
        <button onClick={() => navigate("/")} className="mb-4 inline-block">
          <AUR3MLogo size="lg" />
        </button>

        <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-gold" />
        </div>

        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
            Check your inbox
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            We've sent a verification link to{" "}
            {email ? (
              <span className="font-medium text-foreground">{email}</span>
            ) : (
              "your email"
            )}
            . Click the link to activate your account.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
          <p>Can't find it? Check your spam or junk folder.</p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            disabled={resending || cooldown > 0}
            onClick={handleResend}
          >
            {resending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Sending…
              </>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              "Resend verification email"
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => navigate("/login")}
          >
            Back to sign in
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
