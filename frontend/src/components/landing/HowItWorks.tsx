import { CloudRain, Brain, Banknote, Shield, ArrowRight } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

const steps = [
  {
    icon: Shield,
    title: "Subscribe weekly",
    desc: "Pay ₹49/week via UPI. Cancel anytime. Coverage starts instantly.",
    num: "01",
    accent: "bg-secondary text-primary",
  },
  {
    icon: CloudRain,
    title: "Weather triggers detected",
    desc: "Our system monitors rainfall, AQI, and flood alerts in your delivery zone — 24/7.",
    num: "02",
    accent: "bg-accent text-accent-foreground",
  },
  {
    icon: Brain,
    title: "AI Council validates",
    desc: "Five specialized AI agents cross-verify your location, activity, and conditions.",
    num: "03",
    accent: "bg-sage-100 text-sage-700",
  },
  {
    icon: Banknote,
    title: "Instant payout",
    desc: "Compensation hits your UPI within minutes. No claim forms, no waiting.",
    num: "04",
    accent: "bg-primary text-primary-foreground",
  },
];

export function HowItWorks() {
  const ref = useReveal();

  return (
    <section id="how-it-works" className="py-28 px-6 relative">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div ref={ref} className="reveal container max-w-6xl mx-auto relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">How it works</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-balance">
            Protection on autopilot
          </h2>
          <p className="text-muted-foreground text-pretty">
            From subscribing to receiving your payout — everything happens automatically. Here's the full cycle in four steps.
          </p>
        </div>

        {/* Timeline layout */}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-px bg-border" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.num} className={`reveal reveal-delay-${i + 1} visible relative`}>
                {/* Step number on line */}
                <div className="hidden lg:flex w-8 h-8 rounded-full bg-background border-2 border-primary items-center justify-center mx-auto mb-6 relative z-10">
                  <span className="text-xs font-bold text-primary tabular-nums">{i + 1}</span>
                </div>

                <div className="card-lift bg-card rounded-2xl p-6 border border-border/60 h-full">
                  <div className={`w-11 h-11 rounded-xl ${step.accent} flex items-center justify-center mb-4`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/40 mb-2 block lg:hidden">{step.num}</span>
                  <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{step.desc}</p>
                </div>

                {/* Arrow between cards (mobile/tablet) */}
                {i < 3 && (
                  <div className="hidden sm:flex lg:hidden justify-center my-2">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 rotate-90 sm:rotate-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
