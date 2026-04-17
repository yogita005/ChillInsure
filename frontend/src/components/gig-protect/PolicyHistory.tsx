import { useState } from "react";
import { Eye, Download, AlertCircle } from "lucide-react";

interface PolicyHistoryProps {
  riderId: string;
}

export function PolicyHistory({ riderId }: PolicyHistoryProps) {
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

  // Mock policy data
  const policies = [
    {
      id: "pol_001",
      coverage: "Injury Cover",
      amount: "₹10,000",
      premium: "₹49/month",
      status: "active",
      startDate: "2024-03-15",
      expiryDate: "2025-03-15",
      payouts: [
        { date: "2024-05-10", amount: "₹2,500", reason: "Minor fracture", status: "paid" },
        { date: "2024-08-20", amount: "₹1,200", reason: "Laceration", status: "paid" },
      ],
    },
    {
      id: "pol_002",
      coverage: "Medical Cover",
      amount: "₹5,000",
      premium: "₹79/month",
      status: "active",
      startDate: "2024-02-01",
      expiryDate: "2025-02-01",
      payouts: [
        { date: "2024-07-05", amount: "₹800", reason: "Emergency clinic visit", status: "paid" },
      ],
    },
    {
      id: "pol_003",
      coverage: "Work Disruption",
      amount: "₹15,000",
      premium: "₹59/month",
      status: "expired",
      startDate: "2023-06-10",
      expiryDate: "2024-06-10",
      payouts: [
        { date: "2024-04-15", amount: "₹5,000", reason: "Medical leave - missed earnings", status: "paid" },
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "expired":
        return "bg-muted text-muted-foreground border-border";
      case "paid":
        return "bg-emerald-500/10 text-emerald-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-3">
      {policies.length === 0 ? (
        <div className="p-6 bg-muted/50 border border-dashed border-border rounded-lg text-center">
          <p className="text-muted-foreground">No policies yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create a policy to get started</p>
        </div>
      ) : (
        policies.map((policy) => (
          <div key={policy.id} className="border border-border rounded-lg overflow-hidden">
            {/* Policy Header */}
            <button
              onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
              className="w-full p-4 flex items-start justify-between hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{policy.coverage}</h3>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border capitalize ${getStatusColor(
                      policy.status
                    )}`}
                  >
                    {policy.status === "active" ? "✓ Active" : "Expired"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {policy.amount} • {policy.premium}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <Eye className={`w-4 h-4 transition-transform ${expandedPolicy === policy.id ? "rotate-180" : ""}`} />
              </div>
            </button>

            {/* Policy Details (Expanded) */}
            {expandedPolicy === policy.id && (
              <div className="p-4 bg-muted/30 border-t border-border space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-card rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                    <p className="font-semibold text-foreground">{new Date(policy.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="p-3 bg-card rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Expiry Date</p>
                    <p className="font-semibold text-foreground">{new Date(policy.expiryDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Payouts */}
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-2">Claim History</h4>
                  {policy.payouts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No claims on this policy</p>
                  ) : (
                    <div className="space-y-2">
                      {policy.payouts.map((payout, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-card rounded-lg border border-border flex items-start justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{payout.reason}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payout.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right ml-2 flex-shrink-0">
                            <p className="text-sm font-semibold text-emerald-600">{payout.amount}</p>
                            <p className={`text-xs font-medium ${getStatusColor(payout.status)}`}>
                              {payout.status === "paid" ? "✓ Paid" : payout.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="p-3 bg-card rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Total Claimed</p>
                    <p className="text-lg font-bold text-emerald-600">
                      ₹{policy.payouts.reduce((sum, p) => sum + parseInt(p.amount.replace("₹", "")), 0)}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button className="flex-1 flex items-center justify-center gap-2 py-1.5 px-2 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors text-foreground">
                      <Download className="w-3.5 h-3.5" />
                      <span>Statement</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-1.5 px-2 text-xs font-medium rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Support</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
