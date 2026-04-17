import { useState } from 'react';
import { useUserManagement, usePolicyActivation } from '@/hooks/use-policy';
import { GigScore, Plan } from '@/types/policy';
import { Shield, ChevronRight, Check, Zap, Wind, AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OTPVerification } from './OTPVerification';

type Step = 'auth-mode' | 'register' | 'password-display' | 'login' | 'otp' | 'loading' | 'plans' | 'checkout' | 'success';
type AuthMode = 'register' | 'login';

// Map pincode prefixes to zone names matching backend ZONE_TO_CITY
const PINCODE_TO_ZONE: Record<string, string> = {
  "560": "koramangala_bengaluru",
  "600": "velachery_chennai",
  "400": "andheri_mumbai",
  "110": "dwarka_delhi",
  "500": "gachibowli_hyderabad",
  "700": "salt_lake_kolkata",
};

function getZoneFromPincode(pincode: string): string {
  const prefix = pincode.substring(0, 3);
  return PINCODE_TO_ZONE[prefix] || "general";
}

interface OnboardingFlowProps {
  onComplete: (userId: string, policyId: string) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('auth-mode');
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [pincode, setPincode] = useState('');
  const [avgWeeklyEarnings, setAvgWeeklyEarnings] = useState('5000');
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState('6');
  const [tenureMonths, setTenureMonths] = useState('12');
  const [userId, setUserId] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState<string>('');
  const [selectedPlanPrice, setSelectedPlanPrice] = useState<number>(0);
  const [selectedCoverageAmount, setSelectedCoverageAmount] = useState<number>(0);
  const [policyId, setPolicyId] = useState<string>('');
  const [error, setError] = useState('');
  const [fetchedPlans, setFetchedPlans] = useState<Plan[]>([]);
  const [fetchedGigScore, setFetchedGigScore] = useState<GigScore | null>(null);
  const [devOtp, setDevOtp] = useState<string>('');

  const { registerUser, loading: regLoading } = useUserManagement();
  const { activatePolicy, loading: activateLoading } = usePolicyActivation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !phone || !name || !pincode || !avgWeeklyEarnings || !workDaysPerWeek || !tenureMonths) {
      setError('Please fill all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          platform: 'gig-app',
          zone: getZoneFromPincode(pincode),
          pincode,
          avg_weekly_earnings: parseInt(avgWeeklyEarnings),
          work_days_per_week: parseInt(workDaysPerWeek),
          tenure_months: parseInt(tenureMonths),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      setRegisteredEmail(email);
      if (data.otp_dev) setDevOtp(data.otp_dev);
      // Go straight to OTP — no more 'password-display' step
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Try again.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      setAccessToken(data.access_token);
      setUserId(data.uid);
      // Save to localStorage for alerts hook
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('userId', data.uid);
      setRegisteredEmail(email);
      setStep('loading');

      // Fetch GigScore and proceed to plans
      setTimeout(async () => {
        try {
          const gigScoreResponse = await fetch(`${API_URL}/api/gigscore/me`, {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
            },
          });
          
          if (gigScoreResponse.ok) {
            try {
              const gigScoreData = await gigScoreResponse.json();
              const transformedGigScore = transformGigScoreResponse(gigScoreData);
              setFetchedGigScore(transformedGigScore);
            } catch (parseErr) {
              console.error('[ERROR] Failed to parse GigScore response:', parseErr);
            }
          }
          
          // Generate mock plans with discount
          const generatePricesWithDiscount = (basePrice: number, discountPercent: number) => {
            const discounted = basePrice * (1 - discountPercent / 100);
            return {
              basePremium: Math.round(basePrice),
              finalPrice: Math.round(discounted),
              discountPercentage: discountPercent
            };
          };

          const mockPlans: Plan[] = [
            {
              planId: 'rain-basic',
              name: 'Rain Guard',
              triggerType: 'rain',
              description: 'Covers rain-related disruptions',
              coverageAmount: 500,
              deductible: 100,
              ...generatePricesWithDiscount(49, fetchedGigScore?.discountPercentage || 0)
            },
            {
              planId: 'aqi-basic',
              name: 'Air Quality Shield',
              triggerType: 'aqi',
              description: 'Covers poor air quality days',
              coverageAmount: 500,
              deductible: 100,
              ...generatePricesWithDiscount(29, fetchedGigScore?.discountPercentage || 0)
            },
            {
              planId: 'curfew-basic',
              name: 'Curfew Care',
              triggerType: 'curfew',
              description: 'Covers curfew-related losses',
              coverageAmount: 500,
              deductible: 150,
              ...generatePricesWithDiscount(99, fetchedGigScore?.discountPercentage || 0)
            },
            {
              planId: 'combo-pro',
              name: 'Complete Protection',
              triggerType: 'combo',
              description: 'All coverage + benefits',
              coverageAmount: 1500,
              deductible: 200,
              ...generatePricesWithDiscount(129, fetchedGigScore?.discountPercentage || 0)
            }
          ];
          setFetchedPlans(mockPlans);
          setStep('plans');
        } catch (err) {
          console.error('Error fetching GigScore:', err);
          setStep('plans');
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Try again.');
    }
  };

  // Transform backend GigScore response to frontend type
  const transformGigScoreResponse = (backendData: any): GigScore => {
    const score = backendData.score || 65;
    const riskTier = backendData.risk_tier || 'medium';
    const premiumMultiplier = backendData.premium_multiplier || 1.0;

    // Map risk_tier to tier: 'low' → 'excellent', 'medium' → 'good', 'high' → 'fair'
    const tierMap: Record<string, 'excellent' | 'good' | 'fair' | 'poor'> = {
      'low': 'excellent',
      'medium': 'good',
      'high': 'fair'
    };

    const tier = tierMap[riskTier] || 'good';

    // Calculate discount percentage from premium_multiplier
    // premium_multiplier: 0.85× (low risk = 15% discount), 1.0× (medium = 0%), 1.2× (high = -20% or no discount)
    const discountPercentage = riskTier === 'low' ? 15 : 0;

    return {
      totalScore: score,
      tier: tier,
      discountPercentage: discountPercentage,
      breakdown: {
        base: 65,
        accountAge: 0,
        approvalRate: 0,
        fraudFlags: 0,
        linkedAccounts: 0,
        claimFrequency: 0
      }
    };
  };

  const handleOTPSuccess = (token: string, uid: string) => {
    setAccessToken(token);
    setUserId(uid);
    // Save to localStorage so alerts hook can access them
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userId', uid);
    setStep('loading');

    // Simulate loading and transition to plans step
    setTimeout(async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        
        // Fetch GigScore to show user their risk profile
        const gigScoreResponse = await fetch(`${API_URL}/api/gigscore/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (gigScoreResponse.ok) {
          try {
            const gigScoreData = await gigScoreResponse.json();
            console.log('[DEBUG] GigScore API Response:', gigScoreData);
            const transformedGigScore = transformGigScoreResponse(gigScoreData);
            setFetchedGigScore(transformedGigScore);
          } catch (parseErr) {
            console.error('[ERROR] Failed to parse GigScore response:', parseErr);
          }
        } else {
          console.warn(`[WARN] GigScore API returned status ${gigScoreResponse.status}`);
          if (!gigScoreResponse.ok) {
            const errorText = await gigScoreResponse.text();
            console.error('[ERROR] GigScore Error Response:', errorText);
          }
        }
        
        // For now, use mock plans - can be replaced with API call later
        const generatePricesWithDiscount = (basePrice: number, discountPercent: number) => {
          const discounted = basePrice * (1 - discountPercent / 100);
          return {
            basePremium: Math.round(basePrice),
            finalPrice: Math.round(discounted),
            discountPercentage: discountPercent
          };
        };

        // Determine coverage amount based on GigScore tier
        // Low risk (80+) → 1000, Medium (50-79) → 750, High (<50) → 500
        let recommendedCoverage = 500; // Default: basic
        if (fetchedGigScore) {
          if (fetchedGigScore.totalScore >= 80) {
            recommendedCoverage = 1000; // Premium coverage for excellent tier
          } else if (fetchedGigScore.totalScore >= 50) {
            recommendedCoverage = 750; // Standard coverage for good tier
          }
        }

        const mockPlans: Plan[] = [
          {
            planId: 'rain-basic',
            name: 'Rain Guard',
            triggerType: 'rain',
            description: 'Covers rain-related disruptions',
            coverageAmount: recommendedCoverage,
            deductible: 100,
            ...generatePricesWithDiscount(49, fetchedGigScore?.discountPercentage || 0)
          },
          {
            planId: 'aqi-basic',
            name: 'Air Quality Shield',
            triggerType: 'aqi',
            description: 'Covers poor air quality days',
            coverageAmount: recommendedCoverage,
            deductible: 100,
            ...generatePricesWithDiscount(29, fetchedGigScore?.discountPercentage || 0)
          },
          {
            planId: 'curfew-basic',
            name: 'Curfew Care',
            triggerType: 'curfew',
            description: 'Covers curfew-related losses',
            coverageAmount: recommendedCoverage,
            deductible: 150,
            ...generatePricesWithDiscount(99, fetchedGigScore?.discountPercentage || 0)
          },
          {
            planId: 'combo-pro',
            name: 'Complete Protection',
            triggerType: 'combo',
            description: 'All coverage + benefits',
            coverageAmount: recommendedCoverage * 1.5, // Double coverage for combo plan
            deductible: 200,
            ...generatePricesWithDiscount(129, fetchedGigScore?.discountPercentage || 0)
          }
        ];
        
        setFetchedPlans(mockPlans);
        setStep('plans');
      } catch (err) {
        // Even if fetching fails, proceed to plans with defaults
        const mockGigScore: GigScore = {
          totalScore: 75,
          tier: 'good',
          discountPercentage: 0,
          breakdown: {
            base: 65,
            accountAge: 0,
            approvalRate: 0,
            fraudFlags: 0,
            linkedAccounts: 0,
            claimFrequency: 0
          }
        };
        setFetchedGigScore(mockGigScore);
        
        const generatePricesWithDiscount = (basePrice: number, discountPercent: number) => {
          const discounted = basePrice * (1 - discountPercent / 100);
          return {
            basePremium: Math.round(basePrice),
            finalPrice: Math.round(discounted),
            discountPercentage: discountPercent
          };
        };

        // Determine coverage based on default GigScore (75 = medium = 750)
        let recommendedCoverage = 750; // Medium tier by default
        if (mockGigScore.totalScore >= 80) {
          recommendedCoverage = 1000;
        } else if (mockGigScore.totalScore < 50) {
          recommendedCoverage = 500;
        }

        const mockPlans: Plan[] = [
          {
            planId: 'rain-basic',
            name: 'Rain Guard',
            triggerType: 'rain',
            description: 'Covers rain-related disruptions',
            coverageAmount: recommendedCoverage,
            deductible: 100,
            ...generatePricesWithDiscount(49, mockGigScore.discountPercentage)
          },
          {
            planId: 'aqi-basic',
            name: 'Air Quality Shield',
            triggerType: 'aqi',
            description: 'Covers poor air quality days',
            coverageAmount: recommendedCoverage,
            deductible: 100,
            ...generatePricesWithDiscount(29, mockGigScore.discountPercentage)
          },
          {
            planId: 'curfew-basic',
            name: 'Curfew Care',
            triggerType: 'curfew',
            description: 'Covers curfew-related losses',
            coverageAmount: recommendedCoverage,
            deductible: 150,
            ...generatePricesWithDiscount(99, mockGigScore.discountPercentage)
          },
          {
            planId: 'combo-pro',
            name: 'Complete Protection',
            triggerType: 'combo',
            description: 'All coverage + benefits',
            coverageAmount: recommendedCoverage * 1.5,
            deductible: 200,
            ...generatePricesWithDiscount(129, mockGigScore.discountPercentage)
          }
        ];
        setFetchedPlans(mockPlans);
        setStep('plans');
      }
    }, 2000);
  };

  const handleSelectPlan = (plan: Plan, name: string, price: number) => {
    setSelectedPlanId(plan.planId);
    setSelectedPlanName(name);
    setSelectedPlanPrice(price);
    setSelectedCoverageAmount(plan.coverageAmount);
    setStep('checkout');
  };

  const handleActivate = async () => {
    setError('');

    if (!userId || !selectedPlanId || !upiId || !accessToken) {
      setError('Please fill all fields');
      return;
    }

    try {
      // Send coverage amount (int) to backend, not planId (string)
      // Include accessToken for authorization
      const result = await activatePolicy(userId, selectedCoverageAmount, selectedPlanPrice, accessToken);
      if (!result?.policyId) {
        setError('Failed to get policy ID');
        return;
      }
      
      setPolicyId(result.policyId);
      setStep('success');

      // Redirect after 2 seconds
      const timer = setTimeout(() => {
        if (userId && result.policyId) {
          onComplete(userId, result.policyId);
        }
      }, 2000);

      return () => clearTimeout(timer);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to activate policy';
      setError(errorMsg);
      console.error('Activation error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25 mb-5">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">ChillInsure</h1>
          <p className="text-gray-400 text-sm">Parametric insurance for India's gig workforce</p>
        </div>

        {/* Step 0: Auth Mode Selection */}
        {step === 'auth-mode' && (
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-black/20">
            <CardHeader className="pb-2 pt-8">
              <CardTitle className="text-white text-center text-2xl mb-1">Welcome back</CardTitle>
              <CardDescription className="text-gray-400 text-center text-sm">Choose how you'd like to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-8 pb-8">
              <Button
                onClick={() => {
                  setAuthMode('register');
                  setStep('register');
                  setError('');
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-6 text-base font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Shield className="w-4 h-4 mr-2" />
                Create New Account
              </Button>
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <Button
                onClick={() => {
                  setAuthMode('login');
                  setStep('login');
                  setError('');
                }}
                variant="outline"
                className="w-full border-slate-600/50 text-gray-200 hover:bg-slate-700/50 hover:border-slate-500 py-6 text-base font-medium rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                Sign In Existing Account
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Password Display */}
        {step === 'password-display' && (
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-black/20">
            <CardHeader className="pt-8">
              <CardTitle className="text-white">Save Your Password</CardTitle>
              <CardDescription className="text-gray-400">You'll need this to log in later</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg space-y-3">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-blue-400">Email:</span> {registeredEmail}
                </p>
                <div>
                  <p className="text-sm text-gray-300 mb-2">
                    <span className="font-semibold text-blue-400">Password:</span>
                  </p>
                  <div className="flex items-center gap-2 bg-slate-900 p-3 rounded border border-slate-600">
                    <code className="text-green-400 font-mono text-lg flex-1">{generatedPassword}</code>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPassword);
                        // You could add a toast here
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-sm text-yellow-300">
                ⚠️ Write this down or copy it now. We can't show it again!
              </div>

              <Button
                onClick={() => setStep('otp')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue to Verification
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Login */}
        {step === 'login' && (
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-black/20">
            <CardHeader className="pt-8">
              <CardTitle className="text-white">Sign In</CardTitle>
              <CardDescription className="text-gray-400">Welcome back to ChillInsure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-300 block mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="raj@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {devOtp && (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-sm">
                    <p className="text-blue-400">Dev OTP: <span className="font-bold">{devOtp}</span></p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Sign In
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('auth-mode')}
                  className="w-full border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  Back
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Register */}
        {step === 'register' && (
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-black/20">
            <CardHeader className="pt-8">
              <CardTitle className="text-white">Create Your Account</CardTitle>
              <CardDescription className="text-gray-400">Join thousands of protected gig workers</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-300 block mb-1">Full Name</label>
                  <Input
                    placeholder="Raj Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={regLoading}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="raj@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={regLoading}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1">Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={regLoading}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1">Confirm Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={regLoading}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <div className="mt-2 flex items-center">
                    <input 
                      type="checkbox" 
                      id="showPassword" 
                      checked={showPassword}
                      onChange={() => setShowPassword(!showPassword)}
                      className="mr-2 rounded bg-slate-700 border-slate-600" 
                    />
                    <label htmlFor="showPassword" className="text-xs text-gray-400 cursor-pointer">Show Password</label>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1">Phone</label>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={regLoading}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1">UPI ID</label>
                  <Input
                    placeholder="raj@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    disabled={regLoading}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1">Pincode</label>
                  <Input
                    placeholder="110001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    disabled={regLoading}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Monthly Earnings (₹)</label>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={avgWeeklyEarnings}
                      onChange={(e) => setAvgWeeklyEarnings(e.target.value)}
                      disabled={regLoading}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Days/Week Working</label>
                    <Input
                      type="number"
                      min="1"
                      max="7"
                      placeholder="6"
                      value={workDaysPerWeek}
                      onChange={(e) => setWorkDaysPerWeek(e.target.value)}
                      disabled={regLoading}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1">Experience (Months)</label>
                  <Input
                    type="number"
                    placeholder="12"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(e.target.value)}
                    disabled={regLoading}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={regLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 mt-6"
                >
                  {regLoading ? 'Registering...' : 'Continue'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('auth-mode')}
                  className="w-full border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  Back
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: OTP Verification */}
        {step === 'otp' && (
          <div className="bg-slate-800/50 rounded-lg p-6">
            <OTPVerification 
              email={registeredEmail}
              devOtp={devOtp}
              onSuccess={handleOTPSuccess}
              onBack={() => {
                setStep('register');
                setError('');
              }}
            />
          </div>
        )}

        {/* Step 3: Loading GigScore */}
        {step === 'loading' && (
          <Card className="bg-slate-800 border-slate-700 text-center py-12">
            <CardContent className="space-y-6">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-600/20 rounded-full">
                <div className="h-12 w-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Calculating Your GigScore</p>
                <p className="text-gray-400 mt-1">This determines your insurance rates...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Choose Plans */}
        {step === 'plans' && fetchedGigScore && (
          <div className="space-y-6">
            {/* GigScore Badge */}
            <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Your GigScore</p>
                    <p className="text-3xl font-bold text-white flex items-center gap-2">
                      {fetchedGigScore.totalScore} <Badge className="bg-green-600 text-white">{fetchedGigScore.discountPercentage}% OFF</Badge>
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="outline" 
                      className={fetchedGigScore.tier === 'excellent' ? 'text-green-400 border-green-400' : 'text-blue-400 border-blue-400'}
                    >
                      {fetchedGigScore.tier.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plans Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Choose Your Coverage</h2>
                <div className="bg-blue-500/20 border border-blue-400 px-3 py-1 rounded text-sm text-blue-300">
                  {fetchedGigScore.totalScore >= 80 && '✓ Premium Coverage Recommended'}
                  {fetchedGigScore.totalScore >= 50 && fetchedGigScore.totalScore < 80 && '✓ Standard Coverage Recommended'}
                  {fetchedGigScore.totalScore < 50 && '✓ Basic Coverage Recommended'}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fetchedPlans.map((plan) => {
                  const icons: Record<string, any> = {
                    rain: <Zap className="h-5 w-5" />,
                    aqi: <Wind className="h-5 w-5" />,
                    curfew: <AlertTriangle className="h-5 w-5" />,
                    combo: <Package className="h-5 w-5" />,
                  };

                  return (
                    <Card
                      key={plan.planId}
                      className={`bg-slate-800 border-slate-700 cursor-pointer transition-all hover:border-blue-500 ${
                        selectedPlanId === plan.planId ? 'border-blue-500 ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleSelectPlan(plan, plan.name, plan.finalPrice)}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-blue-400">{icons[plan.triggerType]}</div>
                          <CardTitle className="text-white text-base">{plan.name}</CardTitle>
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            {plan.discountPercentage > 0 && (
                              <p className="text-xs text-gray-400 line-through mb-1">₹{plan.basePremium}</p>
                            )}
                            <p className="text-2xl font-bold text-green-400">₹{plan.finalPrice.toFixed(0)}</p>
                            <p className="text-xs text-gray-400">/month</p>
                          </div>
                          {selectedPlanId === plan.planId && (
                            <Check className="h-5 w-5 text-green-400" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-300">
                          <span>Coverage</span>
                          <span>₹{plan.coverageAmount}</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Deductible</span>
                          <span>₹{plan.deductible}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={() => setStep('checkout')}
              disabled={!selectedPlanId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 gap-2"
            >
              Continue to Payment <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 5: Checkout */}
        {step === 'checkout' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Complete Your Payment</CardTitle>
              <CardDescription className="text-gray-400">Activate your insurance now</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Plan</span>
                  <span>{selectedPlanName}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Monthly</span>
                  <span>₹{selectedPlanPrice.toFixed(0)}</span>
                </div>
                <div className="border-t border-slate-600 pt-2 flex justify-between font-semibold text-white">
                  <span>Total</span>
                  <span className="text-green-400">₹{selectedPlanPrice.toFixed(0)}</span>
                </div>
              </div>

              {/* UPI Input */}
              <div>
                <label className="text-sm text-gray-300 block mb-2">Enter UPI ID for Payment</label>
                <Input
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  disabled={activateLoading}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('plans')}
                  disabled={activateLoading}
                  className="flex-1 border-slate-600 text-gray-300"
                >
                  Back
                </Button>
                <Button
                  onClick={handleActivate}
                  disabled={activateLoading || !upiId}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  {activateLoading ? 'Processing...' : 'Pay & Activate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Success */}
        {step === 'success' && (
          <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-green-600/20 rounded-full">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-2">Welcome to ChillInsure!</p>
                <p className="text-gray-400">Your policy is now active</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">Policy ID</span>
                  <span className="font-mono text-blue-400 text-sm">{policyId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan</span>
                  <span className="text-white">{selectedPlanName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expires</span>
                  <span className="text-white">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
