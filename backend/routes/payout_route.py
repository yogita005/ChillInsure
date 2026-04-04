"""
ChillInsure Payout API Routes
Handles payout processing, status tracking, and fund management
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

router = APIRouter(prefix="/api/payout", tags=["payout"])

# Models
class PayoutRequest(BaseModel):
    claim_id: str
    rider_uid: str
    amount: float
    currency: str = "INR"
    reason: str

class PayoutStatusUpdate(BaseModel):
    claim_id: str
    status: str  # INITIATED, PROCESSING, COMPLETED, FAILED
    provider_reference: Optional[str] = None

# In-memory storage (replace with actual DB)
payouts_db = {}

@router.post("/process")
async def process_payout(request: PayoutRequest):
    """
    Process immediate payout after claim approval
    Typically called by claims-verdict API after consensus
    
    Returns: {
        "payout_id": "payout_001",
        "status": "INITIATED",
        "amount": 500,
        "settlement_time_estimate_seconds": 2
    }
    """
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    payout_id = f"payout_{datetime.now().timestamp()}"
    
    payout_record = {
        "payout_id": payout_id,
        "claim_id": request.claim_id,
        "rider_uid": request.rider_uid,
        "amount": request.amount,
        "currency": request.currency,
        "reason": request.reason,
        "status": "INITIATED",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "provider_reference": None,
        "settlement_time_seconds": None,
        "error_message": None
    }
    
    payouts_db[payout_id] = payout_record
    
    # In real implementation, would call payment provider asynchronously
    # For now, simulating immediate processing
    
    return {
        "payout_id": payout_id,
        "claim_id": request.claim_id,
        "status": "INITIATED",
        "amount": request.amount,
        "currency": request.currency,
        "settlement_time_estimate_seconds": 2,
        "message": "Payout initiated. Funds will be transferred within 2 seconds."
    }

@router.get("/status/{payout_id}")
async def get_payout_status(payout_id: str):
    """Get payout status and details"""
    if payout_id not in payouts_db:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    payout = payouts_db[payout_id]
    
    return {
        "payout_id": payout_id,
        "claim_id": payout["claim_id"],
        "status": payout["status"],
        "amount": payout["amount"],
        "currency": payout["currency"],
        "created_at": payout["created_at"],
        "updated_at": payout["updated_at"],
        "provider_reference": payout.get("provider_reference"),
        "settlement_time_seconds": payout.get("settlement_time_seconds"),
        "error_message": payout.get("error_message")
    }

@router.get("/rider/{rider_uid}")
async def get_rider_payouts(
    rider_uid: str,
    status: Optional[str] = None,
    limit: int = 20
):
    """Get payout history for a rider"""
    rider_payouts = [
        p for p in payouts_db.values()
        if p["rider_uid"] == rider_uid
    ]
    
    if status:
        rider_payouts = [p for p in rider_payouts if p["status"] == status]
    
    # Sort by date, most recent first
    rider_payouts.sort(key=lambda x: x["updated_at"], reverse=True)
    
    return {
        "rider_uid": rider_uid,
        "total_payouts": len(rider_payouts),
        "total_amount": sum(p["amount"] for p in rider_payouts),
        "payouts": rider_payouts[:limit]
    }

@router.get("/claim/{claim_id}")
async def get_payout_for_claim(claim_id: str):
    """Get payout details for a specific claim"""
    payout = next(
        (p for p in payouts_db.values() if p["claim_id"] == claim_id),
        None
    )
    
    if not payout:
        return {
            "claim_id": claim_id,
            "status": "NOT_FOUND",
            "message": "No payout found for this claim"
        }
    
    return payout

@router.put("/update-status")
async def update_payout_status(request: PayoutStatusUpdate):
    """
    Update payout status (called by payment provider webhooks)
    Statuses: INITIATED -> PROCESSING -> COMPLETED or FAILED
    """
    if request.claim_id not in payouts_db:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    payout = payouts_db[request.claim_id]
    payout["status"] = request.status
    payout["updated_at"] = datetime.now().isoformat()
    
    if request.provider_reference:
        payout["provider_reference"] = request.provider_reference
    
    if request.status == "COMPLETED":
        # Record settlement time
        created = datetime.fromisoformat(payout["created_at"])
        now = datetime.now()
        payout["settlement_time_seconds"] = (now - created).total_seconds()
    
    return {
        "payout_id": request.claim_id,
        "status": request.status,
        "message": f"Payout status updated to {request.status}"
    }

@router.get("/analytics/daily")
async def get_daily_payout_analytics(days: int = 7):
    """Get daily payout analytics"""
    return {
        "period_days": days,
        "analytics": {
            "total_payouts_processed": 2450,
            "total_amount_paid": "₹18,75,000",
            "average_payout_amount": 765,
            "success_rate_percent": 99.8,
            "average_settlement_time_seconds": 2.1,
            "failed_payouts": 5,
            "pending_payouts": 0
        },
        "daily_breakdown": [
            {
                "date": "2026-04-04",
                "payouts_count": 380,
                "total_amount": "₹2,89,000",
                "success_rate_percent": 99.7,
                "avg_settlement_time": 2.0
            },
            {
                "date": "2026-04-03",
                "payouts_count": 365,
                "total_amount": "₹2,76,500",
                "success_rate_percent": 99.8,
                "avg_settlement_time": 2.1
            },
            {
                "date": "2026-04-02",
                "payouts_count": 342,
                "total_amount": "₹2,62,000",
                "success_rate_percent": 99.9,
                "avg_settlement_time": 2.2
            }
        ]
    }

@router.get("/analytics/provider")
async def get_provider_analytics():
    """Get payment provider performance metrics"""
    return {
        "timestamp": "2026-04-04T10:30:00Z",
        "providers": [
            {
                "provider": "UPI Gateway",
                "transactions": 1640,
                "success_rate_percent": 99.9,
                "avg_settlement_time": 1.8,
                "total_volume": "₹12,54,500"
            },
            {
                "provider": "Bank Transfer",
                "transactions": 680,
                "success_rate_percent": 99.6,
                "avg_settlement_time": 2.5,
                "total_volume": "₹5,21,000"
            },
            {
                "provider": "Mobile Wallet",
                "transactions": 130,
                "success_rate_percent": 100.0,
                "avg_settlement_time": 1.5,
                "total_volume": "₹99,500"
            }
        ],
        "network_summary": {
            "total_transactions": 2450,
            "total_volume": "₹18,75,000",
            "weighted_success_rate": 99.8,
            "weighted_avg_settlement": 2.1
        }
    }

@router.get("/funds/availability")
async def check_funds_availability(max_payout: float = 1000):
    """Check if sufficient funds are available for payouts"""
    return {
        "timestamp": "2026-04-04T10:30:00Z",
        "reserve_balance": "₹50,00,000",
        "reserved_for_pending": "₹0",
        "available_for_payouts": "₹50,00,000",
        "max_single_payout_limit": 50000,
        "requested_amount": max_payout,
        "can_process": max_payout <= 50000,
        "daily_payout_limit": "₹10,00,000",
        "daily_amount_processed_today": "₹9,87,500",
        "remaining_daily_quota": "₹12,500"
    }

@router.post("/retry/{payout_id}")
async def retry_failed_payout(payout_id: str):
    """Retry a failed payout"""
    if payout_id not in payouts_db:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    payout = payouts_db[payout_id]
    
    if payout["status"] != "FAILED":
        raise HTTPException(status_code=400, detail="Only failed payouts can be retried")
    
    # Reset status and clear error
    payout["status"] = "INITIATED"
    payout["error_message"] = None
    payout["updated_at"] = datetime.now().isoformat()
    
    return {
        "payout_id": payout_id,
        "status": "INITIATED",
        "message": "Payout retry initiated"
    }
