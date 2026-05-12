import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

const UK_CITIES = [
  "Aberdeen", "Aylesbury", "Bangor", "Barnsley", "Basildon", "Basingstoke", "Bath",
  "Bedford", "Belfast", "Birmingham", "Blackburn", "Blackpool", "Bolton", "Bournemouth",
  "Bradford", "Brighton", "Bristol", "Bromley", "Burnley", "Burton upon Trent", "Bury",
  "Cambridge", "Canterbury", "Cardiff", "Carlisle", "Chelmsford", "Cheltenham", "Chester",
  "Chesterfield", "Chichester", "Colchester", "Coventry", "Crawley", "Croydon",
  "Darlington", "Derby", "Doncaster", "Dundee", "Durham",
  "Eastbourne", "Edinburgh", "Ely", "Exeter",
  "Gateshead", "Glasgow", "Gloucester", "Guildford",
  "Halifax", "Harrogate", "Hastings", "Hereford", "Huddersfield", "Hull",
  "Inverness", "Ipswich",
  "Keighley", "Kidderminster", "Kingston upon Thames",
  "Lancaster", "Leeds", "Leicester", "Lichfield", "Lincoln", "Liverpool", "London", "Luton",
  "Maidstone", "Manchester", "Mansfield", "Middlesbrough", "Milton Keynes",
  "Newcastle upon Tyne", "Newport", "Northampton", "Norwich", "Nottingham",
  "Oldham", "Oxford",
  "Peterborough", "Plymouth", "Poole", "Portsmouth", "Preston",
  "Reading", "Redditch", "Rochdale", "Rotherham",
  "Salford", "Salisbury", "Sheffield", "Shrewsbury", "Slough", "Solihull",
  "Southampton", "Southend-on-Sea", "St Albans", "Stafford", "Stevenage",
  "Stockport", "Stoke-on-Trent", "Sunderland", "Sutton Coldfield", "Swansea", "Swindon",
  "Tamworth", "Taunton", "Telford", "Torquay", "Truro",
  "Wakefield", "Walsall", "Warrington", "Warwick", "Watford", "Wigan",
  "Winchester", "Wolverhampton", "Worcester", "Worthing",
  "York",
];

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export const CityAutocomplete = ({ value, onChange, onSubmit, placeholder = "e.g. London" }: CityAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 3) {
      const q = value.toLowerCase();
      const matches = UK_CITIES.filter((c) => c.toLowerCase().startsWith(q)).slice(0, 8);
      setSuggestions(matches);
      setOpen(matches.length > 0);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
    setActiveIndex(-1);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const select = (city: string) => {
    onChange(city);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter") onSubmit?.();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) {
        select(suggestions[activeIndex]);
      } else {
        onSubmit?.();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-md overflow-hidden">
          {suggestions.map((city, i) => (
            <button
              key={city}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                i === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "text-popover-foreground hover:bg-accent/50"
              }`}
              onMouseDown={() => select(city)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
