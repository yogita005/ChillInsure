import { AlertTriangle, Cloud, Wind, Droplets, Zap, TrendingUp, Calendar } from "lucide-react";

const predictedDisruptions = [
  {
    day: "Tomorrow (Wed)",
    disruptions: [
      { type: "Heavy Rain", probability: 92, expectedClaims: 450, impact: "High", zones: ["T. Nagar, Chennai", "Mylapore, Chennai"] },
      { type: "High AQI", probability: 68, expectedClaims: 280, impact: "Medium", zones: ["Velachery, Chennai", "Anna Nagar, Chennai"] },
    ]
  },
  {
    day: "Thursday",
    disruptions: [
      { type: "Extreme Heat", probability: 45, expectedClaims: 120, impact: "Low", zones: ["Adyar, Chennai"] },
    ]
  },
  {
    day: "Friday - Sunday",
    disruptions: [
      { type: "Thunderstorms", probability: 58, expectedClaims: 380, impact: "High", zones: ["All zones"] },
      { type: "Moderate Rain", probability: 71, expectedClaims: 250, impact: "Medium", zones: ["Central Chennai"] },
    ]
  }
];

const riskMetrics = [
  { metric: "Expected Claims (Next 7 Days)", value: "1,240", trend: "+18%", icon: AlertTriangle, color: "text-coral" },
  { metric: "Predicted Payout", value: "₹62L", trend: "+22%", icon: TrendingUp, color: "text-amber" },
  { metric: "Loss Ratio Impact", value: "44.8%", trend: "+2.5%", icon: Zap, color: "text-primary" },
  { metric: "Critical Zones", value: "3", trend: "High risk", icon: AlertTriangle, color: "text-coral" },
];

export function PredictiveAlerts() {
  return (
    <div className="space-y-6">
      {/* Risk Projections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {riskMetrics.map((item, idx) => (
          <div key={idx} className="bg-card rounded-2xl border border-border p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex-1">{item.metric}</p>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <p className="font-display font-bold text-2xl mb-1">{item.value}</p>
            <p className={`text-xs font-semibold ${item.color}`}>{item.trend}</p>
          </div>
        ))}
      </div>

      {/* Daily Predictions */}
      <div className="space-y-4">
        {predictedDisruptions.map((dayData, dayIdx) => (
          <div key={dayIdx} className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <p className="font-semibold text-foreground">{dayData.day}</p>
            </div>

            <div className="p-6 space-y-3">
              {dayData.disruptions.map((disruption, idx) => (
                <div key={idx} className={`p-4 rounded-xl border-2 transition-colors ${
                  disruption.probability >= 80 ? "bg-coral/10 border-coral/30" :
                  disruption.probability >= 60 ? "bg-amber/10 border-amber/30" :
                  "bg-sage-100/10 border-primary/20"
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      {disruption.type === "Heavy Rain" && <Cloud className="w-5 h-5 text-primary mt-1" />}
                      {disruption.type === "High AQI" && <Wind className="w-5 h-5 text-amber mt-1" />}
                      {disruption.type === "Extreme Heat" && <Zap className="w-5 h-5 text-coral mt-1" />}
                      {disruption.type === "Thunderstorms" && <Droplets className="w-5 h-5 text-primary mt-1" />}
                      {disruption.type === "Moderate Rain" && <Cloud className="w-5 h-5 text-primary/60 mt-1" />}
                      
                      <div>
                        <p className="font-semibold text-foreground">{disruption.type}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{disruption.zones.join(", ")}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        disruption.probability >= 80 ? "text-coral" :
                        disruption.probability >= 60 ? "text-amber" :
                        "text-primary"
                      }`}>
                        {disruption.probability}%
                      </p>
                      <p className="text-xs text-muted-foreground">Probability</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Expected Claims</p>
                      <p className="font-semibold text-sm">{disruption.expectedClaims}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Est. Payout</p>
                      <p className="font-semibold text-sm">₹{(disruption.expectedClaims * 500 / 100000).toFixed(1)}L</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Impact</p>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        disruption.impact === "High" ? "bg-coral/30 text-coral" :
                        disruption.impact === "Medium" ? "bg-amber/30 text-amber" :
                        "bg-primary/30 text-primary"
                      }`}>
                        {disruption.impact}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="bg-primary/10 border-2 border-primary rounded-2xl p-6">
        <h3 className="font-display font-semibold text-foreground mb-3">📊 Recommendations</h3>
        <ul className="space-y-2 text-sm text-foreground/90">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span><strong>Increase reserves:</strong> Expected payout spike of 22% next week due to rain forecast</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span><strong>Alert workers:</strong> Notify HSR Layout & Koramangala users of high-risk weather tomorrow</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span><strong>Monitor fraud:</strong> Peak disruption periods see 3-4x fraud attempts — tighten verification</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span><strong>Staffing:</strong> Prepare AI Council agents for 40%+ claim volume on Friday</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
