import { useState } from "react";
import { BarChart3, TrendingUp, Users, AlertTriangle, Zap, MapPin, DollarSign, Activity, Search, Filter } from "lucide-react";
import { 
  AdminAnalytics, 
  LossRatios, 
  PredictiveAlerts, 
  WorkerStats, 
  ZonePerformance, 
  ActiveClaims, 
  WorkersByZone 
} from "./admin";

type AdminTab = "overview" | "analytics" | "claims" | "zones" | "alerts" | "workers" | "drivers";

const adminTabs = [
  { id: "overview" as AdminTab, label: "Overview", icon: BarChart3 },
  { id: "analytics" as AdminTab, label: "Analytics", icon: TrendingUp },
  { id: "claims" as AdminTab, label: "Active Claims", icon: AlertTriangle },
  { id: "zones" as AdminTab, label: "Zones", icon: MapPin },
  { id: "alerts" as AdminTab, label: "Alerts", icon: Zap },
  { id: "workers" as AdminTab, label: "Workers", icon: Users },
  { id: "drivers" as AdminTab, label: "Drivers by Area", icon: MapPin },
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  const adminStats = [
    { label: "Total Claims", value: "12,847", sub: "+15% this week", icon: AlertTriangle, accent: "text-coral", trend: "+15%" },
    { label: "Loss Ratio", value: "42.3%", sub: "Within threshold", icon: TrendingUp, accent: "text-primary", trend: "-2.1%" },
    { label: "Active Workers", value: "8,432", sub: "+45 new this week", icon: Users, accent: "text-sage", trend: "+0.5%" },
    { label: "Total Payouts", value: "₹54.2L", sub: "+₹8.3L this week", icon: DollarSign, accent: "text-amber", trend: "+18%" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">ChillInsure Operations & Analytics</p>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((stat) => (
          <div
            key={stat.label}
            className="group bg-gradient-to-br from-card to-card/50 rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                stat.accent === 'text-coral' ? 'from-coral/20 to-coral/10' :
                stat.accent === 'text-primary' ? 'from-primary/20 to-primary/10' :
                stat.accent === 'text-sage' ? 'from-sage/20 to-sage/10' :
                'from-amber/20 to-amber/10'
              } flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.accent}`} />
              </div>
              <span className={`text-xs font-bold ${stat.accent}`}>{stat.trend}</span>
            </div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">{stat.label}</p>
            <p className="font-display font-bold text-3xl tabular-nums mb-1">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation - Horizontal Scroll */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="bg-card rounded-2xl border border-border p-2 inline-flex gap-1 md:w-full md:flex-wrap md:inline-flex">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && <AdminAnalytics />}
        {activeTab === "analytics" && <LossRatios />}
        {activeTab === "claims" && <ActiveClaims />}
        {activeTab === "zones" && <ZonePerformance />}
        {activeTab === "alerts" && <PredictiveAlerts />}
        {activeTab === "workers" && <WorkerStats />}
        {activeTab === "drivers" && <WorkersByZone />}
      </div>
    </div>
  );
}
