import { ScrollReveal } from "@/components/ScrollReveal";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 3200, suffix: "+", label: "London professionals", prefix: "" },
  { value: 47, suffix: " min", label: "Average deep conversation", prefix: "" },
  { value: 4.8, suffix: "/5", label: "Member satisfaction", prefix: "" },
];

const AnimatedNumber = ({
  value,
  suffix,
  prefix,
  active,
}: {
  value: number;
  suffix: string;
  prefix: string;
  active: boolean;
}) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;
    const isDecimal = value % 1 !== 0;
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(value, increment * step);
      setDisplay(isDecimal ? parseFloat(current.toFixed(1)) : Math.round(current));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [active, value]);

  return (
    <span className="tabular-nums">
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
};

export const SuccessMetricsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 md:py-32 bg-primary text-primary-foreground" ref={ref}>
      <div className="container max-w-5xl">
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight text-wrap-balance">
              Real results from real professionals
            </h2>
            <p className="mt-4 text-primary-foreground/70 max-w-lg mx-auto">
              Not vanity metrics. These numbers come from members who chose
              depth over volume — and found what they were looking for.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-3 gap-8 md:gap-4">
          {stats.map((s, idx) => (
            <ScrollReveal key={s.label} delay={idx * 100}>
              <div className="text-center space-y-2">
                <p className="font-display text-4xl md:text-5xl font-bold tracking-tight">
                  <AnimatedNumber
                    value={s.value}
                    suffix={s.suffix}
                    prefix={s.prefix}
                    active={active}
                  />
                </p>
                <p className="text-sm text-primary-foreground/60 font-medium">
                  {s.label}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
