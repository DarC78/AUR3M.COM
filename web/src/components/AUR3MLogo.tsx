import aur3mLogo from "@/assets/aur3m-logo.png";

interface AUR3MLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
};

const AUR3MLogo = ({ className = "", size = "md" }: AUR3MLogoProps) => (
  <img
    src={aur3mLogo}
    alt="AUR3M"
    className={`${sizeMap[size]} w-auto object-contain ${className}`}
  />
);

export default AUR3MLogo;
