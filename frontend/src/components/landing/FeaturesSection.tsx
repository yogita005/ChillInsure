import { MapPin, Activity, Eye, Globe, ShieldCheck, Brain } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

const agents = [
  { icon: MapPin, name: "Zone Agent", role: "Validates you were in the disruption area using GPS trail analysis", color: "bg-sage-100 text-sage-700", confidence: "94%" },
  { icon: Activity, name: "Work Agent", role: "Checks your delivery activity vs. normal earning patterns", color: "bg-accent text-accent-foreground", confidence: "91%" },
  { icon: Eye, name: "Behavior Agent", role: "Detects impossible movements, speed anomalies, or timing conflicts", color: "bg-coral-light text-coral", confidence: "88%" },
  { icon: Globe, name: "Reality Agent", role: "Corroborates conditions with IMD, CPCB, and satellite data", color: "bg-secondary text-secondary-foreground", confidence: "96%" },
  { icon: ShieldCheck, name: "Trust Agent", role: "Calculates credibility score using ML models and claim history", color: "bg-sage-100 text-primary", confidence: "92%" },
];

export function FeaturesSection() {
  const refHeader = useReveal();
  const refCards = useReveal();

  return (
    <section id="features" className="py-28 px-6 bg-card relative overflow-hidden">
      {/* Decorative orb */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/3 blur-3xl orb-slow" />

      <div className="container max-w-6xl mx-auto relative">
        <div ref={refHeader} className="reveal flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16 gap-6">
          <div>
            <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">AI Council</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-balance">
              Five agents. One fair decision.
            </h2>
            <p className="text-muted-foreground max-w-lg text-pretty">
              Every claim is evaluated by a council of specialized AI agents — ensuring accuracy and eliminating fraud without penalizing honest workers.
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-secondary rounded-2xl border border-border/60 shrink-0">
            <Brain className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs font-semibold text-foreground">Consensus-based</p>
              <p className="text-[11px] text-muted-foreground">No single point of failure</p>
            </div>
          </div>
        </div>

        <div ref={refCards} className="reveal grid sm:grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="card-lift rounded-2xl p-5 bg-background border border-border/60 group"
            >
              <div className={`w-10 h-10 rounded-xl ${agent.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                <agent.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-sm mb-1">{agent.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{agent.role}</p>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full" style={{ width: agent.confidence }} />
                </div>
                <span className="text-[10px] font-mono text-primary font-semibold tabular-nums">{agent.confidence}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
