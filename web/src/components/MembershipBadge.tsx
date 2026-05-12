import type { Membership } from "@/lib/api";

type DisplayTier = Membership | "date" | "coaching";

const tierConfig: Record<DisplayTier, { label: string; className: string }> = {
  free: {
    label: "Free",
    className: "bg-muted text-muted-foreground",
  },
  paid: {
    label: "Member",
    className: "bg-gold/15 text-gold-dark ring-1 ring-gold/30",
  },
  date: {
    label: "Date",
    className: "bg-forest/15 text-forest ring-1 ring-forest/30",
  },
  coaching: {
    label: "Coaching",
    className: "bg-purple-100 text-purple-700 ring-1 ring-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-500/40",
  },
};

interface MembershipBadgeProps {
  tier: DisplayTier;
  className?: string;
}

const MembershipBadge = ({ tier, className = "" }: MembershipBadgeProps) => {
  const config = tierConfig[tier] ?? tierConfig.free;
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default MembershipBadge;
export type { DisplayTier };
