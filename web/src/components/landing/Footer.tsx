import { useNavigate } from "react-router-dom";
import AUR3MLogo from "@/components/AUR3MLogo";

export const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="py-12 bg-foreground text-primary-foreground/60">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <AUR3MLogo size="sm" className="brightness-0 invert" />
        <div className="flex items-center gap-6 text-sm">
          <button
            onClick={() => navigate("/faq")}
            className="hover:text-primary-foreground transition-colors"
          >
            How it works
          </button>
          <button
            onClick={() => navigate("/terms")}
            className="hover:text-primary-foreground transition-colors"
          >
            Terms
          </button>
          <button
            onClick={() => navigate("/privacy")}
            className="hover:text-primary-foreground transition-colors"
          >
            Privacy
          </button>
          <span>© {new Date().getFullYear()} AUR³M — a trading style of JustProveIt Ltd</span>
        </div>
      </div>
    </footer>
  );
};
