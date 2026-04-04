import { useEffect, useState } from 'react';
import { usePlanQuotes } from '@/hooks/use-policy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Wind, AlertTriangle, Package } from 'lucide-react';

interface PlansSelectionProps {
  userId: string | null;
  onSelectPlan: (planId: string, planName: string, finalPrice: number) => void;
}

export function PlansSelection({ userId, onSelectPlan }: PlansSelectionProps) {
  const { plans, gigScore, loading, fetchPlans } = usePlanQuotes(userId || '');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchPlans();
    }
  }, [userId, fetchPlans]);

  if (!userId) {
    return null;
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'rain':
        return <Zap className="h-6 w-6" />;
      case 'aqi':
        return <Wind className="h-6 w-6" />;
      case 'curfew':
        return <AlertTriangle className="h-6 w-6" />;
      case 'combo':
        return <Package className="h-6 w-6" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Choose Your Coverage</h2>
        <p className="text-gray-600">Get personalized plans based on your GigScore</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.planId}
            className={`cursor-pointer transition-all ${
              selectedPlan === plan.planId ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedPlan(plan.planId)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getTriggerIcon(plan.triggerType)}
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {plan.triggerType === 'rain' && 'Protection during heavy rainfall'}
                    {plan.triggerType === 'aqi' && 'Protection during high pollution'}
                    {plan.triggerType === 'curfew' && 'Protection during curfews'}
                    {plan.triggerType === 'combo' && 'All-in-one coverage'}
                  </CardDescription>
                </div>
                {plan.discountPercentage > 0 && (
                  <Badge className="bg-green-100 text-green-800">
                    {plan.discountPercentage}% OFF
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing */}
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-600">Monthly Premium</span>
                  {plan.discountPercentage > 0 && (
                    <span className="text-xs text-gray-500 line-through">₹{plan.basePremium}</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-blue-600">₹{plan.finalPrice.toFixed(0)}</span>
                  <span className="text-sm text-gray-600">/month</span>
                </div>
              </div>

              {/* Coverage */}
              <div className="border-t border-b py-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Coverage Amount</span>
                  <span className="font-semibold">₹{plan.coverageAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Deductible</span>
                  <span className="font-semibold">₹{plan.deductible}</span>
                </div>
              </div>

              {/* Select Button */}
              <Button
                className={`w-full ${selectedPlan === plan.planId ? 'bg-blue-600' : ''}`}
                variant={selectedPlan === plan.planId ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedPlan(plan.planId);
                  onSelectPlan(plan.planId, plan.name, plan.finalPrice);
                }}
              >
                {selectedPlan === plan.planId ? 'Selected ✓' : 'Select This Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GigScore Info */}
      {gigScore && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              Your <strong>GigScore {gigScore.totalScore} ({gigScore.tier})</strong> qualifies you for{' '}
              <strong>{gigScore.totalScore >= 800 ? 'our best' : 'excellent'}</strong> rates and discounts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
