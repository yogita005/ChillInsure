import { useState } from 'react';
import { usePolicyActivation } from '@/hooks/use-policy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertTriangle, Loader2, CreditCard } from 'lucide-react';

interface PolicyActivationProps {
  userId: string | null;
  planId: string | null;
  planName: string | null;
  finalPrice: number;
  onSuccess: (policyId: string) => void;
}

export function PolicyActivation({
  userId,
  planId,
  planName,
  finalPrice,
  onSuccess,
}: PolicyActivationProps) {
  const [upiId, setUpiId] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const { activatePolicy, loading, error } = usePolicyActivation();

  if (!userId || !planId || !planName) {
    return null;
  }

  const handleActivate = async () => {
    setMessage('');

    if (!agreed) {
      setMessageType('error');
      setMessage('Please agree to the terms and conditions');
      return;
    }

    if (!upiId) {
      setMessageType('error');
      setMessage('Please enter your UPI ID');
      return;
    }

    try {
      const result = await activatePolicy(userId, planId, finalPrice);
      setMessageType('success');
      setMessage(`Policy activated successfully! Valid until ${new Date(result.expiresAt).toLocaleDateString()}`);

      setTimeout(() => {
        onSuccess(result.policyId);
      }, 2000);
    } catch (err) {
      setMessageType('error');
      setMessage(error || 'Failed to activate policy');
    }
  };

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-white to-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-green-600" />
          Complete Your Activation
        </CardTitle>
        <CardDescription>You're almost there! Finalize your policy activation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan</span>
              <span className="font-medium">{planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">1 Month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expires</span>
              <span className="font-medium">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total Amount</span>
              <span className="text-xl text-green-600">₹{finalPrice.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <Alert className={messageType === 'success' ? 'border-green-500' : 'border-red-500'}>
            <div className="flex items-center gap-2">
              {messageType === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>{message}</AlertDescription>
            </div>
          </Alert>
        )}

        {/* UPI Input */}
        <div>
          <label className="text-sm font-medium">UPI ID for Payment</label>
          <Input
            type="text"
            placeholder="yourname@upi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            disabled={loading}
            className="mt-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            We'll charge ₹{finalPrice.toFixed(0)} to this UPI account
          </p>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
          <input
            type="checkbox"
            id="terms"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={loading}
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            I agree to the{' '}
            <span className="font-semibold cursor-pointer hover:underline">
              Terms & Conditions
            </span>{' '}
            and{' '}
            <span className="font-semibold cursor-pointer hover:underline">
              Privacy Policy
            </span>
            . I authorize GigGuardian to deduct ₹{finalPrice.toFixed(0)} from my UPI account.
          </label>
        </div>

        {/* Benefits */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-blue-900">Your Policy Includes</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ 24/7 Claim Filing</li>
            <li>✓ AI-Powered Fraud Detection</li>
            <li>✓ Fast UPI Payouts</li>
            <li>✓ 30-day Validity Period</li>
          </ul>
        </div>

        {/* Activation Button */}
        <Button
          onClick={handleActivate}
          disabled={loading || !agreed}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Pay ₹{finalPrice.toFixed(0)} & Activate Policy
            </>
          )}
        </Button>

        {/* Safety Note */}
        <p className="text-xs text-gray-500 text-center">
          🔒 Your payment is secured with industry-standard encryption
        </p>
      </CardContent>
    </Card>
  );
}
