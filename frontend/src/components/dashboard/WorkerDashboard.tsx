import { useState } from "react";
import { Shield, AtSign, TrendingUp, AlertTriangle, Zap, MapPin, Calendar, CheckCircle, Clock, Activity } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const earningsData = [
  { day: "Mon", expected: 1200, actual: 1100, protected: 100 },
  { day: "Tue", expected: 1200, actual: 1050, protected: 150 },
  { day: "Wed", expected: 1500, actual: 310, protected: 1190 },
  { day: "Thu", expected: 1200, actual: 1180, protected: 20 },
  { day: "Fri", expected: 1400, actual: 1380, protected: 20 },
  { day: "Sat", expected: 1300, actual: 850, protected: 450 },
  { day: "Sun", expected: 800, actual: 780, protected: 20 },
];

const claimStatusData = [
  { name: "Approved", value: 8 },
  { name: "Pending", value: 1 },
  { name: "Rejected", value: 0 },
];

const riskMetrics = [
  { area: "T. Nagar, Chennai", risk: "Low", coverage: "92%", status: "Safe" },
  { area: "Mylapore, Chennai", risk: "Medium", coverage: "78%", status: "Watch" },
];

export function WorkerDashboard() {
  // Get user data from localStorage
  const userName = localStorage.getItem('userName') || 'Rider';
  const planName = localStorage.getItem('planName') || 'Plan';
  const coverageAmount = parseInt(localStorage.getItem('coverageAmount') || '2000');
  const registrationDate = localStorage.getItem('registrationDate');
  
  // Calculate days remaining (7-day period from registration)
  const daysRemaining = (() => {
    if (!registrationDate) return 0;
    const regDate = new Date(registrationDate);
    const expiryDate = new Date(regDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const msRemaining = expiryDate.getTime() - now.getTime();
    return Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
  })();

  const stats = [
    {
      label: "Active Coverage",
      value: "Active",
      sub: `${planName} • ₹${coverageAmount} coverage`,
      icon: Shield,
      accent: "text-primary",
      trend: `Expires in ${Math.max(daysRemaining, 0)} days`
    },
    {
      label: "Total Protected",
      value: "₹1,847",
      sub: "+₹890 this week",
      icon: TrendingUp,
      accent: "text-sage",
      trend: "+48%"
    },
    {
      label: "This Week Claims",
      value: "8",
      sub: "All approved ✓",
      icon: CheckCircle,
      accent: "text-sage",
      trend: null
    },
    {
      label: "Trust Score",
      value: "94.2%",
      sub: "Excellent standing",
      icon: AtSign,
      accent: "text-primary",
      trend: "+2.1%"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="group bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <stat.icon className={`w-4.5 h-4.5 ${stat.accent}`} />
              </div>
              {stat.trend && (
                <span className={`text-[11px] font-semibold ${stat.accent}`}>
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

      {/* Earnings Protection Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Earnings This Week</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={earningsData}>
              <defs>
                <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProtected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
              <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => `₹${value}`}
              />
              <Area
                type="monotone"
                dataKey="expected"
                stroke="#6b7280"
                fill="url(#colorExpected)"
                name="Expected Earnings"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="protected"
                stroke="#10b981"
                fill="url(#colorProtected)"
                name="Protected by ChillInsure"
                stackId="1"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Claims Summary */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Claims Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={claimStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Approved</span>
              <span className="font-bold text-sage">8</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-bold text-amber">1</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rejected</span>
              <span className="font-bold">0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Risk & Disruption Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Status */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Your Zones
          </h3>
          <div className="space-y-3">
            {riskMetrics.map((zone, idx) => (
              <div key={idx} className={`p-4 rounded-xl border ${
                zone.status === "Safe" ? "bg-sage-100/20 border-primary/30" :
                "bg-amber/20 border-amber/30"
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-foreground">{zone.area}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    zone.status === "Safe" ? "bg-primary/20 text-primary" :
                    "bg-amber/30 text-amber"
                  }`}>
                    {zone.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Risk Level</span>
                  <span className="font-medium">{zone.risk}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      zone.risk === "Low" ? "bg-sage" :
                      "bg-amber"
                    }`}
                    style={{
                      width: zone.risk === "Low" ? "30%" :
                      zone.risk === "Medium" ? "60%" :
                      "90%"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-coral" />
            Real-time Alerts
          </h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Heavy rain forecasted</p>
                  <p className="text-xs text-muted-foreground">Tomorrow 2-5 PM in T. Nagar, Chennai</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber/10 border border-amber/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">AQI reaching 250+</p>
                  <p className="text-xs text-muted-foreground">Mylapore zone — high pollution</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sage-100/20 border border-primary/20">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Coverage active</p>
                  <p className="text-xs text-muted-foreground">Your policy is active for next 4 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Activity
          </h3>
        </div>
        <div className="divide-y divide-border">
          {[
            { time: "2h ago", event: "Heavy rainfall detected in T. Nagar zone", type: "trigger" },
            { time: "2h ago", event: "Claim #1847 APPROVED — ₹620 will be credited", type: "approved" },
            { time: "1h ago", event: "₹620 disbursed to your UPI", type: "payout" },
            { time: "1d ago", event: "Your premium ₹49 has been auto-deducted", type: "billing" },
          ].map((item, i) => (
            <div key={i} className="px-6 py-3.5 flex items-start gap-3 hover:bg-muted/20 transition-colors">
              <span className={`mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                item.type === "trigger" ? "bg-amber-light text-amber" :
                item.type === "approved" ? "bg-sage-100 text-primary" :
                item.type === "payout" ? "bg-sage-100 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {item.type === "trigger" ? "⚡" : item.type === "approved" ? "✓" : item.type === "payout" ? "💸" : "📋"} {item.type}
              </span>
              <p className="text-sm flex-1">{item.event}</p>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl p-4 font-semibold transition-colors text-center">
          💵 Renew Weekly Policy
        </button>
        <button className="bg-card hover:bg-muted border border-border rounded-2xl p-4 font-semibold transition-colors text-center">
          📞 Contact Support
        </button>
        <button className="bg-card hover:bg-muted border border-border rounded-2xl p-4 font-semibold transition-colors text-center">
          📊 View Full History
        </button>
      </div>
    </div>
  );
}
