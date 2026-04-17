import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ProtectionSection } from '@/components/landing/ProtectionSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';

const Index = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const userId = localStorage.getItem('userId');
    if (userId) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleGetStarted = () => {
    setShowOnboarding(true);
  };

  const handleLogin = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (userId: string, policyId: string) => {
    console.log('🎉 Onboarding complete!', { userId, policyId });
    // Save to localStorage
    localStorage.setItem('userId', userId);
    localStorage.setItem('policyId', policyId);
    console.log('✅ Saved to localStorage:', { userId, policyId });
    console.log('📍 Navigating to /dashboard...');
    navigate('/dashboard');
  };

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen">
      <LandingNav onGetStarted={handleGetStarted} onLogin={handleLogin} />
      <HeroSection onGetStarted={handleGetStarted} />
      <HowItWorks />
      <FeaturesSection />
      <ProtectionSection />
      <CTASection onGetStarted={handleGetStarted} />
      <Footer />
    </div>
  );
};

export default Index;
