import { Loader2 } from "lucide-react";
import { useDashboardPayouts } from "@/hooks/use-dashboard";

export function PayoutsView() {
  const { payouts, summary, loading, error } = useDashboardPayouts();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">Loading payouts…</span>
      </div>
    );
  }

  if (error && payouts.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Unable to load payouts data.</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  const totalDisbursed = summary?.totalDisbursed ?? 0;
  const avgPayoutTime = summary?.avgPayoutTimeMinutes ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-lg mb-1">Payouts</h2>
        <p className="text-sm text-muted-foreground">Track all disbursements to your account</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-1">TOTAL DISBURSED</p>
          <p className="font-display font-bold text-2xl tabular-nums text-primary">₹{totalDisbursed.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Across {payouts.length} payouts</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-1">AVG. PAYOUT TIME</p>
          <p className="font-display font-bold text-2xl tabular-nums">{avgPayoutTime} min</p>
          <p className="text-xs text-muted-foreground mt-1">From trigger to UPI credit</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 font-medium text-muted-foreground text-xs">Transaction</th>
                <th className="px-5 py-3 font-medium text-muted-foreground text-xs">Date</th>
                <th className="px-5 py-3 font-medium text-muted-foreground text-xs">Claim</th>
                <th className="px-5 py-3 font-medium text-muted-foreground text-xs">Amount</th>
                <th className="px-5 py-3 font-medium text-muted-foreground text-xs">Method</th>
                <th className="px-5 py-3 font-medium text-muted-foreground text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs">{p.id}</td>
                  <td className="px-5 py-3 text-muted-foreground">{p.date}</td>
                  <td className="px-5 py-3 font-mono text-xs">{p.claim}</td>
                  <td className="px-5 py-3 font-display font-semibold tabular-nums">{p.amount}</td>
                  <td className="px-5 py-3 text-muted-foreground">{p.method}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-sage-100 text-primary">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden divide-y divide-border">
          {payouts.map((p) => (
            <div key={p.id} className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
                <span className="font-display font-semibold tabular-nums">{p.amount}</span>
              </div>
              <p className="text-xs text-muted-foreground">{p.date} · {p.claim} · {p.method}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
