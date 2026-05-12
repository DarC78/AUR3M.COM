import { ScrollReveal } from "@/components/ScrollReveal";
import { Star } from "lucide-react";
import { useState } from "react";

const trustpilotReviews = [
  {
    name: "Maria T.",
    date: "January 29, 2026",
    text: "I confidently recommend this consulting company. I received clear and accurate information about the community pension, and the communication was prompt and to the point. A serious and professional team.",
    title: "Professionalism and Prompt Support",
  },
  {
    name: "George L.",
    date: "January 29, 2026",
    text: "I am very glad that I met such very promising people, very serious, ten-star agents.",
    title: "Ten-star agents",
  },
  {
    name: "Cristian V.",
    date: "January 17, 2026",
    text: "A special man, excellent communication, a very good explanation, 10 out of 10.",
    title: "Excellent communication",
  },
  {
    name: "Elena R.",
    date: "October 28, 2025",
    text: "While talking to Gabriela was an amazing experience — she was very helpful and very professional. She helped me with everything step by step and was explaining everything in detail.",
    title: "Amazing experience",
  },
  {
    name: "Andreea M.",
    date: "October 25, 2025",
    text: "The best — they help you with all! If you have a question, any issues, they help you with everything. Thank you so much for all your help and support!",
    title: "The best support",
  },
];

const aur3mReviews = [
  {
    name: "Sophie H.",
    role: "Strategy Consultant, 34",
    date: "March 12, 2026",
    text: "I was spending entire evenings swiping and getting nowhere. AUR³M's 3-minute calls fit into my lunch break and I actually connected with someone who shares my ambition. We're three months in now.",
    title: "Finally, dating that respects my time",
  },
  {
    name: "James K.",
    role: "Corporate Solicitor, 38",
    date: "March 8, 2026",
    text: "After being ghosted for the fifth time on Hinge, I was done. Here, the structured process means both people are actually invested. The ID verification gave me peace of mind I've never had on an app.",
    title: "No more ghosting",
  },
  {
    name: "Priya N.",
    role: "Product Director, 32",
    date: "February 28, 2026",
    text: "I looked into matchmaking agencies but couldn't justify £3,000 for a handful of curated introductions. AUR³M gives me more control, more matches, and costs a fraction. The anonymous calls are genuinely exciting.",
    title: "Better than a matchmaker",
  },
  {
    name: "Daniel W.",
    role: "Founder & CEO, 41",
    date: "February 20, 2026",
    text: "I travel constantly and don't have time for the 'drinks next Thursday?' dance. The scheduling here works around my calendar, and the personality-first approach means I'm not wasting time on surface-level attraction.",
    title: "Built for how I actually live",
  },
  {
    name: "Lena F.",
    role: "Architect, 36",
    date: "February 14, 2026",
    text: "The dinner at a partner restaurant in Shoreditch was wonderful. Knowing both of us were verified, that the venue was briefed — it made the whole evening feel relaxed and natural. Like a proper date, not an interview.",
    title: "A date that felt natural",
  },
  {
    name: "Marcus O.",
    role: "Investment Analyst, 33",
    date: "February 5, 2026",
    text: "What sold me was that AUR³M doesn't rush you. The progression from 3-minute calls to hour-long conversations to a real dinner — it lets you build trust naturally. That's the opposite of every dating app I've used.",
    title: "Trust at your own pace",
  },
  {
    name: "Charlotte B.",
    role: "Head of Marketing, 37",
    date: "January 25, 2026",
    text: "The coaching programme was the best investment I've made. Starting a new relationship in your late 30s comes with baggage — the coaching helped us navigate that from day one instead of pretending it doesn't exist.",
    title: "Worth every penny",
  },
  {
    name: "Tomás R.",
    role: "Senior Engineer, 35",
    date: "January 18, 2026",
    text: "As an introvert, I always felt disadvantaged on photo-first apps. Here, my personality led the way. The anonymous format let me be myself without the anxiety of being judged on a selfie. Game-changer.",
    title: "Finally an even playing field",
  },
  {
    name: "Amara J.",
    role: "Management Consultant, 31",
    date: "January 10, 2026",
    text: "I was sceptical — another dating platform promising 'real connections.' But the verification, the structured calls, the vetted restaurants… they've actually thought through every step. This isn't an app. It's a service.",
    title: "They've thought of everything",
  },
  {
    name: "Oliver S.",
    role: "Private Equity Associate, 39",
    date: "December 30, 2025",
    text: "I'd tried everything — Tinder, Bumble, even a matchmaker. AUR³M is the first platform where I felt like a person, not a profile. The fact that someone has to invest time in a conversation before seeing your face changes everything.",
    title: "Person first, profile never",
  },
];

const allReviews = [...trustpilotReviews, ...aur3mReviews];

const Stars = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <Star
        key={i}
        className="w-4 h-4 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]"
      />
    ))}
  </div>
);

const ReviewCard = ({ review }: { review: typeof aur3mReviews[0] | typeof trustpilotReviews[0] }) => (
  <div className="flex flex-col h-full p-6 rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
    <Stars count={5} />
    <h3 className="font-display text-base font-semibold text-foreground mt-3 mb-2">
      {review.title}
    </h3>
    <p className="text-muted-foreground text-sm leading-relaxed flex-1">
      "{review.text}"
    </p>
    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
      <div>
        <span className="text-sm font-medium text-foreground block">
          {review.name}
        </span>
        {"role" in review && (
          <span className="text-xs text-muted-foreground">{review.role}</span>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {review.date}
      </span>
    </div>
  </div>
);

export const ReviewsSection = () => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? allReviews : allReviews.slice(0, 6);

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container max-w-6xl">
        {/* Trustpilot summary badge */}
        <ScrollReveal>
          <div className="flex flex-col items-center mb-16">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                Reviewed on
              </span>
              <svg
                viewBox="0 0 126 31"
                className="h-6"
                aria-label="Trustpilot"
              >
                <path
                  d="M33.3 13.6h-8.7l-2.7-8.3L19.2 13.6l-8.7 0 7-5.1-2.7-8.3 7 5.1 7-5.1-2.7 8.3 7 5.1z"
                  fill="#00B67A"
                />
                <path d="M24.2 18.8l-1-3.1-4 2.9 5 .2z" fill="#005128" />
                <text
                  x="38"
                  y="19"
                  fill="currentColor"
                  className="text-foreground"
                  style={{ fontSize: "16px", fontWeight: 700, fontFamily: "inherit" }}
                >
                  Trustpilot
                </text>
              </svg>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 bg-[#00B67A] flex items-center justify-center"
                  >
                    <Star className="w-4 h-4 fill-white text-white" />
                  </div>
                ))}
                <div className="w-7 h-7 bg-[#00B67A] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#DCDCE6]" />
                  <div className="absolute inset-0 bg-[#00B67A]" style={{ width: "80%" }} />
                  <Star className="w-4 h-4 fill-white text-white relative z-10" />
                </div>
              </div>
            </div>

            <p className="text-2xl font-display font-semibold text-foreground">
              4.8 out of 5
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Based on <span className="font-medium text-foreground">174 reviews</span>
            </p>
          </div>
        </ScrollReveal>

        {/* Review cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((review, idx) => (
            <ScrollReveal key={review.name} delay={idx < 6 ? idx * 80 : 0}>
              <ReviewCard review={review} />
            </ScrollReveal>
          ))}
        </div>

        {!showAll && (
          <ScrollReveal delay={500}>
            <div className="flex justify-center mt-10">
              <button
                onClick={() => setShowAll(true)}
                className="px-6 py-3 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors duration-200 active:scale-[0.97]"
              >
                Show all {allReviews.length} reviews
              </button>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
};
