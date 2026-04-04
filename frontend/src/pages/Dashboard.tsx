import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield, LayoutDashboard, FileText, Banknote, AlertTriangle,
  ChevronLeft, User, Zap, Brain, Menu, X, LogOut
} from "lucide-react";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { ClaimsView } from "@/components/dashboard/ClaimsView";
import { PayoutsView } from "@/components/dashboard/PayoutsView";
import { AlertsView } from "@/components/dashboard/AlertsView";
import { ClaimSimulation } from "@/components/dashboard/ClaimSimulation";


type Tab = "overview" | "simulate" | "claims" | "payouts" | "alerts";

const navGroups = [
  {
    label: "MONITOR",
    items: [
      { id: "overview" as Tab, label: "Overview", icon: LayoutDashboard },
      { id: "claims" as Tab, label: "Claims", icon: FileText },
    ],
  },
  {
    label: "AI ENGINE",
    items: [
      { id: "simulate" as Tab, label: "Claim it!", icon: Zap },
      { id: "alerts" as Tab, label: "Risk Alerts", icon: AlertTriangle },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { id: "payouts" as Tab, label: "Payouts", icon: Banknote },
    ],
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    // Clear session data
    localStorage.removeItem('userId');
    localStorage.removeItem('policyId');
    // Redirect to landing page
    navigate('/');
  };

  return (
    <div className="dashboard-dark min-h-screen bg-background text-foreground flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display font-bold text-foreground text-sm">ChillInsure</span>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Operations</p>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase px-3 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = active === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActive(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* System status */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">System Online</span>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to site</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
              <Brain className="w-3.5 h-3.5 text-primary" />
              AI Council Active
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none">Arjun Mehta</p>
                <p className="text-xs text-muted-foreground">Zomato Partner</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-4 p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">
          {active === "overview" && <DashboardOverview />}
          {active === "simulate" && <ClaimSimulation />}
          {active === "claims" && <ClaimsView />}
          {active === "payouts" && <PayoutsView />}
          {active === "alerts" && <AlertsView />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
