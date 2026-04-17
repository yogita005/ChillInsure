import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";
import { ArrowRight, Shield, Zap, CloudRain } from "lucide-react";

interface CTASectionProps {
  onGetStarted?: () => void;
}

const ticker = [
  "₹620 → Arjun, HSR Layout",
  "₹410 → Priya, Koramangala",
  "₹530 → Ravi, Whitefield",
  "₹287 → Deepa, Indiranagar",
  "₹380 → Suresh, Marathahalli",
  "₹450 → Meena, Electronic City",
  "₹310 → Karthik, JP Nagar",
  "₹620 → Arjun, HSR Layout",
  "₹410 → Priya, Koramangala",
  "₹530 → Ravi, Whitefield",
  "₹287 → Deepa, Indiranagar",
  "₹380 → Suresh, Marathahalli",
  "₹450 → Meena, Electronic City",
  "₹310 → Karthik, JP Nagar",
];

export function CTASection({ onGetStarted }: CTASectionProps) {
  const ref = useReveal();

  return (
    <section className="relative overflow-hidden">
      {/* Ticker marquee */}
      <div className="bg-primary/5 border-y border-primary/10 py-3 overflow-hidden">
        <div className="marquee-track flex gap-8 whitespace-nowrap">
          {ticker.map((item, i) => (
            <span key={i} className="flex items-center gap-2 text-sm text-primary/70">
              <Zap className="w-3 h-3" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* CTA block */}
      <div className="py-28 px-6 bg-sage-800 relative">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl orb" />

        <div ref={ref} className="reveal container max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-foreground text-xs font-medium mb-6">
            <Shield className="w-3 h-3" />
            Join 12,847 protected riders
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 text-primary-foreground text-balance leading-[1.1]">
            Ride through any weather.
            <br />
            We'll cover the rest.
          </h2>
          <p className="text-primary-foreground/60 max-w-lg mx-auto mb-10 text-pretty text-lg">
            Join thousands of delivery partners who never worry about lost earnings from bad weather again.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button size="xl" onClick={onGetStarted} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/30 group">
              Start — ₹49/week
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <div className="flex justify-center gap-6 mt-8 text-sm text-primary-foreground/50">
            <span className="flex items-center gap-1.5"><CloudRain className="w-3.5 h-3.5" /> Auto-triggers</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Instant UPI payout</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
