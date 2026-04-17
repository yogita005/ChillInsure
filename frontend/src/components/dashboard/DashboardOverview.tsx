import { Shield, CloudRain, Banknote, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { useDashboardOverview } from "@/hooks/use-dashboard";

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
  const { data, loading, error } = useDashboardOverview();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">Loading dashboard…</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Unable to load dashboard data.</p>
        {error && <p className="text-xs mt-1">{error}</p>}
      </div>
    );
  }

  const stats = [
    { label: "Active Policy", value: data.policy.name, sub: `Expires in ${data.policy.expiresIn}`, icon: Shield, accent: "text-primary", trend: null },
    { label: "Claims This Month", value: String(data.claims.total), sub: `${data.claims.approved} approved, ${data.claims.pending} pending`, icon: CloudRain, accent: "text-amber", trend: `+${data.claims.pending}` },
    { label: "Total Payouts", value: `₹${data.payouts.totalAmount.toLocaleString()}`, sub: `+₹${data.payouts.thisWeek} this week`, icon: Banknote, accent: "text-primary", trend: data.payouts.thisWeekChange },
    { label: "Trust Score", value: `${data.trustScore.score}%`, sub: data.trustScore.label, icon: TrendingUp, accent: "text-primary", trend: data.trustScore.change },
  ];

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
            { label: "EXPECTED", value: `₹${data.earnings.expected.toLocaleString()}`, desc: "Normal week" },
            { label: "ACTUAL", value: `₹${data.earnings.actual.toLocaleString()}`, desc: "Post-disruption" },
            { label: "COVERED", value: `₹${data.earnings.covered.toLocaleString()}`, desc: "By ChillInsure", highlight: true },
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
          <div className="h-full bg-coral/60 rounded-l-full" style={{ width: `${100 - data.earnings.coveredPercentage}%` }} title="Lost to weather" />
          <div className="h-full bg-primary" style={{ width: `${data.earnings.coveredPercentage}%` }} title="Covered by ChillInsure" />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
          <span>Lost: ₹{data.earnings.actual.toLocaleString()}</span>
          <span className="text-primary font-semibold">Recovered: ₹{data.earnings.covered.toLocaleString()} ({data.earnings.coveredPercentage}%)</span>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold">Recent Activity</h3>
          <Activity className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {data.recentActivity.map((item, i) => (
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
