import { useState, useEffect, useCallback } from "react";
import { CheckCircle2 as CheckCircle2Icon } from "lucide-react";
import {
  CloudRain, Wind, AlertTriangle, MapPin, Briefcase,
  Timer, Globe, ShieldCheck, Play, RotateCcw, CheckCircle2 as CheckCircle2Badge,
  XCircle, Minus, Zap, ArrowRight, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useClaimVerification } from "@/hooks/use-claim-verification";
import { ClaimData } from "@/types/claims";
import { GeoMap, MapLegend } from "@/components/claim/GeoMap";

/* ── Trigger scenarios ── */
const triggers = [
  {
    id: "rain",
    icon: CloudRain,
    label: "Heavy Rainfall",
    location: "T. Nagar, Chennai",
    detail: "42mm/hr detected — threshold is 30mm/hr",
    expectedLoss: "₹620",
    expected: "₹1,200",
    actual: "₹310",
    lat: 13.0329,
    lng: 80.2404,
    expectedEarnings: 1200,
    actualEarnings: 310,
    severity: "high",
    impact: "Orders ↓75%",
  },
  {
    id: "aqi",
    icon: Wind,
    label: "AQI Spike",
    location: "Mylapore, Chennai",
    detail: "AQI hit 318 — threshold is 300",
    expectedLoss: "₹410",
    expected: "₹800",
    actual: "₹280",
    lat: 13.0324,
    lng: 80.2626,
    expectedEarnings: 800,
    actualEarnings: 280,
    severity: "medium",
    impact: "Orders ↓60%",
  },
  {
    id: "curfew",
    icon: AlertTriangle,
    label: "Zone Closure",
    location: "Velachery, Chennai",
    detail: "Section 144 imposed — delivery ops suspended",
    expectedLoss: "₹530",
    expected: "₹950",
    actual: "₹420",
    lat: 12.9789,
    lng: 80.2277,
    expectedEarnings: 950,
    actualEarnings: 420,
    severity: "critical",
    impact: "Orders ↓85%",
  },
  {
    id: "heat",
    icon: AlertTriangle,
    label: "Heatwave",
    location: "Triplicane, Chennai",
    detail: "Temperature 48°C — threshold is 45°C",
    expectedLoss: "₹380",
    expected: "₹900",
    actual: "₹290",
    lat: 13.0527,
    lng: 80.2824,
    expectedEarnings: 900,
    actualEarnings: 290,
    severity: "high",
    impact: "Orders ↓65%",
  },
  {
    id: "outage",
    icon: Wind,
    label: "Platform Outage",
    location: "Adyar, Chennai",
    detail: "App/Platform downtime — 45 minutes",
    expectedLoss: "₹250",
    expected: "₹600",
    actual: "₹180",
    lat: 13.0001,
    lng: 80.2426,
    expectedEarnings: 600,
    actualEarnings: 180,
    severity: "medium",
    impact: "Orders ↓70%",
  },
  {
    id: "strike",
    icon: AlertTriangle,
    label: "Local Strike",
    location: "Nungambakkam, Chennai",
    detail: "Transportation strike — roads blocked",
    expectedLoss: "₹480",
    expected: "₹1,100",
    actual: "₹350",
    lat: 13.0515,
    lng: 80.2376,
    expectedEarnings: 1100,
    actualEarnings: 350,
    severity: "high",
    impact: "Orders ↓80%",
  },
];

/* ── AI Council agents ── */
type Vote = "PAY" | "PARTIAL" | "REJECT" | null;

interface AgentState {
  id: string;
  name: string;
  icon: React.ElementType;
  role: string;
  status: "idle" | "verifying" | "done";
  vote: Vote;
  confidence: number;
  finding: string;
  duration: number;
  zoneCoverage?: number; // Coverage percentage for Zone Agent
}

// Generate realistic GPS trail for demo with movement pattern
function generateMockGPSTrail(lat: number, lng: number, hours: number = 2) {
  const trail = [];
  const now = new Date();
  const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
  
  // Create a realistic path with multiple waypoints
  const waypoints = [];
  const numWaypoints = 4;
  
  for (let w = 0; w < numWaypoints; w++) {
    waypoints.push({
      lat: lat + (Math.random() - 0.5) * 0.015,
      lng: lng + (Math.random() - 0.5) * 0.015,
    });
  }

  for (let i = 0; i < hours * 4; i++) {
    const time = new Date(startTime.getTime() + i * 15 * 60 * 1000);
    
    // Interpolate between waypoints for realistic movement
    const waypointIndex = Math.floor((i / (hours * 4)) * numWaypoints);
    const nextWaypoint = waypoints[(waypointIndex + 1) % numWaypoints];
    const currentWaypoint = waypoints[waypointIndex % numWaypoints];
    
    const interpolation = ((i / (hours * 4)) * numWaypoints) % 1;
    
    trail.push({
      lat: currentWaypoint.lat + (nextWaypoint.lat - currentWaypoint.lat) * interpolation + (Math.random() - 0.5) * 0.001,
      lng: currentWaypoint.lng + (nextWaypoint.lng - currentWaypoint.lng) * interpolation + (Math.random() - 0.5) * 0.001,
      timestamp: time.toISOString(),
      accuracy: Math.random() * 25 + 8, // 8-33m accuracy
    });
  }

  return trail;
}

// Convert agent decisions from API to UI format
function convertAgentDecisions(apiDecisions: any[]): AgentState[] {
  const iconMap: Record<string, React.ElementType> = {
    zone: MapPin,
    work: Briefcase,
    behavior: Timer,
    reality: Globe,
    trust: ShieldCheck,
  };

  return apiDecisions.map((decision) => {
    // Extract zone coverage from finding if this is Zone Agent
    let zoneCoverage = 100;
    if (decision.agentId === "zone" && decision.finding) {
      const coverageMatch = decision.finding.match(/(\d+)%/);
      if (coverageMatch) {
        zoneCoverage = parseInt(coverageMatch[1], 10);
      }
    }
    
    return {
      id: decision.agentId,
      name: decision.agentName,
      icon: iconMap[decision.agentId] || MapPin,
      role: decision.agentName === "Zone Agent" ? "Geofence validation"
        : decision.agentName === "Work Agent" ? "Activity cross-check"
        : decision.agentName === "Behavior Agent" ? "Anomaly detection"
        : decision.agentName === "Reality Agent" ? "Environmental corroboration"
        : "Credibility & fraud analysis",
      status: "done" as const,
      vote: decision.verdict as Vote,
      confidence: decision.confidence,
      finding: decision.finding,
      duration: decision.duration,
      zoneCoverage: decision.agentId === "zone" ? zoneCoverage : undefined,
    };
  });
}

type Step = "select" | "detecting" | "council" | "verdict";

const voteColor = {
  PAY: "text-primary",
  PARTIAL: "text-amber",
  REJECT: "text-coral",
};

// ─── Weighted Agent Consensus Formula ───
// Different agents have different importance in fraud detection
const AGENT_WEIGHTS: Record<string, number> = {
  zone: 0.25,        // Zone Agent (25%) - Geofence validation is critical
  fraud: 0.25,       // Fraud Agent (25%) - Fraud detection is critical
  behavior: 0.20,    // Behavior Agent (20%) - Anomaly patterns matter
  reality: 0.15,     // Reality Agent (15%) - Environmental corroboration
  work: 0.10,        // Work Agent (10%) - Activity verification
  trust: 0.05,       // Trust Agent (5%) - Historical credibility
};

function calculateWeightedVerdict(agents: AgentState[]): {
  verdict: Vote;
  consensusScore: number;
  reasoning: string;
} {
  // GATING LOGIC: Check Zone Agent coverage first
  const zoneAgent = agents.find(a => a.id === "zone");
  const zoneCoverage = zoneAgent?.zoneCoverage ?? 100; // Default to 100 if not available
  
  // If zone coverage is 0%, HARD REJECT - worker wasn't in service area
  if (zoneCoverage === 0) {
    return {
      verdict: "REJECT",
      consensusScore: 0,
      reasoning: `Zone Agent: Worker was completely outside service area (0% coverage). Claim automatically rejected regardless of other agent votes.`,
    };
  }
  
  // Zone coverage > 0%: Use weighted consensus from all agents
  const voteValue = { PAY: 1, PARTIAL: 0.5, REJECT: 0 };
  
  // Calculate weighted score (0 to 1)
  let totalWeight = 0;
  let weightedScore = 0;
  
  agents.forEach((agent) => {
    const weight = AGENT_WEIGHTS[agent.id] || 0.05;
    const voteVal = voteValue[agent.vote] || 0;
    weightedScore += voteVal * weight;
    totalWeight += weight;
  });
  
  const normalizedScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  const consensusPercentage = Math.round(normalizedScore * 100);
  
  // Determine verdict based on weighted score
  // Thresholds: REJECT < 0.35 | PARTIAL 0.35-0.65 | PAY > 0.65
  let verdict: Vote = "REJECT";
  if (normalizedScore > 0.65) verdict = "PAY";
  else if (normalizedScore > 0.35) verdict = "PARTIAL";
  
  // Build reasoning with zone coverage context
  const payAgents = agents.filter(a => a.vote === "PAY").map(a => a.name);
  const rejectAgents = agents.filter(a => a.vote === "REJECT").map(a => a.name);
  const partialAgents = agents.filter(a => a.vote === "PARTIAL").map(a => a.name);
  
  let reasoning = "";
  if (verdict === "PAY") {
    reasoning = `Strong approval from ${payAgents.join(", ")}. Worker present in zone (${zoneCoverage}% coverage). Weighted consensus favors claim payment.`;
  } else if (verdict === "REJECT") {
    reasoning = `${rejectAgents.join(", ")} flagged critical issues. Zone coverage: ${zoneCoverage}%. Weighted risk exceeds approval threshold.`;
  } else {
    reasoning = `Mixed signals: ${payAgents.length > 0 ? payAgents.join(", ") + " approve" : ""} ${partialAgents.length > 0 ? (payAgents.length > 0 ? "while " : "") + partialAgents.join(", ") + " have concerns" : ""}. Zone coverage: ${zoneCoverage}%. Partial payout recommended.`;
  }
  
  return {
    verdict,
    consensusScore: consensusPercentage,
    reasoning,
  };
}

const voteBg = {
  PAY: "bg-sage-100 text-primary",
  PARTIAL: "bg-amber-light text-amber",
  REJECT: "bg-coral-light text-coral",
};

/* Consensus Ring */
function ConsensusRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="consensus-ring"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-bold text-2xl tabular-nums text-primary">{score}%</span>
      </div>
    </div>
  );
}

/* Local UI Simulation of Razorpay UI to avoid key validation failures */
function RazorpaySimulator({ amount, onSuccess }: { amount: number, onSuccess: () => void }) {
  const [status, setStatus] = useState<"processing" | "success" | "done">("processing");

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStatus("success");
    }, 2000);
    const timer2 = setTimeout(() => {
      setStatus("done");
      onSuccess();
    }, 3500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [onSuccess]);

  if (status === "done") return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 font-sans backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white max-w-[380px] w-full rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
        {/* Header */}
        <div className="bg-[#059669] text-white p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-white rounded-sm flex items-center justify-center text-[#059669] font-bold text-lg shadow-sm">
                CH
             </div>
             <div>
                <h3 className="font-semibold text-base leading-tight">ChillInsure</h3>
                <p className="text-white/80 text-xs mt-0.5 font-medium">Claim Payout</p>
             </div>
          </div>
          <div className="text-right pl-4">
             <div className="text-xs text-white/80 font-medium">Amount</div>
             <div className="font-bold text-lg tabular-nums tracking-tight">₹{amount}</div>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-8 pb-10 flex flex-col items-center justify-center min-h-[320px] bg-white relative">
           {status === "processing" ? (
              <div className="flex flex-col items-center space-y-5 w-full animate-in fade-in duration-300">
                 <div className="relative flex justify-center items-center">
                     <div className="w-14 h-14 border-[3px] border-gray-100 border-t-[#059669] rounded-full animate-spin" />
                     <div className="absolute w-8 h-8 bg-green-50 rounded-full animate-pulse opacity-50" />
                 </div>
                 <div className="text-center space-y-1.5 w-full">
                     <p className="text-gray-800 font-semibold text-sm">Processing Payment</p>
                     <p className="text-xs text-gray-500 max-w-[200px] mx-auto leading-relaxed">
                        Please don't refresh the page or press back button
                     </p>
                 </div>
              </div>
           ) : (
              <div className="flex flex-col items-center space-y-4 animate-in zoom-in-50 fade-in duration-300 w-full">
                 <div className="relative">
                     <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-20 animate-pulse" />
                     <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center relative shadow-sm border border-green-100">
                        <CheckCircle2Icon className="w-10 h-10 text-[#059669]" />
                     </div>
                 </div>
                 <div className="text-center space-y-1">
                     <p className="text-[#059669] font-bold text-lg">Payment Successful</p>
                     <p className="text-xs text-gray-500 font-medium tabular-nums">ID: pay_{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                 </div>
              </div>
           )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50/80 border-t border-gray-100 p-3.5 flex justify-center items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Secured by</span>
            <span className="text-sm font-bold text-[#338be8] tracking-tight ml-0.5 flex items-center">
               <span className="italic font-black pr-0.5">R</span>azorpay
            </span>
        </div>
      </div>
    </div>
  );
}

export function ClaimSimulation() {
  const [step, setStep] = useState<Step>("select");
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [activeAgentIdx, setActiveAgentIdx] = useState(-1);
  const [detectProgress, setDetectProgress] = useState(0);
  const [verdict, setVerdict] = useState<Vote>(null);
  const [consensusScore, setConsensusScore] = useState(0);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [gpsTrail, setGpsTrail] = useState<any[]>([]);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);

  const { verifyClaim, loading: verifying, error } = useClaimVerification();
  const trigger = triggers.find((t) => t.id === selectedTrigger);

  const reset = useCallback(() => {
    setStep("select");
    setSelectedTrigger(null);
    setAgents([]);
    setActiveAgentIdx(-1);
    setDetectProgress(0);
    setVerdict(null);
    setConsensusScore(0);
    setPayoutAmount(0);
    setGpsTrail([]);
    setShowWalletModal(false);
    setShowRazorpay(false);
  }, []);

  const handleDisburse = useCallback(() => {
    if (verdict === "PAY" || verdict === "PARTIAL") {
      setShowRazorpay(true);
    }
  }, [verdict]);

  // Auto-trigger payout 2 seconds after verdict is reached
  useEffect(() => {
    if (step === "verdict" && (verdict === "PAY" || verdict === "PARTIAL")) {
      const timer = setTimeout(() => {
        handleDisburse();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, verdict, handleDisburse]);

  /* Detection phase */
  useEffect(() => {
    if (step !== "detecting") return;
    setDetectProgress(0);
    const interval = setInterval(() => {
      setDetectProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [step]);

  /* Submit claim to real API */
  useEffect(() => {
    if (step === "detecting" && detectProgress >= 100 && selectedTrigger) {
      const submitClaim = async () => {
        try {
          const triggerData = triggers.find((t) => t.id === selectedTrigger);
          if (!triggerData) return;

          const claim: ClaimData = {
            partnerId: "PARTNER_001",
            partnerName: "Delivery Partner A",
            location: {
              lat: triggerData.lat,
              lng: triggerData.lng,
              city: triggerData.location.split(",")[1].trim(),
              zone: triggerData.location.split(",")[0],
            },
            trigger: selectedTrigger as any,
            triggerValue: triggerData.expectedEarnings,
            expectedEarnings: triggerData.expectedEarnings,
            actualEarnings: triggerData.actualEarnings,
            timestamp: new Date().toISOString(),
            gpsTrail: generateMockGPSTrail(triggerData.lat, triggerData.lng),
          };

          const result = await verifyClaim(claim);
          
          // Store GPS trail for map display
          setGpsTrail(claim.gpsTrail || []);
          
          // Convert agent decisions and display them
          const agentStates = convertAgentDecisions(result.agentDecisions);
          setAgents(agentStates);
          
          // Calculate weighted consensus verdict
          const { verdict: finalVerdict, consensusScore, reasoning } = calculateWeightedVerdict(agentStates);
          setVerdict(finalVerdict);
          setConsensusScore(consensusScore);
          
          // Calculate payout based on weighted verdict
          const payout = finalVerdict === "PAY" 
            ? claim.expectedEarnings - claim.actualEarnings
            : finalVerdict === "PARTIAL"
            ? (claim.expectedEarnings - claim.actualEarnings) * 0.5
            : 0;
          setPayoutAmount(payout);
          
          setStep("council");
          setActiveAgentIdx(0);
        } catch (err) {
          console.error("Error submitting claim:", err);
          // Fallback to mock data if API fails
          setStep("select");
        }
      };

      const timer = setTimeout(() => submitClaim(), 300);
      return () => clearTimeout(timer);
    }
  }, [step, detectProgress, selectedTrigger, verifyClaim]);

  /* Council agent display animation */
  useEffect(() => {
    if (step !== "council" || activeAgentIdx < 0 || activeAgentIdx >= agents.length) return;
    
    // Animate through agents
    setAgents((prev) =>
      prev.map((a, i) => (i === activeAgentIdx ? { ...a, status: "verifying" } : a))
    );

    const timer = setTimeout(() => {
      setAgents((prev) =>
        prev.map((a, i) => (i === activeAgentIdx ? { ...a, status: "done" } : a))
      );
      
      if (activeAgentIdx < agents.length - 1) {
        setActiveAgentIdx((idx) => idx + 1);
      } else {
        setTimeout(() => setStep("verdict"), 500);
      }
    }, agents[activeAgentIdx]?.duration || 1500);

    return () => clearTimeout(timer);
  }, [step, activeAgentIdx, agents]);

  const doneAgents = agents.filter((a) => a.status === "done");
  const payCount = agents.filter((a) => a.vote === "PAY").length;
  const rejectCount = agents.filter((a) => a.vote === "REJECT").length;
  const partialCount = agents.filter((a) => a.vote === "PARTIAL").length;
  
  // Auto-transition to verdict when all agents are done
  useEffect(() => {
    if (step === "council" && agents.length > 0 && doneAgents.length === agents.length) {
      const timer = setTimeout(() => setStep("verdict"), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, agents.length, doneAgents.length]);
  
  // Show error state
  if (error && step !== "select") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg mb-1">Claim Simulation</h2>
            <p className="text-sm text-muted-foreground">
              Watch the AI Council process a live parametric claim in real-time
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>
        </div>
        
        <div className="rounded-2xl border-2 border-coral bg-coral-light/30 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-coral flex-shrink-0" />
            <div>
              <h3 className="font-display font-bold text-lg text-coral">Verification Error</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Make sure the backend server is running on http://localhost:3001
              </p>
            </div>
          </div>
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg mb-1">Claim Simulation</h2>
          <p className="text-sm text-muted-foreground">
            Watch the AI Council process a live parametric claim in real-time
          </p>
        </div>
        {step !== "select" && (
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-1">
        {(["select", "detecting", "council", "verdict"] as Step[]).map((s, i) => {
          const labels = ["Trigger", "Detection", "AI Council", "Verdict"];
          const isActive = s === step;
          const isDone =
            (s === "select" && step !== "select") ||
            (s === "detecting" && ["council", "verdict"].includes(step)) ||
            (s === "council" && step === "verdict");
          return (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : isDone
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <span className="tabular-nums w-4 text-center">{i + 1}</span>
                <span className="hidden sm:inline">{labels[i]}</span>
              </div>
              {i < 3 && (
                <div className={`flex-1 h-px transition-colors duration-500 ${isDone ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Step 1: Select ─── */}
      {step === "select" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-display font-bold mb-4">Available Problems to Test</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {triggers.map((t) => {
                const isSelected = selectedTrigger === t.id;
                const severityColor = {
                  critical: "border-coral bg-coral-light/30",
                  high: "border-amber bg-amber-light/20",
                  medium: "border-primary bg-primary/5",
                };
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTrigger(t.id)}
                    className={`text-left rounded-xl p-4 border-2 transition-all duration-200 active:scale-[0.97] flex flex-col ${
                      isSelected
                        ? severityColor[t.severity as keyof typeof severityColor] + " border-2"
                        : "border-border bg-card hover:border-muted-foreground/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        <t.icon className="w-5 h-5" />
                      </div>
                      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        t.severity === "critical" ? "bg-coral text-white"
                        : t.severity === "high" ? "bg-amber text-black"
                        : "bg-primary text-white"
                      }`}>
                        {t.severity}
                      </div>
                    </div>
                    <h4 className="font-display font-semibold text-sm mb-1">{t.label}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{t.location}</p>
                    <p className="text-[11px] text-muted-foreground mb-2 flex-grow">{t.detail}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <span className="text-[11px] font-semibold text-primary">{t.impact}</span>
                      <span className="text-xs font-bold text-foreground">{t.expectedLoss}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTrigger && (
            <div className="space-y-4">
              {/* Selected trigger details */}
              {triggers.find((t) => t.id === selectedTrigger) && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-base">
                      📍 {triggers.find((t) => t.id === selectedTrigger)?.location}
                    </h4>
                    <div className="text-xs text-muted-foreground font-mono">
                      Lat: {triggers.find((t) => t.id === selectedTrigger)?.lat.toFixed(4)}, 
                      Lng: {triggers.find((t) => t.id === selectedTrigger)?.lng.toFixed(4)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-card rounded p-2 border border-border">
                      <p className="text-muted-foreground font-semibold">Expected Earnings</p>
                      <p className="font-bold text-primary">₹{triggers.find((t) => t.id === selectedTrigger)?.expectedEarnings}</p>
                    </div>
                    <div className="bg-card rounded p-2 border border-border">
                      <p className="text-muted-foreground font-semibold">Actual Earnings</p>
                      <p className="font-bold">₹{triggers.find((t) => t.id === selectedTrigger)?.actualEarnings}</p>
                    </div>
                    <div className="bg-card rounded p-2 border border-border">
                      <p className="text-muted-foreground font-semibold">Loss</p>
                      <p className="font-bold text-coral">₹{(triggers.find((t) => t.id === selectedTrigger)?.expectedEarnings ?? 0) - (triggers.find((t) => t.id === selectedTrigger)?.actualEarnings ?? 0)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center">
                <Button onClick={() => setStep("detecting")} size="lg" className="px-8">
                  <Play className="w-4 h-4 mr-2" />
                  Start Simulation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Step 2: Detection ─── */}
      {step === "detecting" && trigger && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center glow-pulse">
              <Radio className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-display font-semibold">{trigger.label} Detected</h4>
              <p className="text-sm text-muted-foreground">{trigger.location}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Validating sensor data & matching policy...</span>
              <span className="tabular-nums font-semibold text-primary">{detectProgress}%</span>
            </div>
            <Progress value={detectProgress} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "EXPECTED", value: trigger.expected },
              { label: "ACTUAL", value: trigger.actual },
              { label: "EST. PAYOUT", value: trigger.expectedLoss, highlight: true },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-3 border ${item.highlight ? "bg-primary/10 border-primary/30" : "bg-muted/50 border-border"}`}>
                <p className="text-[9px] font-semibold tracking-widest text-muted-foreground">{item.label}</p>
                <p className={`font-display font-bold tabular-nums ${item.highlight ? "text-primary" : ""}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Step 3: AI Council ─── */}
      {(step === "council" || step === "verdict") && (
        <div className="grid lg:grid-cols-[1fr_280px_320px] gap-5">
          {/* Agent list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground">AI COUNCIL VERIFICATION</p>
              {step === "council" && doneAgents.length > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setStep("verdict")}
                  className="text-[10px] h-7"
                >
                  Skip to Verdict
                </Button>
              )}
            </div>
            {agents.map((agent) => {
              const Icon = agent.icon;
              const isVerifying = agent.status === "verifying";
              const isDone = agent.status === "done";

              return (
                <div
                  key={agent.id}
                  className={`rounded-xl border p-4 transition-all duration-500 ${
                    isVerifying
                      ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/5"
                      : isDone
                      ? "border-border bg-card"
                      : "border-border/40 bg-card/50 opacity-40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isDone && agent.vote ? voteColor[agent.vote] : isVerifying ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-display font-semibold text-sm">{agent.name}</span>
                      {isVerifying && agent.id !== "zone" && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary animate-pulse-soft">
                          SCANNING...
                        </span>
                      )}
                    </div>
                    {agent.vote && (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${voteColor[agent.vote]}`}>{agent.vote}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">{agent.confidence}%</span>
                      </div>
                    )}
                    {isVerifying && !agent.vote && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary/10 text-primary animate-pulse-soft">Verifying...</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground mb-2">{agent.role}</p>

                  {(isDone || agent.vote) && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                      <p className="text-xs text-foreground/80 leading-relaxed">{agent.finding}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${agent.confidence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {isVerifying && (
                    <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-primary/40 rounded-full animate-pulse-soft w-3/5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Live consensus sidebar */}
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-5 flex flex-col items-center">
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-3">LIVE CONSENSUS</p>
              <ConsensusRing score={consensusScore} />
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className="text-primary font-semibold tabular-nums">{payCount} PAY</span>
                <span className="text-amber font-semibold tabular-nums">{partialCount} PARTIAL</span>
                <span className="text-coral font-semibold tabular-nums">{rejectCount} REJECT</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 tabular-nums">
                {doneAgents.length}/5 agents reported
              </p>
            </div>

            {trigger && (
              <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground">CLAIM DETAILS</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Trigger</span><span>{trigger.label}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{trigger.location.split(",")[0]}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Est. Payout</span><span className="text-primary font-semibold">{trigger.expectedLoss}</span></div>
                </div>
              </div>
            )}

            {/* Added Reset button for when verdict is done */}
            {step === "verdict" && (
              <Button onClick={reset} variant="outline" className="w-full mt-2 border-border/50 bg-card/50">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Another Simulation
              </Button>
            )}
          </div>

          {/* GPS Map Visualization */}
          {trigger && (
            <div className="space-y-3">
              <div className="h-64 rounded-2xl border border-border overflow-hidden">
                <GeoMap
                  gpsTrail={gpsTrail}
                  zoneLat={trigger.lat}
                  zoneLng={trigger.lng}
                  zoneName={trigger.location.split(",")[0]}
                  zoneRadius={750}
                />
              </div>
              <MapLegend gpsTrail={gpsTrail} />
            </div>
          )}
        </div>
      )}

      {/* ─── Modals (Wallet & Razorpay) ─── */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full mx-4 animate-in fade-in scale-in-95 duration-300">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-bounce">
                  <CheckCircle2Icon className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-display font-bold text-xl text-foreground">
                  Claim Added to Wallet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your payout has been successfully disbursed via 
                  <span className="text-primary font-semibold ml-1">Instant Auto-Payment</span>
                </p>
              </div>
              
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  Amount Credited
                </p>
                <p className="font-display font-bold text-2xl text-primary tabular-nums">
                  ₹{Math.round(payoutAmount)}
                </p>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Processing time: ~3-5 seconds
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Accurate Simulation */}
      {showRazorpay && (
         <RazorpaySimulator 
            amount={Math.round(payoutAmount)} 
            onSuccess={async () => {
               setShowRazorpay(false);
               
               try {
                 // Record the simulated claim to the backend so it shows up in Claims / Payouts tabs
                 await fetch(`http://localhost:3001/api/dashboard/record-simulation/${localStorage.getItem('userId') || 'user_demo_1'}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                       trigger: `${trigger?.label} — ${trigger?.location?.split(",")[0]}`,
                       amount: payoutAmount,
                       status: "approved",
                       expected: trigger?.expected || "",
                       actual: trigger?.actual || "",
                       agents: `${agents.filter(a => a.vote === "PAY").length}/5 PAY`,
                       confidence: consensusScore,
                       council: agents.map(a => ({
                         name: a.name,
                         id: a.id,
                         vote: a.vote,
                         confidence: a.confidence,
                         finding: a.finding
                       }))
                    })
                 });
               } catch (err) {
                 console.error("Failed to record simulation to backend", err);
               }

               setShowWalletModal(true);
               setTimeout(() => {
                  setShowWalletModal(false);
                  reset();
               }, 4000);
            }} 
         />
      )}
    </div>
  );
}
