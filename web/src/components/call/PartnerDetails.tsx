import { User } from "lucide-react";
import type { UpcomingCall } from "@/lib/api";

interface PartnerDetailsProps {
  call: UpcomingCall;
}

const PartnerDetails = ({ call }: PartnerDetailsProps) => {
  const details = [
    { label: "Alias", value: call.partner_alias },
    { label: "Gender", value: call.partner_gender },
    { label: "Age", value: call.partner_age_bracket },
    { label: "Region", value: call.partner_location },
  ].filter((d) => d.value);

  if (details.length === 0) return null;

  return (
    <div className="rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <User className="w-4 h-4 text-gold" />
        <h3 className="text-sm font-semibold text-primary-foreground/80">Your match</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {details.map((d) => (
          <div key={d.label}>
            <p className="text-xs text-primary-foreground/40 uppercase tracking-wider">{d.label}</p>
            <p className="text-sm text-primary-foreground/80 font-medium capitalize">{d.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerDetails;
