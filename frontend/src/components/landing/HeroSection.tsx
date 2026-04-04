import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Zap, CloudRain, ArrowRight, Users, Clock } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import heroImage from "@/assets/hero-illustration.png";

const stats = [
  { value: "12,847", label: "riders protected", icon: Users },
  { value: "< 4 min", label: "avg payout time", icon: Clock },
  { value: "₹2.1Cr", label: "total payouts", icon: Zap },
];

interface HeroSectionProps {
  onGetStarted?: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const refLeft = useReveal("left");
  const refRight = useReveal("right");

  return (
    <section className="relative pt-28 pb-24 px-6 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl orb" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-accent/40 blur-3xl orb-slow" />
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="container max-w-6xl mx-auto relative">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left: copy */}
          <div ref={refLeft} className="reveal-left flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-6 border border-border/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Parametric insurance for India's gig workforce
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.06] mb-6 text-balance">
              Rain won't stop you.
              <br />
              <span className="text-gradient">Neither will lost earnings.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mb-8 text-pretty leading-relaxed">
              Automatic payouts when weather disrupts your deliveries. No claims to file, no paperwork — just protection that works as hard as you do.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Button variant="hero" size="xl" className="group" onClick={onGetStarted}>
                Start earning safely
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
              <a href="#how-it-works">
                <Button variant="hero-outline" size="xl">
                  See how it works
                </Button>
              </a>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-8">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm tabular-nums">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero illustration with floating cards */}
          <div ref={refRight} className="reveal-right flex-shrink-0 lg:w-[420px] relative">
            <div className="relative">
              <img
                src={heroImage}
                alt="Delivery rider protected by a green shield from rain"
                className="w-full h-auto animate-float drop-shadow-2xl"
              />

              {/* Floating card: payout */}
              <div className="absolute -left-8 top-8 bg-card rounded-2xl p-3 shadow-xl shadow-foreground/5 border border-border/60 animate-float" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Auto-payout</p>
                    <p className="font-display font-bold text-sm">₹620</p>
                  </div>
                </div>
              </div>

              {/* Floating card: shield */}
              <div className="absolute -right-4 bottom-16 bg-card rounded-2xl p-3 shadow-xl shadow-foreground/5 border border-border/60 animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Trust Score</p>
                    <p className="font-display font-bold text-sm text-primary">94.2%</p>
                  </div>
                </div>
              </div>

              {/* Floating weather badge */}
              <div className="absolute left-4 -bottom-2 bg-card rounded-xl px-3 py-2 shadow-xl shadow-foreground/5 border border-border/60 animate-float" style={{ animationDelay: "1.5s" }}>
                <div className="flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium">42mm/hr detected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
