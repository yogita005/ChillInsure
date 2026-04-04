import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Loader2, Clock } from 'lucide-react';

interface OTPVerificationProps {
  email: string;
  onSuccess: (token: string, uid: string) => void;
  onBack: () => void;
  loading?: boolean;
  devOtp?: string;
}

export function OTPVerification({ email, onSuccess, onBack, loading = false, devOtp = '' }: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [verifying, setVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  // Timer for OTP expiry
  const [timerActive, setTimerActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!otp || otp.length !== 6) {
      setMessageType('error');
      setMessage('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifying(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: otp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'OTP verification failed');
      }

      const data = await response.json();
      setMessageType('success');
      setMessage('Email verified successfully! 🎉');
      setTimerActive(false);

      setTimeout(() => {
        onSuccess(data.access_token, data.uid);
      }, 1500);
    } catch (err) {
      setMessageType('error');
      setMessage(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 6-digit OTP to <span className="font-semibold text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devOtp && (
            <Alert className="mb-4 border-blue-500 bg-blue-500/10">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-400">
                <strong>Dev Mode:</strong> Your OTP is <span className="font-bold text-lg text-blue-300">{devOtp}</span>
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="text-sm font-medium">Enter OTP *</label>
              <Input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                disabled={verifying || loading}
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expires in {formatTime(timeLeft)}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={verifying || loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={verifying || loading || otp.length !== 6}
                className="flex-1"
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Didn't receive OTP? Check spam folder or request a new one
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
