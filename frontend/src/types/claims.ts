import { AgentVerdict } from "./index";

export type AgentStatus = "idle" | "verifying" | "done";

export interface AgentDecision {
  agentId: string;
  agentName: string;
  verdict: AgentVerdict;
  confidence: number;
  finding: string;
  duration: number;
  status: AgentStatus;
}

export interface ClaimData {
  partnerId: string;
  partnerName: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    zone: string;
  };
  trigger: "rain" | "aqi" | "curfew" | "heatwave" | "snowfall";
  triggerValue: number;
  expectedEarnings: number;
  actualEarnings: number;
  timestamp: string;
  gpsTrail: {
    lat: number;
    lng: number;
    timestamp: string;
    accuracy: number;
  }[];
}

export interface ClaimVerification {
  claimId: string;
  partnerId: string;
  trigger: string;
  timestamp: string;
  agentDecisions: AgentDecision[];
  consensusScore: number;
  verdict: AgentVerdict;
  payoutAmount: number;
  status: "approved" | "partial" | "rejected" | "under_review";
  createdAt: string;
}
