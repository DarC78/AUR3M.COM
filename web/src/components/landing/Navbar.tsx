import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AUR3MLogo from "@/components/AUR3MLogo";
import { getAuthToken } from "@/lib/api";

export const Navbar = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const isLoggedIn = !!getAuthToken();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-sm shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container flex items-center justify-between">
        <button onClick={() => navigate("/")} className="transition-opacity hover:opacity-80">
          <AUR3MLogo size="sm" className={scrolled ? "" : "brightness-0 invert"} />
        </button>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className={scrolled ? "text-foreground" : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"}
            onClick={() => navigate("/faq")}
          >
            How it works
          </Button>
          {isLoggedIn ? (
            <Button
              variant={scrolled ? "default" : "gold"}
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className={scrolled ? "text-foreground" : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"}
                onClick={() => navigate("/login")}
              >
                Sign in
              </Button>
              <Button
                variant={scrolled ? "default" : "gold"}
                size="sm"
                onClick={() => navigate("/signup")}
              >
                Join now
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
