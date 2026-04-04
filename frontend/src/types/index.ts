export type AgentVerdict = "PAY" | "PARTIAL" | "REJECT";

export interface ClaimTrigger {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  location: string;
  detail: string;
  expectedLoss: string;
  expected: string;
  actual: string;
}
