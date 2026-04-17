import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingDown, DollarSign, TargetIcon } from "lucide-react";

const lossRatioData = [
  { week: "W1", ratio: 38.2, threshold: 45, premium: 120000, payout: 45840 },
  { week: "W2", ratio: 41.5, threshold: 45, premium: 125000, payout: 51875 },
  { week: "W3", ratio: 39.8, threshold: 45, premium: 128000, payout: 50944 },
  { week: "W4", ratio: 42.3, threshold: 45, premium: 118000, payout: 49954 },
];

const zoneRatios = [
  { zone: "T. Nagar, Chennai", ratio: 38.5, premium: 45000, payout: 17325, status: "Healthy" },
  { zone: "Mylapore, Chennai", ratio: 44.2, premium: 52000, payout: 23024, status: "Warning" },
  { zone: "Velachery, Chennai", ratio: 41.8, premium: 48000, payout: 20064, status: "Healthy" },
  { zone: "Anna Nagar, Chennai", ratio: 46.3, premium: 38000, payout: 17594, status: "Critical" },
  { zone: "Adyar, Chennai", ratio: 39.7, premium: 42000, payout: 16674, status: "Healthy" },
  { zone: "Nungambakkam, Chennai", ratio: 43.1, premium: 35000, payout: 15085, status: "Warning" },
];

export function LossRatios() {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Overall Loss Ratio</p>
            <TrendingDown className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display font-bold text-3xl">42.3%</p>
          <p className="text-xs text-muted-foreground mt-2">Within sustainable threshold (45%)</p>
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: "94%" }} />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Weekly Premium</p>
            <DollarSign className="w-5 h-5 text-amber" />
          </div>
          <p className="font-display font-bold text-3xl">₹54.2L</p>
          <p className="text-xs text-muted-foreground mt-2">+₹8.3L vs last week</p>
          <p className="text-xs text-primary font-semibold mt-1">↑ 18% growth</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Weekly Payout</p>
            <TargetIcon className="w-5 h-5 text-coral" />
          </div>
          <p className="font-display font-bold text-3xl">₹22.9L</p>
          <p className="text-xs text-muted-foreground mt-2">42.3% of premiums collected</p>
          <p className="text-xs text-coral font-semibold mt-1">↑ Growing with disruptions</p>
        </div>
      </div>

      {/* Loss Ratio Trend */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">Loss Ratio Trend (Monthly)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={lossRatioData}>
            <defs>
              <linearGradient id="colorRatio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorThreshold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
            <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
              labelStyle={{ color: "#fff" }}
              formatter={(value) => `${value}%`}
            />
            <Area type="monotone" dataKey="ratio" stroke="#3b82f6" fill="url(#colorRatio)" name="Current Ratio" />
            <Line type="monotone" dataKey="threshold" stroke="#ef4444" strokeDasharray="5 5" name="Threshold (45%)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Zone-wise Loss Ratios */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">Loss Ratios by Zone</h3>
        <div className="space-y-3">
          {zoneRatios.map((zone, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/30 transition-colors">
              <div className="flex-1">
                <p className="font-medium text-sm">{zone.zone}</p>
                <p className="text-xs text-muted-foreground">₹{(zone.premium / 100000).toFixed(1)}L premium → ₹{(zone.payout / 100000).toFixed(2)}L payout</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-sm">{zone.ratio}%</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    zone.status === "Healthy" ? "bg-sage-100 text-primary" :
                    zone.status === "Warning" ? "bg-amber/20 text-amber" :
                    "bg-coral/20 text-coral"
                  }`}>
                    {zone.status}
                  </span>
                </div>
                <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      zone.ratio <= 40 ? "bg-primary" :
                      zone.ratio <= 45 ? "bg-amber" :
                      "bg-coral"
                    }`}
                    style={{ width: `${(zone.ratio / 50) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium vs Payout Comparison */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">Premium vs Payout Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={lossRatioData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
            <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
              labelStyle={{ color: "#fff" }}
              formatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
            />
            <Legend />
            <Bar dataKey="premium" fill="#3b82f6" name="Premium Collected" radius={[8, 8, 0, 0]} />
            <Bar dataKey="payout" fill="#10b981" name="Claims Paid Out" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
