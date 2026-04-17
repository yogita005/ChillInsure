import { AlertTriangle, CloudRain, Wind, Droplets, TrendingUp, Radio, Thermometer, Loader2, RefreshCw, MapPin, Shield } from "lucide-react";
import { useState } from "react";
import { useAlerts } from "@/hooks/use-alerts";

const iconMap: Record<string, React.ReactNode> = {
  "cloud-rain": <CloudRain className="w-5 h-5" />,
  "wind": <Wind className="w-5 h-5" />,
  "droplets": <Droplets className="w-5 h-5" />,
  "thermometer": <Thermometer className="w-5 h-5" />,
  "alert-triangle": <AlertTriangle className="w-5 h-5" />,
  "radio": <Radio className="w-5 h-5" />,
};

const severityStyles = {
  high: "border-l-coral bg-coral-light/10",
  medium: "border-l-amber bg-amber-light/10",
  low: "border-l-muted-foreground bg-muted/10",
};

const severityBadge = {
  high: "bg-coral-light text-coral",
  medium: "bg-amber-light text-amber",
  low: "bg-muted text-muted-foreground",
};

const severityDot = {
  high: "bg-coral",
  medium: "bg-amber",
  low: "bg-muted-foreground",
};

const riskBadgeColors = {
  high: "bg-coral-light text-coral",
  medium: "bg-amber-light text-amber",
  low: "bg-sage-100 text-primary",
};

// Mock Chennai weather, AQI, and civic data
const mockChennaiAlerts = [
  {
    severity: "high" as const,
    icon: "cloud-rain",
    title: "Heavy rainfall incoming — T. Nagar",
    desc: "IMD forecast: 45mm+ rainfall expected in next 3 hours. Your delivery zone may be significantly affected.",
    time: "8 min ago",
    action: "Policy will auto-trigger if threshold met",
    probability: "94%",
  },
  {
    severity: "medium" as const,
    icon: "wind",
    title: "AQI rising — Mylapore zone",
    desc: "AQI currently at 285 and climbing. Threshold trigger at 300. Air quality deteriorating rapidly.",
    time: "22 min ago",
    action: "Monitoring — 87% chance of trigger in next 2 hours",
    probability: "87%",
  },
  {
    severity: "medium" as const,
    icon: "thermometer",
    title: "Heat index alert — Velachery",
    desc: "Temperature reached 39°C with high humidity (82%). Heat index at 43°C — worker safety concern.",
    time: "35 min ago",
    action: "Extra precaution recommended",
    probability: "72%",
  },
  {
    severity: "low" as const,
    icon: "droplets",
    title: "Waterlogging reported — Triplicane junction",
    desc: "Minor waterlogging at key delivery points. Traffic delays expected but orders still fulfillable.",
    time: "1 hour ago",
    action: "Monitoring — low trigger probability",
    probability: "23%",
  },
  {
    severity: "low" as const,
    icon: "radio",
    title: "Civic status normal — Chennai",
    desc: "No curfews, strikes, or major disruptions detected. Regular delivery operations proceeding.",
    time: "Just now",
    action: "Monitoring — no trigger needed",
    probability: "5%",
  },
];

export function AlertsView() {
  const { alerts: fetchedAlerts, loading, error, zoneRiskMultiplier = 1.0, zoneRiskLabel = "medium", city = "Chennai", refetch } = useAlerts();
  const [selectedSeverity, setSelectedSeverity] = useState<"all" | "high" | "medium" | "low">("all");
  
  // Always use mock Chennai alerts - they're the canonical demo data
  // Only use fetched alerts if they have multiple items (more than just fallback)
  const alerts = (fetchedAlerts && fetchedAlerts.length > 2) ? fetchedAlerts : mockChennaiAlerts;

  const filteredAlerts = selectedSeverity === "all" 
    ? alerts 
    : alerts.filter(alert => alert.severity === selectedSeverity);

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header with city, risk badge, and refresh */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="font-display font-bold text-lg mb-1">Risk Alerts</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Live weather, AQI, and civic data for your delivery zones
          </p>
          
          {/* City and Zone Risk Display */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border text-xs">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">{city}</span>
            </div>
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium capitalize ${riskBadgeColors[zoneRiskLabel as keyof typeof riskBadgeColors]}`}>
              <Shield className="w-3.5 h-3.5" />
              <span>{zoneRiskLabel}</span>
              <span className="text-[10px] opacity-75">({zoneRiskMultiplier.toFixed(1)}x)</span>
            </div>
          </div>
        </div>

        {/* Right side - Status and Refresh */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs">
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
            )}
            <span className="text-muted-foreground">
              {loading ? "Updating..." : "Live monitoring"}
            </span>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-card rounded-2xl p-4 border border-border flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground text-pretty">
          When a threshold is met in your active zone, your policy triggers automatically — no action needed from you.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-amber-light/10 border border-amber rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Unable to fetch live alerts. Showing fallback data. {error}
          </p>
        </div>
      )}

      {/* Severity Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground">Filter:</span>
        {["all", "high", "medium", "low"].map((severity) => (
          <button
            key={severity}
            onClick={() => setSelectedSeverity(severity as typeof selectedSeverity)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedSeverity === severity
                ? severity === "all"
                  ? "bg-primary text-primary-foreground"
                  : `${severityBadge[severity as keyof typeof severityBadge]} border border-current`
                : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border"
            }`}
          >
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
            {severity !== "all" && ` (${alerts.filter(a => a.severity === severity).length})`}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert, i) => (
            <div
              key={i}
              className={`group rounded-2xl border-l-4 p-5 border border-border ${severityStyles[alert.severity]} transition-all hover:shadow-md card-lift`}
            >
              <div className="flex items-start gap-3">
                <div className="relative mt-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${severityDot[alert.severity]} relative pulse-dot`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-display font-semibold text-sm">{alert.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${severityBadge[alert.severity]}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{alert.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      <span>Trigger probability: <strong className="text-foreground">{alert.probability}</strong></span>
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No {selectedSeverity !== "all" ? selectedSeverity : ""} alerts at this time</p>
            <p className="text-xs mt-1">All systems monitored and secure</p>
          </div>
        )}
      </div>
    </div>
  );
}
