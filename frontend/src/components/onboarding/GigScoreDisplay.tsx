import { useEffect } from 'react';
import { useGigScore } from '@/hooks/use-policy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';

interface GigScoreDisplayProps {
  userId: string | null;
}

export function GigScoreDisplay({ userId }: GigScoreDisplayProps) {
  const { gigScore, loading, fetchGigScore } = useGigScore(userId || '');

  useEffect(() => {
    if (userId) {
      fetchGigScore();
    }
  }, [userId, fetchGigScore]);

  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your GigScore</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!gigScore) {
    return null;
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your GigScore</CardTitle>
            <CardDescription>Your credibility score for insurance</CardDescription>
          </div>
          <TrendingUp className="h-8 w-8 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-5xl font-bold text-blue-600">{gigScore.totalScore}</div>
            <div className="text-sm text-gray-600">out of 900</div>
          </div>
          <Badge className={getTierColor(gigScore.tier)} variant="outline">
            {gigScore.tier.toUpperCase()}
          </Badge>
        </div>

        {/* Discount */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-900">Premium Discount</div>
          <div className="text-2xl font-bold text-green-600">{gigScore.discountPercentage}% OFF</div>
          <div className="text-xs text-green-700">Applied to all your policies</div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Score Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Score</span>
              <span className="font-medium">+{gigScore.breakdown.base}</span>
            </div>
            {gigScore.breakdown.accountAge > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Account Age Bonus</span>
                <span className="font-medium text-green-600">+{gigScore.breakdown.accountAge}</span>
              </div>
            )}
            {gigScore.breakdown.approvalRate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Approval Rate Bonus</span>
                <span className="font-medium text-green-600">+{gigScore.breakdown.approvalRate}</span>
              </div>
            )}
            {gigScore.breakdown.fraudFlags < 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Fraud Flags Penalty</span>
                <span className="font-medium text-red-600">{gigScore.breakdown.fraudFlags}</span>
              </div>
            )}
            {gigScore.breakdown.linkedAccounts < 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Linked Accounts Penalty</span>
                <span className="font-medium text-red-600">{gigScore.breakdown.linkedAccounts}</span>
              </div>
            )}
            {gigScore.breakdown.claimFrequency < 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">High Claim Frequency</span>
                <span className="font-medium text-red-600">{gigScore.breakdown.claimFrequency}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Improve Your Score</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>✓ Maintain consistent work history</li>
            <li>✓ Submit valid insurance claims</li>
            <li>✓ Avoid fraudulent activity</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
