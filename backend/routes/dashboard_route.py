"""
ChillInsure Dashboard API Routes
Aggregated endpoints for the frontend dashboard tabs:
  - Overview (stats, earnings, activity)
  - Claims (list with AI Council decisions)
  - Payouts (transaction history)
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta, date
from typing import Optional
import random
import uuid

router = APIRouter()


def _try_get_supabase():
    """Safely get Supabase client, return None if unavailable."""
    try:
        from db.supabase_client import get_supabase_client
        return get_supabase_client()
    except Exception:
        return None


# ============================================================================
# DASHBOARD OVERVIEW
# ============================================================================

@router.get("/overview/{user_id}")
async def get_dashboard_overview(user_id: str):
    """
    Dashboard Overview — aggregated stats for the worker dashboard.
    Pulls real data from policies/gigscore tables when available,
    falls back to mock data otherwise.
    """
    try:
        now = datetime.utcnow()
        db = _try_get_supabase()

        # --- Active policy info (try real DB first) ---
        policy_info = None
        if db:
            try:
                policy_result = db.table("policies").select("*").eq(
                    "uid", user_id
                ).eq("status", "active").order(
                    "created_at", desc=True
                ).limit(1).execute()

                if policy_result.data:
                    p = policy_result.data[0]
                    week_end = p.get("week_end")
                    if week_end:
                        try:
                            # week_end is a date column, handle both date and datetime formats
                            end_str = str(week_end)
                            if "T" in end_str:
                                end_date = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
                            else:
                                end_date = datetime.strptime(end_str, "%Y-%m-%d")
                            days_left = max(0, (end_date - now).days)
                            expires_in = f"{days_left} days"
                        except Exception:
                            days_left = 4
                            expires_in = "4 days"
                    else:
                        days_left = 4
                        expires_in = "4 days"

                    coverage_per_day = int(p.get("coverage_per_day", 500))

                    policy_info = {
                        "name": "Weather Shield",
                        "status": str(p.get("status", "active")),
                        "expiresIn": expires_in,
                        "expiresAt": str(week_end) if week_end else (now + timedelta(days=4)).isoformat(),
                        "coverageAmount": coverage_per_day * 7,
                        "premiumPaid": float(p.get("weekly_premium", 49)),
                    }
            except Exception as e:
                print(f"[WARN] Could not fetch policy from DB: {e}")

        if not policy_info:
            policy_info = {
                "name": "Weather Shield",
                "status": "active",
                "expiresIn": "4 days",
                "expiresAt": (now + timedelta(days=4)).isoformat(),
                "coverageAmount": 5000,
                "premiumPaid": 49,
            }

        # --- Trust / GigScore (try real DB first) ---
        trust_score = None
        if db:
            try:
                gs_result = db.table("gigscore").select("score, risk_tier").eq(
                    "uid", user_id
                ).execute()

                if gs_result.data:
                    gs = gs_result.data[0]
                    score_val = gs.get("score", 65)
                    tier = gs.get("risk_tier", "medium")
                    tier_labels = {
                        "low": "Excellent standing",
                        "medium": "Good standing",
                        "high": "Needs improvement",
                    }
                    trust_score = {
                        "score": float(score_val),
                        "label": tier_labels.get(tier, "Good standing"),
                        "change": "+2.1%",
                    }
            except Exception as e:
                print(f"[WARN] Could not fetch gigscore from DB: {e}")

        if not trust_score:
            trust_score = {
                "score": 94.2,
                "label": "Excellent standing",
                "change": "+2.1%",
            }

        # --- Claims this month (mock — no claims table in DB yet) ---
        claims_summary = {
            "total": 3,
            "approved": 2,
            "pending": 1,
            "rejected": 0,
        }

        # --- Payouts (mock — no payouts table in DB yet) ---
        payouts_summary = {
            "totalAmount": 1847,
            "thisWeek": 620,
            "thisWeekChange": "+34%",
            "count": 4,
        }

        # --- Earnings breakdown (this week) ---
        earnings = {
            "expected": 1200,
            "actual": 310,
            "covered": 890,
            "coveredPercentage": 74,
        }

        # --- Recent activity feed ---
        activity = [
            {
                "time": "2h ago",
                "event": "Heavy rainfall detected in HSR Layout zone",
                "type": "trigger",
            },
            {
                "time": "2h ago",
                "event": "AI Council validated claim #1847 — PAY",
                "type": "approved",
            },
            {
                "time": "2h ago",
                "event": "₹620 disbursed to UPI",
                "type": "payout",
            },
            {
                "time": "1d ago",
                "event": "AQI threshold reached in Koramangala — claim #1842 filed",
                "type": "trigger",
            },
            {
                "time": "1d ago",
                "event": "Claim #1842 approved — ₹410 paid",
                "type": "approved",
            },
            {
                "time": "5d ago",
                "event": f"Weekly premium ₹{int(policy_info['premiumPaid'])} auto-deducted",
                "type": "billing",
            },
        ]

        return {
            "status": "success",
            "userId": user_id,
            "policy": policy_info,
            "claims": claims_summary,
            "payouts": payouts_summary,
            "trustScore": trust_score,
            "earnings": earnings,
            "recentActivity": activity,
            "timestamp": now.isoformat(),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard overview error: {str(e)}")
# ============================================================================
# MOCK DATA STORE FOR DEMO
# ============================================================================

MOCK_CLAIMS = [
    {
        "id": "CLM-7842",
        "date": "Mar 18, 2026",
        "trigger": "Heavy rain — HSR Layout",
        "status": "approved",
        "amount": "₹620",
        "expected": "₹1,200",
        "actual": "₹310",
        "agents": "5/5 PAY",
        "confidence": 97,
        "council": [
            {
                "name": "Zone Agent",
                "agentId": "zone",
                "vote": "PAY",
                "confidence": 94,
                "finding": "GPS confirmed within 200m of disruption zone for 47 min",
            },
            {
                "name": "Work Agent",
                "agentId": "work",
                "vote": "PAY",
                "confidence": 91,
                "finding": "Completed 2 orders vs normal 8 — 75% reduction consistent with disruption",
            },
            {
                "name": "Behavior Agent",
                "agentId": "behavior",
                "vote": "PAY",
                "confidence": 88,
                "finding": "Movement patterns consistent with heavy rain avoidance behavior",
            },
            {
                "name": "Reality Agent",
                "agentId": "reality",
                "vote": "PAY",
                "confidence": 96,
                "finding": "IMD confirmed 84mm rainfall in sector; flood warning active",
            },
            {
                "name": "Trust Agent",
                "agentId": "trust",
                "vote": "PAY",
                "confidence": 92,
                "finding": "Clean history — 14 months, 3 prior claims, all verified legitimate",
            },
        ],
    },
    {
        "id": "CLM-7843",
        "date": "Mar 17, 2026",
        "trigger": "AQI > 300 — Koramangala",
        "status": "approved",
        "amount": "₹410",
        "expected": "₹800",
        "actual": "₹280",
        "agents": "4/5 PAY",
        "confidence": 89,
        "council": [
            {
                "name": "Zone Agent",
                "agentId": "zone",
                "vote": "PAY",
                "confidence": 91,
                "finding": "All pings within 1.2km of AQI sensor station",
            },
            {
                "name": "Work Agent",
                "agentId": "work",
                "vote": "PAY",
                "confidence": 87,
                "finding": "Delivery attempts fell 61% vs daily avg",
            },
            {
                "name": "Behavior Agent",
                "agentId": "behavior",
                "vote": "PAY",
                "confidence": 89,
                "finding": "Reduced outdoor time by 40% — matches zone pattern",
            },
            {
                "name": "Reality Agent",
                "agentId": "reality",
                "vote": "PAY",
                "confidence": 93,
                "finding": "CPCB station confirms AQI 318 at 14:30",
            },
            {
                "name": "Trust Agent",
                "agentId": "trust",
                "vote": "PARTIAL",
                "confidence": 78,
                "finding": "2 prior claims this month — within normal range",
            },
        ],
    },
    {
        "id": "CLM-7844",
        "date": "Mar 14, 2026",
        "trigger": "Flooding — Silk Board",
        "status": "pending",
        "amount": "₹530",
        "expected": "₹950",
        "actual": "₹420",
        "agents": "3/5 PAY",
        "confidence": 72,
        "council": [
            {
                "name": "Zone Agent",
                "agentId": "zone",
                "vote": "PAY",
                "confidence": 82,
                "finding": "GPS near flood zone but 400m from epicenter",
            },
            {
                "name": "Work Agent",
                "agentId": "work",
                "vote": "PAY",
                "confidence": 78,
                "finding": "Order volume dropped but some deliveries completed",
            },
            {
                "name": "Behavior Agent",
                "agentId": "behavior",
                "vote": "PARTIAL",
                "confidence": 65,
                "finding": "Movement patterns partially consistent",
            },
            {
                "name": "Reality Agent",
                "agentId": "reality",
                "vote": "PAY",
                "confidence": 85,
                "finding": "Flooding confirmed by BBMP civic data",
            },
            {
                "name": "Trust Agent",
                "agentId": "trust",
                "vote": "PARTIAL",
                "confidence": 70,
                "finding": "Newer account — limited history for pattern analysis",
            },
        ],
    },
    {
        "id": "CLM-7845",
        "date": "Mar 10, 2026",
        "trigger": "Heavy rain — Indiranagar",
        "status": "approved",
        "amount": "₹287",
        "expected": "₹600",
        "actual": "₹200",
        "agents": "5/5 PAY",
        "confidence": 95,
        "council": [
            {
                "name": "Zone Agent",
                "agentId": "zone",
                "vote": "PAY",
                "confidence": 96,
                "finding": "Confirmed in Indiranagar throughout event",
            },
            {
                "name": "Work Agent",
                "agentId": "work",
                "vote": "PAY",
                "confidence": 94,
                "finding": "Near complete work stoppage during rain window",
            },
            {
                "name": "Behavior Agent",
                "agentId": "behavior",
                "vote": "PAY",
                "confidence": 92,
                "finding": "Speed/movement consistent with rain disruption",
            },
            {
                "name": "Reality Agent",
                "agentId": "reality",
                "vote": "PAY",
                "confidence": 97,
                "finding": "IMD confirmed heavy rainfall; multiple sensors agree",
            },
            {
                "name": "Trust Agent",
                "agentId": "trust",
                "vote": "PAY",
                "confidence": 95,
                "finding": "High trust score — excellent claim history",
            },
        ],
    },
    {
        "id": "CLM-7846",
        "date": "Mar 6, 2026",
        "trigger": "Curfew — Whitefield",
        "status": "rejected",
        "amount": "—",
        "expected": "₹700",
        "actual": "₹700",
        "agents": "1/5 PAY",
        "confidence": 18,
        "council": [
            {
                "name": "Zone Agent",
                "agentId": "zone",
                "vote": "REJECT",
                "confidence": 22,
                "finding": "GPS trail shows user was 8km outside curfew zone",
            },
            {
                "name": "Work Agent",
                "agentId": "work",
                "vote": "REJECT",
                "confidence": 15,
                "finding": "Normal order activity detected — no disruption evident",
            },
            {
                "name": "Behavior Agent",
                "agentId": "behavior",
                "vote": "REJECT",
                "confidence": 12,
                "finding": "Movement patterns identical to non-disruption days",
            },
            {
                "name": "Reality Agent",
                "agentId": "reality",
                "vote": "PAY",
                "confidence": 91,
                "finding": "Curfew confirmed in Whitefield — event is real",
            },
            {
                "name": "Trust Agent",
                "agentId": "trust",
                "vote": "REJECT",
                "confidence": 8,
                "finding": "User was not impacted — location mismatch flagged",
            },
        ],
    },
]

MOCK_PAYOUTS = [
    {
        "id": "TXN-98271",
        "date": "Mar 18, 2026",
        "claim": "#1847",
        "amount": "₹620",
        "method": "UPI — arjun@oksbi",
        "status": "Completed",
    },
    {
        "id": "TXN-98264",
        "date": "Mar 17, 2026",
        "claim": "#1842",
        "amount": "₹410",
        "method": "UPI — arjun@oksbi",
        "status": "Completed",
    },
    {
        "id": "TXN-98251",
        "date": "Mar 10, 2026",
        "claim": "#1831",
        "amount": "₹287",
        "method": "UPI — arjun@oksbi",
        "status": "Completed",
    },
    {
        "id": "TXN-98230",
        "date": "Mar 3, 2026",
        "claim": "#1819",
        "amount": "₹530",
        "method": "UPI — arjun@oksbi",
        "status": "Completed",
    },
]

# ============================================================================
# DASHBOARD CLAIMS
# ============================================================================

@router.get("/claims/{user_id}")
async def get_dashboard_claims(user_id: str):
    """
    Dashboard Claims — list of all claims with full AI Council decisions.
    Each claim includes: id, date, trigger, status, earnings, and per-agent votes.
    """
    try:
        return {
            "status": "success",
            "userId": user_id,
            "totalClaims": len(MOCK_CLAIMS),
            "claims": MOCK_CLAIMS,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard claims error: {str(e)}")


# ============================================================================
# DASHBOARD PAYOUTS
# ============================================================================

@router.get("/payouts/{user_id}")
async def get_dashboard_payouts(user_id: str):
    """
    Dashboard Payouts — payout transaction history with summary stats.
    """
    try:
        # Calculate summary
        total_amount = sum(
            int(p["amount"].replace("₹", "").replace(",", "")) for p in MOCK_PAYOUTS if p["status"] == "Completed"
        )

        return {
            "status": "success",
            "userId": user_id,
            "summary": {
                "totalDisbursed": total_amount,
                "totalPayouts": len(MOCK_PAYOUTS),
                "avgPayoutTimeMinutes": 4.2,
            },
            "payouts": MOCK_PAYOUTS,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard payouts error: {str(e)}")

# ============================================================================
# RECORD SIMULATION
# ============================================================================

from pydantic import BaseModel
from typing import List, Dict, Any

class SimulationRecord(BaseModel):
    trigger: str
    amount: float
    status: str
    expected: str
    actual: str
    agents: str
    confidence: float
    council: List[Dict[str, Any]]

@router.post("/record-simulation/{user_id}")
async def record_simulation(user_id: str, data: SimulationRecord):
    """
    Saves a claim from the Claim Simulation tool so it appears in the Claims list and Payouts.
    """
    try:
        now = datetime.utcnow()
        date_str = now.strftime("%b %d, %Y")
        
        # Determine the next claim ID
        claim_id_num = 7847 + len(MOCK_CLAIMS) - 5
        claim_id_str = f"CLM-{claim_id_num}"
        txn_id_str = f"TXN-{random.randint(10000, 99999)}"

        new_claim = {
            "id": claim_id_str,
            "date": date_str,
            "trigger": f"{data.trigger} (Auto Pay)",
            "status": data.status,
            "amount": f"₹{int(data.amount)}" if data.amount > 0 else "—",
            "expected": data.expected,
            "actual": data.actual,
            "agents": data.agents,
            "confidence": int(data.confidence),
            "council": [
                {
                    "name": agent.get("name", "Agent"),
                    "agentId": agent.get("id"),
                    "vote": agent.get("vote", "REJECT"),
                    "confidence": int(agent.get("confidence", 0)),
                    "finding": agent.get("finding", "Simulated result"),
                } for agent in data.council
            ]
        }
        
        MOCK_CLAIMS.insert(0, new_claim)
        
        if data.status in ["approved", "pending"] and data.amount > 0:
            new_payout = {
                "id": txn_id_str,
                "date": date_str,
                "claim": f"#{claim_id_num}",
                "amount": f"₹{int(data.amount)}",
                "method": "Instant Auto-Payment",
                "status": "Completed"
            }
            MOCK_PAYOUTS.insert(0, new_payout)

        return {"status": "success", "message": "Simulation recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record simulation: {str(e)}")
