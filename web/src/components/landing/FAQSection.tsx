import { ScrollReveal } from "@/components/ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "I barely have time to date. How does this fit into a busy schedule?",
    answer:
      "Phase 1 calls are three minutes — shorter than your morning coffee order. Longer calls are scheduled around your availability, not the other way round. You never waste an evening on someone you already know isn't right.",
  },
  {
    question: "How is this different from Tinder, Hinge, or Bumble?",
    answer:
      "Those apps are built around photos and swiping — which rewards looks, not compatibility. AUR³M removes photos entirely until both people choose to reveal themselves. There's no swiping, no algorithm gaming, and no ghosting — because the structured process means both people are invested before they meet.",
  },
  {
    question: "Why not just use a matchmaking agency?",
    answer:
      "Traditional agencies charge £1,000–£5,000 per year, often with limited matches and opaque processes. AUR³M gives you a structured, transparent journey starting at £20/month — with more control, more matches, and full anonymity until you're ready.",
  },
  {
    question: "Is my identity really hidden during calls?",
    answer:
      "Yes. All video calls before the date are fully anonymous — with no real names shared or any other personal details. If a member tries to ask for personal details, you need to close the call and report that member. A member of staff will review the call and remove that member from the platform. You decide when (and if) you reveal yourself as things progress.",
  },
  {
    question: "What if I don't feel a connection on the call?",
    answer:
      "That's completely fine — most people don't click with every match. Simply let the call end naturally or use the red button. There's no obligation, no awkwardness, and no follow-up unless both sides want one.",
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer:
      "Absolutely. Silver and Gold memberships can be cancelled with one click from your dashboard. No lock-in contracts, no hidden fees, no hoops to jump through.",
  },
  {
    question: "I'm looking for a serious relationship, not casual dating. Is this for me?",
    answer:
      "AUR³M was built specifically for people who want a life partner. The verification process, structured progression, and optional relationship coaching programme are all designed for members who are serious about finding the one.",
  },
  {
    question: "How do you verify that members are real?",
    answer:
      "Every member who upgrades to Gold must submit a government-issued ID. We cross-check it against their profile and use liveness detection to prevent catfishing. Reports are reviewed by human moderators, not algorithms.",
  },
];

export const FAQSection = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container max-w-2xl">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-gold tracking-wide uppercase mb-3">
              Questions busy people ask
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground leading-tight text-wrap-balance">
              Everything you need to know
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="bg-card rounded-xl border border-border px-6 shadow-sm data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
};
