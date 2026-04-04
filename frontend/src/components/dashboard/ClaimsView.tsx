import { useState } from "react";
import { CheckCircle2, Clock, XCircle, MapPin, Briefcase, Timer, Globe, ShieldCheck, X } from "lucide-react";

const claims = [
  {
    id: "CLM-7842",
    date: "Mar 18, 2026",
    trigger: "Heavy rain — HSR Layout",
    status: "approved" as const,
    amount: "₹620",
    expected: "₹1,200",
    actual: "₹310",
    agents: "5/5 PAY",
    confidence: 97,
    council: [
      { name: "Zone Agent", icon: MapPin, vote: "PAY" as const, confidence: 94, finding: "GPS confirmed within 200m of disruption zone for 47 min" },
      { name: "Work Agent", icon: Briefcase, vote: "PAY" as const, confidence: 91, finding: "Completed 2 orders vs normal 8 — 75% reduction consistent with disruption" },
      { name: "Behavior Agent", icon: Timer, vote: "PAY" as const, confidence: 88, finding: "Movement patterns consistent with heavy rain avoidance behavior" },
      { name: "Reality Agent", icon: Globe, vote: "PAY" as const, confidence: 96, finding: "IMD confirmed 84mm rainfall in sector; flood warning active" },
      { name: "Trust Agent", icon: ShieldCheck, vote: "PAY" as const, confidence: 92, finding: "Clean history — 14 months, 3 prior claims, all verified legitimate" },
    ],
  },
  {
    id: "CLM-7843",
    date: "Mar 17, 2026",
    trigger: "AQI > 300 — Koramangala",
    status: "approved" as const,
    amount: "₹410",
    expected: "₹800",
    actual: "₹280",
    agents: "4/5 PAY",
    confidence: 89,
    council: [
      { name: "Zone Agent", icon: MapPin, vote: "PAY" as const, confidence: 91, finding: "All pings within 1.2km of AQI sensor station" },
      { name: "Work Agent", icon: Briefcase, vote: "PAY" as const, confidence: 87, finding: "Delivery attempts fell 61% vs daily avg" },
      { name: "Behavior Agent", icon: Timer, vote: "PAY" as const, confidence: 89, finding: "Reduced outdoor time by 40% — matches zone pattern" },
      { name: "Reality Agent", icon: Globe, vote: "PAY" as const, confidence: 93, finding: "CPCB station confirms AQI 318 at 14:30" },
      { name: "Trust Agent", icon: ShieldCheck, vote: "PARTIAL" as const, confidence: 78, finding: "2 prior claims this month — within normal range" },
    ],
  },
  {
    id: "CLM-7844",
    date: "Mar 14, 2026",
    trigger: "Flooding — Silk Board",
    status: "pending" as const,
    amount: "₹530",
    expected: "₹950",
    actual: "₹420",
    agents: "3/5 PAY",
    confidence: 72,
    council: [
      { name: "Zone Agent", icon: MapPin, vote: "PAY" as const, confidence: 82, finding: "GPS near flood zone but 400m from epicenter" },
      { name: "Work Agent", icon: Briefcase, vote: "PAY" as const, confidence: 78, finding: "Order volume dropped but some deliveries completed" },
      { name: "Behavior Agent", icon: Timer, vote: "PARTIAL" as const, confidence: 65, finding: "Movement patterns partially consistent" },
      { name: "Reality Agent", icon: Globe, vote: "PAY" as const, confidence: 85, finding: "Flooding confirmed by BBMP civic data" },
      { name: "Trust Agent", icon: ShieldCheck, vote: "PARTIAL" as const, confidence: 70, finding: "Newer account — limited history for pattern analysis" },
    ],
  },
  {
    id: "CLM-7845",
    date: "Mar 10, 2026",
    trigger: "Heavy rain — Indiranagar",
    status: "approved" as const,
    amount: "₹287",
    expected: "₹600",
    actual: "₹200",
    agents: "5/5 PAY",
    confidence: 95,
    council: [
      { name: "Zone Agent", icon: MapPin, vote: "PAY" as const, confidence: 96, finding: "Confirmed in Indiranagar throughout event" },
      { name: "Work Agent", icon: Briefcase, vote: "PAY" as const, confidence: 94, finding: "Near complete work stoppage during rain window" },
      { name: "Behavior Agent", icon: Timer, vote: "PAY" as const, confidence: 92, finding: "Speed/movement consistent with rain disruption" },
      { name: "Reality Agent", icon: Globe, vote: "PAY" as const, confidence: 97, finding: "IMD confirmed heavy rainfall; multiple sensors agree" },
      { name: "Trust Agent", icon: ShieldCheck, vote: "PAY" as const, confidence: 95, finding: "High trust score — excellent claim history" },
    ],
  },
  {
    id: "CLM-7846",
    date: "Mar 6, 2026",
    trigger: "Curfew — Whitefield",
    status: "rejected" as const,
    amount: "—",
    expected: "₹700",
    actual: "₹700",
    agents: "1/5 PAY",
    confidence: 18,
    council: [
      { name: "Zone Agent", icon: MapPin, vote: "REJECT" as const, confidence: 22, finding: "GPS trail shows user was 8km outside curfew zone" },
      { name: "Work Agent", icon: Briefcase, vote: "REJECT" as const, confidence: 15, finding: "Normal order activity detected — no disruption evident" },
      { name: "Behavior Agent", icon: Timer, vote: "REJECT" as const, confidence: 12, finding: "Movement patterns identical to non-disruption days" },
      { name: "Reality Agent", icon: Globe, vote: "PAY" as const, confidence: 91, finding: "Curfew confirmed in Whitefield — event is real" },
      { name: "Trust Agent", icon: ShieldCheck, vote: "REJECT" as const, confidence: 8, finding: "User was not impacted — location mismatch flagged" },
    ],
  },
];

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
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
              { label: "PAYOUT", value: selected.amount, highlight: true },
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
                const AgentIcon = agent.icon;
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
