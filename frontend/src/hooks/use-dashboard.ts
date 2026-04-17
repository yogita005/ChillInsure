import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ============================================================================
// Types
// ============================================================================

export interface DashboardOverviewData {
  policy: {
    name: string;
    status: string;
    expiresIn: string;
    expiresAt: string;
    coverageAmount: number;
    premiumPaid: number;
  };
  claims: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  payouts: {
    totalAmount: number;
    thisWeek: number;
    thisWeekChange: string;
    count: number;
  };
  trustScore: {
    score: number;
    label: string;
    change: string;
  };
  earnings: {
    expected: number;
    actual: number;
    covered: number;
    coveredPercentage: number;
  };
  recentActivity: {
    time: string;
    event: string;
    type: "trigger" | "approved" | "payout" | "billing";
  }[];
}

export interface CouncilAgent {
  name: string;
  agentId: string;
  vote: "PAY" | "PARTIAL" | "REJECT";
  confidence: number;
  finding: string;
}

export interface DashboardClaim {
  id: string;
  date: string;
  trigger: string;
  status: "approved" | "pending" | "rejected";
  amount: string;
  expected: string;
  actual: string;
  agents: string;
  confidence: number;
  council: CouncilAgent[];
}

export interface DashboardPayout {
  id: string;
  date: string;
  claim: string;
  amount: string;
  method: string;
  status: string;
}

export interface PayoutsSummary {
  totalDisbursed: number;
  totalPayouts: number;
  avgPayoutTimeMinutes: number;
}

// ============================================================================
// useDashboardOverview
// ============================================================================

export function useDashboardOverview() {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/dashboard/overview/${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch overview: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === "success") {
        setData({
          policy: result.policy,
          claims: result.claims,
          payouts: result.payouts,
          trustScore: result.trustScore,
          earnings: result.earnings,
          recentActivity: result.recentActivity,
        });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      console.warn("[useDashboardOverview] Fetch failed:", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { data, loading, error, refetch: fetchOverview };
}

// ============================================================================
// useDashboardClaims
// ============================================================================

export function useDashboardClaims() {
  const [claims, setClaims] = useState<DashboardClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClaims = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/dashboard/claims/${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch claims: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === "success") {
        setClaims(result.claims);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      console.warn("[useDashboardClaims] Fetch failed:", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  return { claims, loading, error, refetch: fetchClaims };
}

// ============================================================================
// useDashboardPayouts
// ============================================================================

export function useDashboardPayouts() {
  const [payouts, setPayouts] = useState<DashboardPayout[]>([]);
  const [summary, setSummary] = useState<PayoutsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/dashboard/payouts/${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch payouts: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === "success") {
        setPayouts(result.payouts);
        setSummary(result.summary);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      console.warn("[useDashboardPayouts] Fetch failed:", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  return { payouts, summary, loading, error, refetch: fetchPayouts };
}

// ============================================================================
// useUserProfile — fetch user info for dashboard header
// ============================================================================

export interface UserProfile {
  name: string;
  email: string;
  platform: string;
  zone: string;
  role: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setProfile({
            name: data.name,
            email: data.email,
            platform: data.platform || "Zomato",
            zone: data.zone || "",
            role: data.role || "worker",
          });
        }
      } catch {
        // Silently fail — header will show fallback
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading };
}
