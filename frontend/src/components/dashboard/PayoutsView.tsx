const payouts = [
  { id: "TXN-98271", date: "Mar 18, 2026", claim: "#1847", amount: "₹620", method: "UPI — arjun@oksbi", status: "Completed" },
  { id: "TXN-98264", date: "Mar 17, 2026", claim: "#1842", amount: "₹410", method: "UPI — arjun@oksbi", status: "Completed" },
  { id: "TXN-98251", date: "Mar 10, 2026", claim: "#1831", amount: "₹287", method: "UPI — arjun@oksbi", status: "Completed" },
  { id: "TXN-98230", date: "Mar 3, 2026", claim: "#1819", amount: "₹530", method: "UPI — arjun@oksbi", status: "Completed" },
];

export function PayoutsView() {
  const total = payouts.reduce((sum, p) => sum + parseInt(p.amount.replace(/[₹,]/g, "")), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-lg mb-1">Payouts</h2>
        <p className="text-sm text-muted-foreground">Track all disbursements to your account</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-1">TOTAL DISBURSED</p>
          <p className="font-display font-bold text-2xl tabular-nums text-primary">₹{total.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Across {payouts.length} payouts</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-1">AVG. PAYOUT TIME</p>
          <p className="font-display font-bold text-2xl tabular-nums">4.2 min</p>
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
