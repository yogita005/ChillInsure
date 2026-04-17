import { Users, TrendingUp, Activity, Award, MapPin, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const workerGrowthData = [
  { month: "Jan", total: 5200, active: 4100, verified: 3800 },
  { month: "Feb", total: 6100, active: 5200, verified: 4700 },
  { month: "Mar", total: 7400, active: 6300, verified: 5900 },
  { month: "Apr", total: 8432, active: 7100, verified: 6800 },
];

const topWorkerZones = [
  { zone: "HSR Layout", workers: 1240, active: 980, avgEarnings: "₹1,850", coverage: "92%" },
  { zone: "Koramangala", workers: 1050, active: 890, avgEarnings: "₹1,670", coverage: "88%" },
  { zone: "Whitefield", workers: 950, active: 750, avgEarnings: "₹2,100", coverage: "84%" },
  { zone: "Indiranagar", workers: 850, active: 680, avgEarnings: "₹1,950", coverage: "81%" },
  { zone: "Bellandur", workers: 720, active: 580, avgEarnings: "₹1,780", coverage: "79%" },
  { zone: "Marathahalli", workers: 640, active: 520, avgEarnings: "₹1,640", coverage: "76%" },
];

const workerMetrics = [
  { label: "Total Active Workers", value: "7,100", change: "+12%", icon: Users, color: "text-primary" },
  { label: "Daily Active Rate", value: "84.1%", change: "+3.2%", icon: Activity, color: "text-sage" },
  { label: "Avg Weekly Claims", value: "2.4", change: "+0.8", icon: Award, color: "text-amber" },
  { label: "Avg Payout/Worker", value: "₹2,840", change: "+18%", icon: DollarSign, color: "text-primary" },
];

export function WorkerStats() {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {workerMetrics.map((metric, idx) => (
          <div key={idx} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{metric.label}</p>
              <metric.icon className={`w-4 h-4 ${metric.color}`} />
            </div>
            <p className="font-display font-bold text-2xl">{metric.value}</p>
            <p className={`text-xs font-semibold ${metric.color}`}>{metric.change}</p>
          </div>
        ))}
      </div>

      {/* Worker Growth Trend */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">Worker Growth Trend (4 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={workerGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
            <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
              labelStyle={{ color: "#fff" }}
            />
            <Bar dataKey="total" fill="#3b82f6" name="Total Registered" radius={[8, 8, 0, 0]} />
            <Bar dataKey="active" fill="#10b981" name="Active" radius={[8, 8, 0, 0]} />
            <Bar dataKey="verified" fill="#f59e0b" name="Verified & Covered" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Zone-wise Worker Distribution */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Workers by Zone
        </h3>
        <div className="space-y-3">
          {topWorkerZones.map((zone, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{zone.zone}</p>
                  <p className="text-xs text-muted-foreground">{zone.active} of {zone.workers} active</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{zone.coverage}</p>
                  <p className="text-xs text-muted-foreground">Coverage Rate</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total Workers</p>
                  <p className="font-semibold text-sm">{zone.workers}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Active Today</p>
                  <p className="font-semibold text-sm text-primary">{zone.active}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Avg Earnings</p>
                  <p className="font-semibold text-sm">{zone.avgEarnings}</p>
                </div>
              </div>

              {/* Progress bar for active ratio */}
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-sage rounded-full"
                  style={{ width: `${(zone.active / zone.workers) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Worker Retention & Satisfaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Retention Rate (90 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[
              { day: "Day 1", retention: 100 },
              { day: "Day 7", retention: 94 },
              { day: "Day 14", retention: 88 },
              { day: "Day 30", retention: 81 },
              { day: "Day 60", retention: 76 },
              { day: "Day 90", retention: 73 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
              <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                labelStyle={{ color: "#fff" }}
              />
              <Line type="monotone" dataKey="retention" stroke="#10b981" strokeWidth={2} name="Retention %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Satisfaction Score</h3>
          <div className="space-y-4">
            {[
              { label: "App Experience", score: 8.7, max: 10 },
              { label: "Claims Process", score: 9.2, max: 10 },
              { label: "Payout Speed", score: 9.5, max: 10 },
              { label: "Support Quality", score: 8.4, max: 10 },
              { label: "Overall Coverage", score: 8.9, max: 10 },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-semibold text-sm">{item.score}/10</p>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-sage rounded-full"
                    style={{ width: `${(item.score / item.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
