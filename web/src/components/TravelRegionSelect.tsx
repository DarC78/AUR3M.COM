import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { TravelRegion } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TravelRegionSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** When true, includes an "All" option for filters */
  allowAll?: boolean;
}

export const TravelRegionSelect = ({
  value,
  onChange,
  placeholder = "Select your region",
  allowAll = false,
}: TravelRegionSelectProps) => {
  const [regions, setRegions] = useState<TravelRegion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTravelRegions()
      .then(setRegions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Select value={value} onValueChange={onChange} disabled={loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value="all">All regions</SelectItem>}
        {regions.map((r) => (
          <SelectItem key={r.code} value={r.code}>
            {r.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
