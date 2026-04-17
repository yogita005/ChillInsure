import { useReveal } from "@/hooks/use-reveal";
import { CloudRain, Wind, AlertTriangle, Droplets, CheckCircle2 } from "lucide-react";

const coverages = [
  { icon: CloudRain, label: "Heavy rainfall", threshold: "> 35mm/hr in your zone", impact: "Most common trigger", pct: "62%" },
  { icon: Droplets, label: "Flooding", threshold: "Active flood warning in delivery area", impact: "Highest payouts", pct: "18%" },
  { icon: Wind, label: "Poor air quality", threshold: "AQI > 300 in your zone", impact: "Growing concern", pct: "14%" },
  { icon: AlertTriangle, label: "Civic disruptions", threshold: "Curfew or restriction alerts", impact: "Instant verification", pct: "6%" },
];

export function ProtectionSection() {
  const refHeader = useReveal();
  const refCards = useReveal();

  return (
    <section id="protection" className="py-28 px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--sage-100))_0%,transparent_50%)]" />

      <div className="container max-w-6xl mx-auto relative">
        <div ref={refHeader} className="reveal max-w-2xl mb-16">
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">What's covered</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-balance">
            When conditions hit, we've got you
          </h2>
          <p className="text-muted-foreground text-pretty">
            Parametric triggers mean no subjective decisions — if the threshold is met in your zone, you're automatically eligible.
          </p>
        </div>

        <div ref={refCards} className="reveal grid sm:grid-cols-2 gap-4 max-w-3xl stagger-children">
          {coverages.map((item) => (
            <div key={item.label} className="card-lift bg-card border border-border/60 rounded-2xl p-6 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-display font-bold text-2xl text-primary/20 tabular-nums">{item.pct}</span>
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">{item.label}</h3>
              <p className="text-sm text-muted-foreground mb-3">{item.threshold}</p>
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="font-medium">{item.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
