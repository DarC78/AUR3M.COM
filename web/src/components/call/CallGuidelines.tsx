import { MessageCircle, ShieldAlert } from "lucide-react";

const suggestedQuestions = [
  "What's a passion or hobby that lights you up outside of work?",
  "If you could travel anywhere tomorrow, where would you go and why?",
  "What does your ideal weekend look like?",
];

const noNoRules = [
  { label: "No sharing personal details", desc: "Surnames, phone numbers, social handles — keep it anonymous." },
  { label: "No indecent behaviour", desc: "Any nudity or inappropriate exposure ends the call immediately." },
  { label: "No making the other guest uncomfortable", desc: "Be respectful, kind, and mindful of boundaries at all times." },
];

const CallGuidelines = () => (
  <div className="space-y-4">
    {/* Suggested questions */}
    <div className="rounded-xl bg-gold/10 border border-gold/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-gold" />
        <h3 className="text-sm font-semibold text-gold">Conversation starters</h3>
      </div>
      <ul className="space-y-2">
        {suggestedQuestions.map((q, i) => (
          <li key={i} className="text-sm text-primary-foreground/70 flex gap-2">
            <span className="text-gold/60 font-medium shrink-0">{i + 1}.</span>
            {q}
          </li>
        ))}
      </ul>
    </div>

    {/* No-no rules */}
    <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="w-4 h-4 text-destructive" />
        <h3 className="text-sm font-semibold text-destructive">Rules — instant ban</h3>
      </div>
      <ul className="space-y-2">
        {noNoRules.map((rule, i) => (
          <li key={i} className="text-sm">
            <span className="text-primary-foreground/80 font-medium">{rule.label}</span>
            <span className="text-primary-foreground/50"> — {rule.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default CallGuidelines;
