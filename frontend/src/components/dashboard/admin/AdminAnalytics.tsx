import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Zap, Flame, Activity } from "lucide-react";

const claimsTrendData = [
  { day: "Mon", approved: 45, rejected: 12, pending: 18 },
  { day: "Tue", approved: 52, rejected: 8, pending: 22 },
  { day: "Wed", approved: 48, rejected: 15, pending: 20 },
  { day: "Thu", approved: 61, rejected: 10, pending: 25 },
  { day: "Fri", approved: 55, rejected: 14, pending: 28 },
  { day: "Sat", approved: 58, rejected: 9, pending: 32 },
  { day: "Sun", approved: 42, rejected: 11, pending: 15 },
];

const claimStatusData = [
  { name: "Approved", value: 361, fill: "#10b981" },
  { name: "Rejected", value: 79, fill: "#ef4444" },
  { name: "Pending", value: 160, fill: "#f59e0b" },
];

const performanceData = [
  { subject: "Claims Volume", A: 120, fullMark: 150 },
  { subject: "Approval Rate", A: 98, fullMark: 100 },
  { subject: "Speed", A: 86, fullMark: 100 },
  { subject: "Fraud Detection", A: 95, fullMark: 100 },
  { subject: "Customer Satisfaction", A: 88, fullMark: 100 },
];

const disruptionImpactData = [
  { disruption: "Heavy Rain", claims: 245, payouts: "₹1.2L", status: "High" },
  { disruption: "High AQI", claims: 182, payouts: "₹0.9L", status: "Medium" },
  { disruption: "Extreme Heat", claims: 156, payouts: "₹0.7L", status: "Medium" },
  { disruption: "Curfew", claims: 98, payouts: "₹0.5L", status: "Low" },
];

export function AdminAnalytics() {
  return (
    <div className="space-y-6">
      {/* Top Row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Claims Trend - Large Chart */}
        <div className="lg:col-span-2 bg-gradient-to-br from-card to-card/50 rounded-2xl border border-border p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">Claims Trend</h3>
              <p className="text-xs text-muted-foreground mt-1">Weekly performance snapshot</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">+15% this week</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={claimsTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" style={{ fontSize: "12px" }} />
              <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "2px solid #374151",
                  borderRadius: "10px",
                  boxShadow: "0 10px 15px rgba(0,0,0,0.3)"
                }}
                labelStyle={{ color: "#fff", fontWeight: "bold" }}
                cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar dataKey="approved" fill="url(#colorApproved)" name="✓ Approved" radius={[8, 8, 0, 0]} />
              <Bar dataKey="rejected" fill="#ef4444" name="✗ Rejected" radius={[8, 8, 0, 0]} opacity={0.7} />
              <Bar dataKey="pending" fill="#f59e0b" name="⏳ Pending" radius={[8, 8, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Claims Distribution Pie */}
        <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl border border-border p-6 shadow-md hover:shadow-lg transition-shadow">
          <h3 className="font-display font-bold text-lg text-foreground mb-6">Claims Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={claimStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {claimStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} claims`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {claimStatusData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs text-muted-foreground font-medium">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Radar */}
      <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl border border-border p-6 shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-lg text-foreground">System Performance Metrics</h3>
            <p className="text-xs text-muted-foreground mt-1">AI Council & Operations efficiency</p>
          </div>
          <Flame className="w-5 h-5 text-coral" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={performanceData} margin={{ top: 40, right: 80, left: 80, bottom: 40 }}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} />
            <PolarRadiusAxis stroke="rgba(255,255,255,0.2)" />
            <Radar name="Performance" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                border: "2px solid #374151",
                borderRadius: "10px",
              }}
              labelStyle={{ color: "#fff" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Disruption Impact & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disruption Impact */}
        <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl border border-border p-6 shadow-md hover:shadow-lg transition-shadow">
          <h3 className="font-display font-bold text-lg text-foreground mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-coral" />
            Top Disruptions
          </h3>
          <div className="space-y-3">
            {claimStatusData.length > 0 && [
              { disruption: "Heavy Rain", claims: 245, payouts: "₹1.2L", status: "High" },
              { disruption: "High AQI", claims: 182, payouts: "₹0.9L", status: "Medium" },
              { disruption: "Extreme Heat", claims: 156, payouts: "₹0.7L", status: "Medium" },
              { disruption: "Curfew", claims: 98, payouts: "₹0.5L", status: "Low" },
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/30 hover:border-primary/30 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.disruption}</p>
                    <p className="text-xs text-muted-foreground">{item.claims} claims • {item.payouts}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                    item.status === "High" ? "bg-coral/20 text-coral" :
                    item.status === "Medium" ? "bg-amber/20 text-amber" :
                    "bg-sage-100 text-primary"
                  }`}>
                    {item.status} Risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl border border-green-500/20 p-5 hover:border-green-500/40 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Approval Rate</p>
                <p className="font-display font-bold text-3xl text-foreground">81.9%</p>
                <p className="text-sm text-muted-foreground mt-1">361 approved • 79 rejected</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl border border-blue-500/20 p-5 hover:border-blue-500/40 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Avg Processing</p>
                <p className="font-display font-bold text-3xl text-foreground">2.3m</p>
                <p className="text-sm text-muted-foreground mt-1">AI Council validation</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-2xl border border-red-500/20 p-5 hover:border-red-500/40 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Fraud Detection</p>
                <p className="font-display font-bold text-3xl text-foreground">3.2%</p>
                <p className="text-sm text-muted-foreground mt-1">79 fraudulent claims caught</p>
              </div>
              <Activity className="w-8 h-8 text-red-500 opacity-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
