import React, { useState } from "react";
import { AlertCircle, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface RenewalFlowProps {
  policyId: string;
  riderId: string;
  onRenewalComplete?: () => void;
  onCancel?: () => void;
}

interface RenewalQuote {
  policy_id: string;
  current_gigscore: number;
  previous_gigscore: number;
  previous_premium: number;
  new_premium: number;
  discount_percentage: number;
  savings: number;
  days_until_expiry: number;
  renewal_date_recommended: string;
  message: string;
}

export function RenewalFlow({
  policyId,
  riderId,
  onRenewalComplete,
  onCancel,
}: RenewalFlowProps) {
  const [stage, setStage] = useState<"quote" | "confirm" | "processing" | "success">(
    "quote"
  );
  const [quote, setQuote] = useState<RenewalQuote | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchRenewalQuote = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/gig-protect/renew-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          policy_id: policyId,
          rider_id: riderId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch renewal quote");
      }

      const data = await response.json();
      setQuote(data);
      setStage("confirm");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRenewal = async () => {
    if (!quote) return;

    setIsLoading(true);
    setError("");
    setStage("processing");

    try {
      const response = await fetch("/api/gig-protect/renew-policy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          policy_id: policyId,
          rider_id: riderId,
          zone_id: quote.policy_id.split("_")[2] || "general",
        }),
      });

      if (!response.ok) {
        throw new Error("Renewal failed");
      }

      const result = await response.json();
      setStage("success");

      toast({
        title: "Success!",
        description: result.confirmation_message,
      });

      // Call callback after 2 seconds
      setTimeout(() => {
        onRenewalComplete?.();
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      setStage("confirm");
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Stage: Quote Review
  if (stage === "quote" && !quote) {
    return (
      <Card className="p-6 border-2 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <div className="text-center">
          <Zap className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Ready to Renew?
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Get a personalized renewal quote based on your updated GigScore
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button
              onClick={fetchRenewalQuote}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Loading..." : "Get Quote"}
            </Button>
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Stage: Confirm Renewal with Quote
  if (stage === "confirm" && quote) {
    const gigscore_improved = quote.current_gigscore > quote.previous_gigscore;

    return (
      <Card className="p-6 border-2 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Renewal Quote Ready
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {quote.message}
            </p>
          </div>

          {/* GigScore Improvement */}
          {gigscore_improved && (
            <div className="bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 rounded-lg p-3 flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-700 dark:text-green-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-green-900 dark:text-green-200">
                  Your GigScore Improved!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {quote.previous_gigscore} → {quote.current_gigscore} (+
                  {quote.current_gigscore - quote.previous_gigscore})
                </p>
              </div>
            </div>
          )}

          {/* Premium Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Previous Premium
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                ₹{quote.previous_premium.toFixed(0)}
              </p>
            </div>

            <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-3 border-2 border-blue-300 dark:border-blue-700">
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-1 font-semibold">
                New Premium ({quote.discount_percentage.toFixed(0)}% off)
              </p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-200">
                ₹{quote.new_premium.toFixed(0)}
              </p>
            </div>
          </div>

          {/* Savings */}
          {quote.savings > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-green-700 dark:text-green-300">
                💰 You Save: ₹{quote.savings.toFixed(0)}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={confirmRenewal}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Processing..." : "Confirm & Renew"}
            </Button>
            <Button
              onClick={() => {
                setStage("quote");
                setQuote(null);
              }}
              variant="outline"
              disabled={isLoading}
            >
              Back
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Stage: Processing
  if (stage === "processing") {
    return (
      <Card className="p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Processing your renewal...
        </p>
      </Card>
    );
  }

  // Stage: Success
  if (stage === "success") {
    return (
      <Card className="p-6 border-2 border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-700 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-lg font-bold text-green-900 dark:text-green-200 mb-2">
          Policy Renewed Successfully!
        </h2>
        <p className="text-sm text-green-700 dark:text-green-300 mb-4">
          Your new policy is now active and you're protected for 7 more days.
        </p>
      </Card>
    );
  }

  return null;
}
