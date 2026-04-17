import { useState } from "react";
import { CheckCircle2, Clock, XCircle, MapPin, Briefcase, Timer, Globe, ShieldCheck, X, Loader2, Zap } from "lucide-react";
import { useDashboardClaims, type DashboardClaim } from "@/hooks/use-dashboard";

const statusConfig = {
  approved: { icon: CheckCircle2, label: "Approved", class: "text-primary bg-sage-100" },
  pending: { icon: Clock, label: "Under Review", class: "text-amber bg-amber-light" },
  rejected: { icon: XCircle, label: "Rejected", class: "text-coral bg-coral-light" },
};

const voteColor = {
  PAY: "text-primary",
  PARTIAL: "text-amber",
  REJECT: "text-coral",
};

const agentIconMap: Record<string, React.ElementType> = {
  zone: MapPin,
  work: Briefcase,
  behavior: Timer,
  reality: Globe,
  trust: ShieldCheck,
};

/* Consensus ring SVG */
function ConsensusRing({ score }: { score: number }) {
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="consensus-ring"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-bold text-xl tabular-nums text-primary">{score}%</span>
      </div>
    </div>
  );
}

export function ClaimsView() {
  const { claims, loading, error } = useDashboardClaims();
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">Loading claims…</span>
      </div>
    );
  }

  if (error && claims.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Unable to load claims data.</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  const filtered = filter === "all" ? claims : claims.filter((c) => c.status === filter);
  const selected = claims.find((c) => c.id === selectedId);

  return (
    <div className="flex gap-4 min-h-[600px]">
      {/* Left: Claims list */}
      <div className={`flex-1 min-w-0 space-y-4 ${selected ? "hidden lg:block" : ""}`}>
        <div>
          <h2 className="font-display font-bold text-lg mb-1">Claims Management</h2>
          <p className="text-sm text-muted-foreground">Review and manage AI Council decisions</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(["all", "approved", "pending", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Claims table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground text-xs">ID</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">Trigger</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Amount</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">Council</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => {
                const cfg = statusConfig[c.status];
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedId === c.id
                        ? "bg-primary/5"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold">{c.id}</p>
                      <p className="text-[11px] text-muted-foreground sm:hidden">{c.trigger}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      <p className="text-xs">{c.trigger}</p>
                      <p className="text-[11px] text-muted-foreground">{c.date}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.class}`}>
                        <cfg.icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-display font-semibold tabular-nums text-sm">{c.amount}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{c.agents}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: Detail panel */}
      {selected && (
        <div className="w-full lg:w-[420px] shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm">{selected.id} Detail</h3>
            <button
              onClick={() => setSelectedId(null)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Earnings breakdown */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "EXPECTED", value: selected.expected },
              { label: "ACTUAL", value: selected.actual },
              { 
                label: selected.trigger.includes("(Auto Pay)") ? "PAYOUT (AUTO)" : "PAYOUT", 
                value: selected.amount, 
                highlight: true 
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl p-3 border ${
                  item.highlight ? "bg-primary/10 border-primary/30" : "bg-card border-border"
                }`}
              >
                <p className="text-[9px] font-semibold tracking-widest text-muted-foreground">{item.label}</p>
                <p className={`font-display font-bold tabular-nums ${item.highlight ? "text-primary" : ""}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {selected.trigger.includes("(Auto Pay)") && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
               <Zap className="w-4 h-4 text-primary fill-primary/20" />
               <div className="flex-1">
                 <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Instant Auto-Payment</p>
                 <p className="text-[11px] text-muted-foreground">Disbursed automatically via AI Council consensus</p>
               </div>
            </div>
          )}

          {/* Consensus score */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-5">
              <div className="flex-1">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-2">CONSENSUS SCORE</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${statusConfig[selected.status].class}`}>
                  {statusConfig[selected.status].label.toUpperCase()}
                </span>
              </div>
              <ConsensusRing score={selected.confidence} />
            </div>
          </div>

          {/* AI Council decisions */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-3">AI COUNCIL DECISIONS</p>
            <div className="space-y-2">
              {selected.council.map((agent) => {
                const AgentIcon = agentIconMap[agent.agentId] || MapPin;
                return (
                  <div key={agent.name} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <AgentIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-display font-semibold text-sm">{agent.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${voteColor[agent.vote]}`}>{agent.vote}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">{agent.confidence}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{agent.finding}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
