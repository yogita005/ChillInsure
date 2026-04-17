import { MapPin, AlertTriangle, TrendingUp, Activity, Shield, Zap } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const zonePerformanceData = [
  { zone: "T. Nagar, Chennai", riskScore: 35, claimVolume: 245, lossRatio: 38.5, status: "Healthy" },
  { zone: "Mylapore, Chennai", riskScore: 62, claimVolume: 420, lossRatio: 44.2, status: "Warning" },
  { zone: "Velachery, Chennai", riskScore: 48, claimVolume: 380, lossRatio: 41.8, status: "Healthy" },
  { zone: "Anna Nagar, Chennai", riskScore: 78, claimVolume: 510, lossRatio: 46.3, status: "Critical" },
  { zone: "Adyar, Chennai", riskScore: 42, claimVolume: 320, lossRatio: 39.7, status: "Healthy" },
  { zone: "Nungambakkam, Chennai", riskScore: 58, claimVolume: 380, lossRatio: 43.1, status: "Warning" },
];

const zoneWeeklyData = [
  { day: "Mon", HSR: 35, Koramangala: 62, Whitefield: 48, Indiranagar: 78, Bellandur: 42 },
  { day: "Tue", HSR: 32, Koramangala: 65, Whitefield: 51, Indiranagar: 81, Bellandur: 40 },
  { day: "Wed", HSR: 38, Koramangala: 70, Whitefield: 49, Indiranagar: 85, Bellandur: 45 },
  { day: "Thu", HSR: 33, Koramangala: 68, Whitefield: 47, Indiranagar: 79, Bellandur: 41 },
  { day: "Fri", HSR: 42, Koramangala: 75, Whitefield: 55, Indiranagar: 92, Bellandur: 48 },
  { day: "Sat", HSR: 28, Koramangala: 58, Whitefield: 40, Indiranagar: 68, Bellandur: 35 },
  { day: "Sun", HSR: 25, Koramangala: 52, Whitefield: 35, Indiranagar: 62, Bellandur: 30 },
];

const disruptionsByZone = [
  { zone: "T. Nagar, Chennai", weather: 35, aqi: 20, traffic: 15, civic: 8 },
  { zone: "Mylapore, Chennai", weather: 52, aqi: 35, traffic: 28, civic: 12 },
  { zone: "Velachery, Chennai", weather: 42, aqi: 28, traffic: 22, civic: 10 },
  { zone: "Anna Nagar, Chennai", weather: 61, aqi: 48, traffic: 38, civic: 15 },
  { zone: "Adyar, Chennai", weather: 38, aqi: 24, traffic: 18, civic: 9 },
  { zone: "Nungambakkam, Chennai", weather: 48, aqi: 32, traffic: 25, civic: 13 },
];

export function ZonePerformance() {
  return (
    <div className="space-y-6">
      {/* Zone Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zonePerformanceData.map((zone, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border p-5 transition-all hover:shadow-md ${
              zone.status === "Healthy" ? "bg-sage-100/20 border-primary/30" :
              zone.status === "Warning" ? "bg-amber/20 border-amber/30" :
              "bg-coral/20 border-coral/30"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">{zone.zone}</h3>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                zone.status === "Healthy" ? "bg-primary/20 text-primary" :
                zone.status === "Warning" ? "bg-amber/30 text-amber" :
                "bg-coral/30 text-coral"
              }`}>
                {zone.status}
              </span>
            </div>

            <div className="space-y-2.5 mb-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Risk Score</p>
                  <p className="text-sm font-bold">{zone.riskScore}/100</p>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      zone.riskScore < 50 ? "bg-primary" :
                      zone.riskScore < 70 ? "bg-amber" :
                      "bg-coral"
                    }`}
                    style={{ width: `${zone.riskScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Loss Ratio</p>
                  <p className="text-sm font-bold">{zone.lossRatio}%</p>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-sage rounded-full"
                    style={{ width: `${zone.lossRatio}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{zone.claimVolume} claims this week</p>
          </div>
        ))}
      </div>

      {/* Risk Trend by Zone */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">Risk Score Trend (7 Days)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={zoneWeeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
            <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend />
            <Bar dataKey="HSR" fill="#3b82f6" />
            <Bar dataKey="Koramangala" fill="#f59e0b" />
            <Bar dataKey="Whitefield" fill="#10b981" />
            <Bar dataKey="Indiranagar" fill="#ef4444" />
            <Bar dataKey="Bellandur" fill="#6b7280" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Disruption Breakdown by Zone */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">Disruption Types by Zone</h3>
        <div className="space-y-4">
          {disruptionsByZone.map((zone, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-muted/20 border border-border/30">
              <p className="font-semibold text-sm mb-3 text-foreground">{zone.zone}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-2 rounded-lg bg-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">Weather</p>
                  <p className="font-bold text-sm text-primary">{zone.weather}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber/10">
                  <p className="text-xs text-muted-foreground mb-1">AQI</p>
                  <p className="font-bold text-sm text-amber">{zone.aqi}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-sage-100/10">
                  <p className="text-xs text-muted-foreground mb-1">Traffic</p>
                  <p className="font-bold text-sm text-primary/80">{zone.traffic}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-coral/10">
                  <p className="text-xs text-muted-foreground mb-1">Civic</p>
                  <p className="font-bold text-sm text-coral">{zone.civic}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="bg-primary/10 border-2 border-primary rounded-2xl p-6">
        <h3 className="font-display font-semibold text-foreground mb-3">⚡ Zone Management Recommendations</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-coral mt-1 flex-shrink-0" />
            <span className="text-sm"><strong>Indiranagar (Critical):</strong> Risk score 78 — increase fraud detection, consider premium adjustment</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber mt-1 flex-shrink-0" />
            <span className="text-sm"><strong>Koramangala & Marathahalli (Warning):</strong> Risk trending up — monitor AQI patterns closely</span>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
            <span className="text-sm"><strong>HSR Layout & Bellandur (Healthy):</strong> Stable performance — good candidates for expansion</span>
          </div>
        </div>
      </div>
    </div>
  );
}
