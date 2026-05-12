import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

const PROFESSIONS = [
  "Accountant", "Actuary", "Architect", "Attorney", "Auditor",
  "Banker", "Barrister", "Biomedical Engineer", "Business Analyst", "Business Owner",
  "Chef", "Chemist", "Civil Engineer", "Consultant", "Copywriter", "Counsellor",
  "Data Analyst", "Data Scientist", "Dentist", "Designer", "Developer", "Dietitian", "Doctor",
  "Economist", "Editor", "Electrician", "Engineer", "Entrepreneur", "Estate Agent",
  "Fashion Designer", "Film Director", "Financial Adviser", "Financial Analyst", "Firefighter",
  "Graphic Designer", "HR Manager", "Illustrator", "Insurance Broker", "Interior Designer",
  "Journalist", "Judge",
  "Lawyer", "Lecturer", "Librarian", "Logistics Manager",
  "Management Consultant", "Marketing Manager", "Mechanic", "Media Producer", "Midwife", "Musician",
  "Nurse", "Nutritionist",
  "Occupational Therapist", "Optometrist", "Osteopath",
  "Paramedic", "Pharmacist", "Photographer", "Physiotherapist", "Pilot", "Plumber",
  "Police Officer", "Product Manager", "Professor", "Programmer", "Project Manager",
  "Psychiatrist", "Psychologist", "Public Relations",
  "Radiographer", "Recruiter", "Researcher",
  "Sales Manager", "Scientist", "Social Worker", "Software Engineer", "Solicitor",
  "Surgeon", "Surveyor",
  "Teacher", "Therapist", "Trader", "Translator",
  "UX Designer", "Vet", "Veterinarian", "Video Producer",
  "Web Developer", "Writer",
];

interface ProfessionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}

export const ProfessionAutocomplete = ({
  value,
  onChange,
  onSubmit,
  placeholder = "e.g. Consultant",
  className,
}: ProfessionAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 3) {
      const q = value.toLowerCase();
      const matches = PROFESSIONS.filter((p) => p.toLowerCase().startsWith(q)).slice(0, 8);
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

  const select = (prof: string) => {
    onChange(prof);
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
      if (activeIndex >= 0) select(suggestions[activeIndex]);
      else onSubmit?.();
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
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        autoComplete="off"
        className={className}
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-md overflow-hidden">
          {suggestions.map((prof, i) => (
            <button
              key={prof}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                i === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "text-popover-foreground hover:bg-accent/50"
              }`}
              onMouseDown={() => select(prof)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {prof}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
