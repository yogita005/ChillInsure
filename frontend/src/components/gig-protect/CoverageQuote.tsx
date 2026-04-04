import { useState } from "react";
import { Zap, TrendingUp, Shield } from "lucide-react";

interface CoverageQuoteProps {
  riderId: string;
  zoneId: string;
}

export function CoverageQuote({ riderId, zoneId }: CoverageQuoteProps) {
  const [coverageAmount, setCoverageAmount] = useState(5000);
  const [selectedType, setSelectedType] = useState<"injury" | "medical" | "disruption">("injury");
  const [isLoading, setIsLoading] = useState(false);

  const coverageTypes = [
    { id: "injury", label: "Injury Cover", basePrice: 49 },
    { id: "medical", label: "Medical Cover", basePrice: 79 },
    { id: "disruption", label: "Work Disruption", basePrice: 59 },
  ];

  const handleQuote = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCoverageType = coverageTypes.find((t) => t.id === selectedType);
  const monthlyPremium = (selectedCoverageType?.basePrice ?? 0) + (coverageAmount / 1000) * 5;

  return (
    <div className="space-y-4">
      {/* Coverage Type Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Coverage Type</label>
        <div className="grid grid-cols-3 gap-2">
          {coverageTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id as typeof selectedType)}
              className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                selectedType === type.id
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-muted border-border text-foreground hover:bg-muted/80"
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">{type.label}</span>
                <span className="sm:hidden">{type.label.split(" ")[0]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Coverage Amount Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">Coverage Amount</label>
          <span className="text-lg font-bold text-primary">₹{coverageAmount.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min="1000"
          max="50000"
          step="1000"
          value={coverageAmount}
          onChange={(e) => setCoverageAmount(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₹1K</span>
          <span>₹50K</span>
        </div>
      </div>

      {/* Quote Display */}
      <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Monthly Premium</p>
            <p className="text-3xl font-bold text-foreground">
              ₹{Math.round(monthlyPremium)}
              <span className="text-sm text-muted-foreground ml-1">/month</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Coverage Type</p>
            <p className="font-semibold text-foreground">{selectedCoverageType?.label}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Max Payout</p>
            <p className="font-semibold text-foreground">₹{coverageAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Get Quote Button */}
      <button
        onClick={handleQuote}
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <Zap className="w-4 h-4" />
        {isLoading ? "Generating Quote..." : "Get Instant Quote"}
      </button>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        Quote valid for 30 days. Activate anytime to start coverage.
      </p>
    </div>
  );
}
