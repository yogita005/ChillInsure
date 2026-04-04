// User and Policy Types

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  upiId?: string;
  createdAt: string;
}

export interface GigScore {
  totalScore: number;
  tier: 'poor' | 'fair' | 'good' | 'excellent';
  breakdown: {
    base: number;
    accountAge: number;
    approvalRate: number;
    fraudFlags: number;
    linkedAccounts: number;
    claimFrequency: number;
  };
  discountPercentage: number;
}

export interface Plan {
  planId: string;
  name: string;
  triggerType: string;
  description?: string;
  basePremium: number;
  discountPercentage: number;
  finalPrice: number;
  deductible: number;
  coverageAmount: number;
}

export interface UserPolicy {
  id: string;
  planId: string;
  planName: string;
  premiumPaid: number;
  status: string;
  activatedAt: string;
  expiresAt: string;
  renewalDueAt: string;
}
