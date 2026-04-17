import { CheckCircle, XCircle, Clock, Eye, AlertCircle, MapPin, Calendar } from "lucide-react";

const activeClaims = [
  {
    id: "#CLM-8847",
    worker: "Raj Kumar",
    amount: "₹620",
    zone: "T. Nagar, Chennai",
    date: "2 hours ago",
    status: "approved",
    reason: "Heavy rainfall detected",
    aiVerdict: "PAY",
    fraudScore: "2.1%"
  },
  {
    id: "#CLM-8846",
    worker: "Priya Singh",
    amount: "₹410",
    zone: "Mylapore, Chennai",
    date: "1 hour ago",
    status: "pending",
    reason: "AQI threshold exceeded",
    aiVerdict: "PENDING",
    fraudScore: "18.3%"
  },
  {
    id: "#CLM-8845",
    worker: "Arun Patel",
    amount: "₹200",
    zone: "Velachery, Chennai",
    date: "45 min ago",
    status: "rejected",
    reason: "Activity detected during disruption",
    aiVerdict: "REJECT",
    fraudScore: "72.4%"
  },
  {
    id: "#CLM-8844",
    worker: "Neha Gupta",
    amount: "₹580",
    zone: "Anna Nagar, Chennai",
    date: "30 min ago",
    status: "approved",
    reason: "Curfew in zone",
    aiVerdict: "PAY",
    fraudScore: "1.8%"
  },
  {
    id: "#CLM-8843",
    worker: "Vikram Desai",
    amount: "₹350",
    zone: "Adyar, Chennai",
    date: "20 min ago",
    status: "pending",
    reason: "Extreme heat - claim under review",
    aiVerdict: "PENDING",
    fraudScore: "24.1%"
  },
  {
    id: "#CLM-8842",
    worker: "Anita Das",
    amount: "₹480",
    zone: "Nungambakkam, Chennai",
    date: "15 min ago",
    status: "approved",
    reason: "Heavy rain in zone",
    aiVerdict: "PAY",
    fraudScore: "3.5%"
  },
];

const statusStyles = {
  approved: "bg-sage-100 text-primary border-primary/30",
  rejected: "bg-coral/20 text-coral border-coral/30",
  pending: "bg-amber/20 text-amber border-amber/30",
};

const statusIcons = {
  approved: CheckCircle,
  rejected: XCircle,
  pending: Clock,
};

export function ActiveClaims() {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4">
          <CheckCircle className="w-5 h-5 text-sage mb-3" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Approved Today</p>
          <p className="font-display font-bold text-2xl">127</p>
          <p className="text-xs text-primary mt-1">↑ 12% vs yesterday</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <Clock className="w-5 h-5 text-amber mb-3" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Pending Review</p>
          <p className="font-display font-bold text-2xl">23</p>
          <p className="text-xs text-amber mt-1">Avg wait: 2.3m</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <XCircle className="w-5 h-5 text-coral mb-3" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Rejected Today</p>
          <p className="font-display font-bold text-2xl">8</p>
          <p className="text-xs text-coral mt-1">3.2% rejection rate</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <AlertCircle className="w-5 h-5 text-primary mb-3" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">High Risk Claims</p>
          <p className="font-display font-bold text-2xl">5</p>
          <p className="text-xs text-primary mt-1">Fraud score &gt;60%</p>
        </div>
      </div>

      {/* Active Claims Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Recent Claims Activity
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Claim ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Worker</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Zone</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Verdict</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fraud Risk</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {activeClaims.map((claim, idx) => {
                const StatusIcon = statusIcons[claim.status as keyof typeof statusIcons];
                return (
                  <tr key={idx} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-primary">{claim.id}</code>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium">{claim.worker}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {claim.zone}
                      </div>
                    </td>
                    <td className="px-6 py-3 font-semibold text-primary">{claim.amount}</td>
                    <td className="px-6 py-3 text-xs text-muted-foreground max-w-[200px]">{claim.reason}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        claim.aiVerdict === "PAY" ? "bg-sage-100 text-primary" :
                        claim.aiVerdict === "REJECT" ? "bg-coral/20 text-coral" :
                        "bg-amber/20 text-amber"
                      }`}>
                        {claim.aiVerdict}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${
                        parseFloat(claim.fraudScore) < 10 ? "bg-sage-100 text-primary" :
                        parseFloat(claim.fraudScore) < 40 ? "bg-amber/20 text-amber" :
                        "bg-coral/20 text-coral"
                      }`}>
                        {claim.fraudScore}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <button className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${statusStyles[claim.status as keyof typeof statusStyles]} hover:shadow-md`}>
                        <StatusIcon className="w-4 h-4" />
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </button>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">{claim.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed View with Risk Analysis */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">High-Risk Claims Under Review</h3>
        <div className="space-y-3">
          {activeClaims.filter(c => parseFloat(c.fraudScore) > 20).map((claim) => (
            <div key={claim.id} className="p-4 rounded-xl border-2 border-amber/30 bg-amber/10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{claim.id} - {claim.worker}</p>
                  <p className="text-xs text-muted-foreground">{claim.zone} • {claim.date}</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-amber/20 text-amber text-xs font-bold">Fraud Risk: {claim.fraudScore}</span>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Claim Amount</p>
                  <p className="font-semibold">{claim.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Reason</p>
                  <p className="font-semibold text-sm">{claim.reason}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">AI Recommendation</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    claim.aiVerdict === "REJECT" ? "bg-coral/20 text-coral" :
                    claim.aiVerdict === "PAY" ? "bg-sage-100 text-primary" :
                    "bg-primary/20 text-primary"
                  }`}>
                    {claim.aiVerdict}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Action</p>
                  <div className="flex gap-1">
                    <button className="px-2 py-1 rounded-lg bg-sage-100/20 text-primary text-xs font-bold hover:bg-sage-100/40 transition-colors">Approve</button>
                    <button className="px-2 py-1 rounded-lg bg-coral/20 text-coral text-xs font-bold hover:bg-coral/40 transition-colors">Reject</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
