import { Shield, CloudRain, Banknote, TrendingUp, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";

const stats = [
  { label: "Active Policy", value: "Weather Shield", sub: "Expires in 4 days", icon: Shield, accent: "text-primary", trend: null },
  { label: "Claims This Month", value: "3", sub: "2 approved, 1 pending", icon: CloudRain, accent: "text-amber", trend: "+1" },
  { label: "Total Payouts", value: "₹1,847", sub: "+₹620 this week", icon: Banknote, accent: "text-primary", trend: "+34%" },
  { label: "Trust Score", value: "94.2%", sub: "Excellent standing", icon: TrendingUp, accent: "text-primary", trend: "+2.1%" },
];

const recentActivity = [
  { time: "2h ago", event: "Heavy rainfall detected in HSR Layout zone", type: "trigger" as const },
  { time: "2h ago", event: "AI Council validated claim #1847 — PAY", type: "approved" as const },
  { time: "2h ago", event: "₹620 disbursed to UPI", type: "payout" as const },
  { time: "1d ago", event: "AQI threshold reached in Koramangala — claim #1842 filed", type: "trigger" as const },
  { time: "1d ago", event: "Claim #1842 approved — ₹410 paid", type: "approved" as const },
  { time: "5d ago", event: "Weekly premium ₹49 auto-deducted", type: "billing" as const },
];

const typeStyles = {
  trigger: "bg-amber-light text-amber",
  approved: "bg-sage-100 text-primary",
  payout: "bg-sage-100 text-primary",
  billing: "bg-muted text-muted-foreground",
};

const typeIcons = {
  trigger: "⚡",
  approved: "✓",
  payout: "💸",
  billing: "📋",
};

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <stat.icon className={`w-4.5 h-4.5 ${stat.accent}`} />
              </div>
              {stat.trend && (
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-primary">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="font-display font-bold text-xl tabular-nums">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Earnings snapshot with visual bar */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-4">EARNINGS BREAKDOWN — THIS WEEK</p>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "EXPECTED", value: "₹1,200", desc: "Normal week" },
            { label: "ACTUAL", value: "₹310", desc: "Post-disruption" },
            { label: "COVERED", value: "₹890", desc: "By ChillInsure", highlight: true },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl p-4 border ${
                item.highlight ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-border"
              }`}
            >
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-1">{item.label}</p>
              <p className={`font-display font-bold text-lg tabular-nums ${item.highlight ? "text-primary" : ""}`}>
                {item.value}
              </p>
              <p className="text-[11px] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
        {/* Visual earnings bar */}
        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
          <div className="h-full bg-coral/60 rounded-l-full" style={{ width: "26%" }} title="Lost to weather" />
          <div className="h-full bg-primary" style={{ width: "74%" }} title="Covered by ChillInsure" />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
          <span>Lost: ₹310</span>
          <span className="text-primary font-semibold">Recovered: ₹890 (74%)</span>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold">Recent Activity</h3>
          <Activity className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {recentActivity.map((item, i) => (
            <div key={i} className="px-5 py-3.5 flex items-start gap-3 hover:bg-muted/20 transition-colors">
              <span className={`mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${typeStyles[item.type]}`}>
                {typeIcons[item.type]} {item.type}
              </span>
              <p className="text-sm flex-1">{item.event}</p>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
