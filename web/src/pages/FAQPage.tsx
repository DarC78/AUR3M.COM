import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Footer } from "@/components/landing/Footer";

const sections = [
  {
    title: "Getting Started",
    items: [
      {
        q: "How does AUR³M work?",
        a: "AUR³M is a curated dating experience built around genuine human connection — not swiping. You progress through three carefully designed phases: anonymous Speed Rounds, verified offline dates, and optional relationship coaching. Each stage deepens your connection while protecting your identity until you're ready.",
      },
      {
        q: "Is it really free to join?",
        a: "Yes. You can create your profile and enter the platform at no cost. Your Silver membership (£20/month) begins when you're ready to participate in Speed Rounds, and comes with a full 30-day money-back guarantee.",
      },
      {
        q: "How is my privacy protected?",
        a: "You're assigned a stage name when you join. Your real identity is never shared with other members during Phases 1 and 2. Video calls are anonymous, and personal details are only exchanged when both parties consent.",
      },
    ],
  },
  {
    title: "Phase 1 — Silver (£20/month)",
    subtitle: "Anonymous Speed Rounds",
    items: [
      {
        q: "What is a Speed Round?",
        a: "A Speed Round is a short, anonymous 3-minute video call with another member. You'll be matched based on your preferences (age, location, gender) and connected via live video. Think of it as a first impression — enough time to sense chemistry without the pressure of a long conversation.",
      },
      {
        q: "What happens after a Speed Round?",
        a: "After each call, both members privately decide 'thumbs up' or 'thumbs down'. If both say yes, you progress to a 15-minute anonymous video call to explore the connection further.",
      },
      {
        q: "What's the 15-minute call?",
        a: "This is your second conversation — still fully anonymous, but longer. It gives you space to talk more naturally and see if there's real compatibility. If both members give a thumbs up again, you'll be invited to a 60-minute call.",
      },
      {
        q: "And the 60-minute call?",
        a: "The final anonymous stage. By now you've had two positive interactions. This longer call lets you have a proper conversation — the kind you'd have over dinner. A mutual thumbs up here means you're both ready to meet in person.",
      },
      {
        q: "What if one person says no?",
        a: "No problem. Decisions are private and there's no awkwardness. You'll both be re-entered into the matching pool for future Speed Rounds. There's no limit on how many rounds you can join.",
      },
    ],
  },
  {
    title: "Phase 2 — Gold (£200/date)",
    subtitle: "Verified Offline Dates",
    items: [
      {
        q: "How does the offline date work?",
        a: "Once you've both completed Phase 1 with mutual interest, AUR³M arranges a real-world date at a premium, vetted restaurant. Dinner (valued at £50–£150) is included in the date fee. We handle the reservation — you just show up.",
      },
      {
        q: "Why is there an ID verification?",
        a: "Before meeting in person, both members verify their identity. This protects everyone involved and ensures the person you've been speaking to is who they say they are. It's a one-time process.",
      },
      {
        q: "What kind of restaurants?",
        a: "We partner with carefully selected venues — typically upscale but relaxed settings designed for conversation, not performance. Think neighbourhood fine dining, not Michelin-star formality.",
      },
      {
        q: "Can I choose the restaurant or location?",
        a: "We'll match you with a venue based on both members' locations and preferences. You can indicate dietary requirements and area preferences in advance.",
      },
    ],
  },
  {
    title: "Phase 3 — Platinum (£1,000/programme)",
    subtitle: "Personal Relationship Professional",
    items: [
      {
        q: "What is the Platinum programme?",
        a: "It's a 3-month guided coaching experience for couples who've moved through Phases 1 and 2 and want to build something lasting. You're paired with a dedicated relationship professional who works with you both — individually and together.",
      },
      {
        q: "Who are the relationship professionals?",
        a: "Qualified coaches and therapists with experience in attachment, communication, and early-relationship dynamics. They're selected for warmth and practical wisdom, not clinical detachment.",
      },
      {
        q: "Is this therapy?",
        a: "Not exactly. Think of it as structured support — someone in your corner who helps you navigate the transition from 'dating' to 'relationship'. Sessions cover communication patterns, expectations, conflict styles, and building trust.",
      },
      {
        q: "Do both people have to sign up?",
        a: "Yes. The programme is designed for couples, so both members participate. This ensures alignment and shared commitment to the process.",
      },
    ],
  },
  {
    title: "Video Call Rules",
    subtitle: "What you can and can't say",
    items: [
      {
        q: "What's the golden rule during a call?",
        a: "Focus on personality, not logistics. The purpose of every anonymous call is to discover who someone is — how they think, what they value, what makes them laugh. Treat it like a conversation at a dinner party, not an interview.",
      },
      {
        q: "Can I share my real name?",
        a: "No. During all anonymous stages (3-min, 15-min, and 60-min calls) you must use your platform-assigned stage name only. Sharing your real name, surname, or any identifiable personal details will result in a warning or suspension.",
      },
      {
        q: "Can I share contact details?",
        a: "Absolutely not. Exchanging phone numbers, email addresses, social media handles, or any other contact information during anonymous calls is strictly prohibited. This protects both members and ensures connections progress through the platform's structured stages.",
      },
      {
        q: "Can I mention where I live specifically?",
        a: "You can refer to your general area (e.g. 'I'm based in London' or 'I live in the North West'), but do not share your street, neighbourhood, postcode, workplace address, or any detail specific enough to locate you. Keep it broad.",
      },
      {
        q: "Can I mention where I work?",
        a: "You can share your profession or industry (e.g. 'I work in finance' or 'I'm a teacher'), but do not name your specific employer, office location, or job title that could easily identify you online.",
      },
      {
        q: "What topics are encouraged?",
        a: "Interests, hobbies, values, travel, life goals, humour, what you're reading or watching, your outlook on relationships — anything that reveals character. The best connections come from genuine curiosity about the other person.",
      },
      {
        q: "What topics are off-limits?",
        a: "Beyond contact details and precise location: avoid explicit sexual content, discriminatory or offensive language, discussions of income or net worth, and anything designed to pressure or manipulate. Keep it respectful and genuine.",
      },
      {
        q: "Can I screen-record or screenshot the call?",
        a: "No. Recording, screenshotting, or capturing any part of a video call is strictly forbidden and will result in immediate account termination. All calls are private and confidential.",
      },
      {
        q: "What if someone breaks these rules?",
        a: "Every call has a red button — press it to immediately end the session and file a report. Our team reviews every report within 24 hours. Violations can result in warnings, temporary suspension, or permanent removal depending on severity.",
      },
      {
        q: "Can I ask someone out directly during a call?",
        a: "There's no need — the platform handles that for you. If you both give a thumbs up, you'll automatically progress to the next stage. Let the conversation flow naturally without pressure.",
      },
    ],
  },
  {
    title: "General",
    items: [
      {
        q: "Can I cancel at any time?",
        a: "Yes. Silver memberships can be cancelled at any time. If you cancel within 30 days, you'll receive a full refund — no questions asked.",
      },
      {
        q: "How are matches made?",
        a: "Our matching considers your stated preferences — gender, age bracket, location — alongside availability. As we grow, matching will incorporate behavioural signals to improve compatibility over time.",
      },
      {
        q: "Is AUR³M available in my city?",
        a: "We're currently launching in select UK cities. Enter your location during signup and we'll match you with members nearby. Expansion plans are underway.",
      },
      {
        q: "I have more questions — how do I get in touch?",
        a: "Drop us a line at hello@aur3m.com. We typically respond within 24 hours.",
      },
    ],
  },
];

const FAQPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center gap-4 h-16">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display text-lg font-semibold text-foreground">
            How It Works
          </span>
        </div>
      </header>

      <main className="flex-1 container py-12 md:py-20 max-w-3xl">
        <ScrollReveal>
          <h1
            className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-3"
            style={{ lineHeight: 1.15, textWrap: "balance" } as React.CSSProperties}
          >
            Everything you need to know
          </h1>
          <p className="text-muted-foreground max-w-lg mb-14" style={{ textWrap: "pretty" } as React.CSSProperties}>
            From your first anonymous Speed Round to meeting in person and beyond — here's what each stage looks like.
          </p>
        </ScrollReveal>

        <div className="space-y-12">
          {sections.map((section, si) => (
            <ScrollReveal key={section.title} delay={si * 80}>
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-1">
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {section.subtitle}
                  </p>
                )}
                {!section.subtitle && <div className="mb-4" />}

                <Accordion type="multiple" className="space-y-2">
                  {section.items.map((item, qi) => (
                    <AccordionItem
                      key={qi}
                      value={`${si}-${qi}`}
                      className="border border-border rounded-xl px-5 bg-card data-[state=open]:shadow-sm transition-shadow duration-300"
                    >
                      <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline py-4">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
