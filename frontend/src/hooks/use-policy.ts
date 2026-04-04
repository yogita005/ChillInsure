import { useState, useCallback } from 'react';
import { GigScore, Plan, UserPolicy } from '@/types/policy';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useUserManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerUser = useCallback(
    async (email: string, phone: string, name: string, upiId?: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, phone, name, upiId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Registration failed');
        }

        const data = await response.json();
        return {
          userId: data.userId,
          initialGigScore: data.initialGigScore,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { registerUser, loading, error };
}

export function useGigScore(userId: string) {
  const [gigScore, setGigScore] = useState<GigScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGigScore = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/gigscore`);

      if (!response.ok) {
        throw new Error('Failed to fetch GigScore');
      }

      const data = await response.json();
      setGigScore({
        totalScore: data.gigScore,
        tier: data.tier,
        breakdown: data.breakdown,
        discountPercentage: data.discountPercentage,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch GigScore';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { gigScore, loading, error, fetchGigScore };
}

export function usePlanQuotes(userId: string) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [gigScore, setGigScore] = useState<GigScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/plans`);

      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      const data = await response.json();
      setPlans(data.plans);
      setGigScore({
        totalScore: data.gigScore,
        tier: data.tier,
        breakdown: {},
        discountPercentage: 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch plans';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { plans, gigScore, loading, error, fetchPlans };
}

export function usePolicyActivation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activatePolicy = useCallback(
    async (userId: string, planId: number, premiumAmount: number, token: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/users/activate-policy`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId, planId, premiumAmount }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || errorData.error || 'Policy activation failed');
        }

        const data = await response.json();
        return {
          policyId: data.policy.policyId,
          expiresAt: data.policy.expiresAt,
          status: data.policy.status,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Policy activation failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { activatePolicy, loading, error };
}

export function useUserPolicies(userId: string) {
  const [policies, setPolicies] = useState<UserPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/policies`);

      if (!response.ok) {
        throw new Error('Failed to fetch policies');
      }

      const data = await response.json();
      setPolicies(data.policies);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch policies';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { policies, loading, error, fetchPolicies };
}
