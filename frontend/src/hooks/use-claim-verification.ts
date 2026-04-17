import { useState, useCallback } from "react";
import { ClaimData, AgentDecision, AgentVerdict } from "@/types/claims";

interface ClaimResponse {
  success: boolean;
  claimId: string;
  verdict: AgentVerdict;
  consensusScore: number;
  payoutAmount: number;
  status: string;
  agentDecisions: AgentDecision[];
  savedId?: string;
}

export function useClaimVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClaimResponse | null>(null);

  const verifyClaim = useCallback(async (claim: ClaimData) => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

      const response = await fetch(`${apiUrl}/api/claims/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(claim),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: ClaimResponse = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to verify claim";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getClaimStatus = useCallback(async (claimId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

      const response = await fetch(`${apiUrl}/api/claims/${claimId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch claim: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error("Error fetching claim:", err);
      throw err;
    }
  }, []);

  return {
    verifyClaim,
    getClaimStatus,
    loading,
    error,
    result,
  };
}
