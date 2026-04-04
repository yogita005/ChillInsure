import { useState } from 'react';
import { useUserManagement } from '@/hooks/use-policy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface RegistrationProps {
  onSuccess: (userId: string, gigScore: number) => void;
}

export function Registration({ onSuccess }: RegistrationProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const { registerUser, loading, error } = useUserManagement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!email || !phone || !name) {
      setMessageType('error');
      setMessage('Please fill in all required fields');
      return;
    }

    try {
      const result = await registerUser(email, phone, name, upiId);
      setMessageType('success');
      setMessage('Registration successful! Calculating your GigScore...');
      
      setTimeout(() => {
        onSuccess(result.userId, result.initialGigScore);
      }, 2000);
    } catch (err) {
      setMessageType('error');
      setMessage(error || 'Registration failed');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Join GigGuardian</CardTitle>
          <CardDescription>Register to get insurance protection for your gig work</CardDescription>
        </CardHeader>
        <CardContent>
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
              <label className="text-sm font-medium">Full Name *</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Phone Number *</label>
              <Input
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium">UPI ID (Optional)</label>
              <Input
                type="text"
                placeholder="john@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
