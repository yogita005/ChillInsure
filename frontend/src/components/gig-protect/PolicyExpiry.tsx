import React, { useState, useEffect } from "react";
import { AlertCircle, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PolicyExpiryProps {
  policyId: string;
  expiryDate: string;
  currentPremium: number;
  coverage: number;
  gigScore: number;
  onRenewClick: (policyId: string) => void;
  isLoading?: boolean;
}

export function PolicyExpiry({
  policyId,
  expiryDate,
  currentPremium,
  coverage,
  gigScore,
  onRenewClick,
  isLoading = false,
}: PolicyExpiryProps) {
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [isExpiring, setIsExpiring] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const calculateDaysLeft = () => {
      const now = new Date();
      const expiry = new Date(expiryDate);
      const diff = expiry.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 3600 * 24));

      setDaysLeft(Math.max(0, days));
      setIsExpiring(days <= 3 && days > 0);
      setIsExpired(days <= 0);
    };

    calculateDaysLeft();
    const interval = setInterval(calculateDaysLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiryDate]);

  const estimatedDiscount = Math.min(50, gigScore * 0.5); // GigScore 100 = 50% discount
  const estimatedNewPremium = currentPremium * (1 - estimatedDiscount / 100);

  return (
    <Card className="p-4 border-l-4 border-l-blue-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              Policy Active Status
            </h3>
          </div>

          {isExpired ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                ⚠️ Policy Expired
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                Your coverage ended. Renew to get protected again.
              </p>
            </div>
          ) : isExpiring ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                ⚡ Expiring in {daysLeft} {daysLeft === 1 ? "day" : "days"}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Renew your weekly coverage before it expires
              </p>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium text-green-900 dark:text-green-200">
                ✅ Active for {daysLeft} {daysLeft === 1 ? "day" : "days"}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Coverage: ₹{coverage.toLocaleString()} • Premium paid: ₹{currentPremium}
              </p>
            </div>
          )}

          {(isExpiring || isExpired) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">
                🎉 Renewal Available
              </p>
              <div className="space-y-1 text-xs text-blue-800 dark:text-blue-300 mb-3">
                <p>
                  • Current GigScore: <span className="font-bold">{gigScore}</span>
                </p>
                <p>
                  • Estimated Discount:{" "}
                  <span className="font-bold">{estimatedDiscount.toFixed(0)}%</span>
                </p>
                <p>
                  • Estimated New Premium:{" "}
                  <span className="font-bold">₹{estimatedNewPremium.toFixed(0)}</span>
                </p>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Better GigScore = Better discount on renewal!
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={() => onRenewClick(policyId)}
          disabled={isLoading || (!isExpiring && !isExpired)}
          variant={isExpiring || isExpired ? "default" : "outline"}
          size="sm"
          className="ml-4 whitespace-nowrap"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {isLoading ? "Renewing..." : "Renew"}
        </Button>
      </div>
    </Card>
  );
}
