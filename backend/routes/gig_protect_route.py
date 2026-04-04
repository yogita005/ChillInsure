"""
GIG PROTECT - ChillInsure Smart Coverage API Routes
Parametric insurance with zero-touch auto-payouts
Endpoints for:
1. Quick policy quotes 💰
2. Policy purchase & cancellation
3. Real-time disruption monitoring 🌐
4. Payout status and history 📊
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import Optional, List, Dict
from datetime import datetime
import uuid
import asyncio

from models.gig_protect_model import (
    QuickQuoteRequest, QuickQuoteResponse,
    PolicyPurchaseRequest, PolicyPurchaseResponse,
    PolicyRenewalRequest, PolicyRenewalResponse,
    RenewalQuoteRequest, RenewalQuoteResponse,
    Policy, PolicyStatus, PayoutStatus,
    DisruptionEvent, AutoPayout, EventType,
    PayoutWebhookEvent, RiderPolicyHistory
)
from services.premium_calculator_service import (
    calculate_quick_quote, PremiumCalculator
)
from services.parametric_trigger_service import ParametricTriggerEngine
from services.earning_velocity_service import get_or_calculate_earning_velocity
from services.civic_risk_service import get_or_calculate_civic_risk
from db.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/gig-protect", tags=["gig-protect"])


# ============================================================================
# PUBLIC ENDPOINTS - Quote & Policy Purchase
# ============================================================================

@router.post("/quick-quote")
async def get_quick_quote(request: QuickQuoteRequest):
    """
    GIG PROTECT: Get instant smart coverage quote
    
    Shows you exactly what you're covered for:
    - Your earning velocity (₹/hour based on your history)
    - Weather + Civic risk probabilities 🌐
    - Premium breakdown with full transparency
    - Risk multiplier components (unpredictability + fraud buffer)
    """
    try:
        quote_dict = await calculate_quick_quote(
            rider_id=request.rider_id,
            zone_id=request.zone_id,
            coverage_amount=request.custom_coverage
        )
        
        if not quote_dict:
            raise HTTPException(status_code=400, detail="Unable to generate quote")
        
        return quote_dict
        
    except Exception as e:
        print(f"[ERROR] Error generating quote: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Quote generation failed: {str(e)}")


@router.post("/purchase-policy", response_model=PolicyPurchaseResponse)
async def purchase_policy(request: PolicyPurchaseRequest, background_tasks: BackgroundTasks):
    """
    Purchase a policy for a rider
    
    Process:
    1. Validate quote still valid
    2. Check rider wallet sufficient balance
    3. Create policy record
    4. Deduct premium from wallet
    5. Start parametric monitoring
    """
    try:
        supabase = get_supabase_client()
        
        # Step 1: Verify user exists and has wallet
        user_response = supabase.table("users").select("id, wallet_balance").filter(
            "id", "eq", request.rider_id
        ).execute()
        
        if not user_response.data:
            raise HTTPException(status_code=404, detail="Rider not found")
        
        user = user_response.data[0]
        wallet_balance = float(user.get("wallet_balance", 0))
        
        # Step 2: Get quote to extract premium
        quote_dict = await calculate_quick_quote(
            rider_id=request.rider_id,
            zone_id=request.zone_id
        )
        
        if not quote_dict:
            raise HTTPException(status_code=400, detail="Unable to regenerate quote")
        
        total_premium = float(quote_dict["total_premium"])
        
        # Step 3: Check wallet balance
        if wallet_balance < total_premium:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient wallet balance. Required: ₹{total_premium}, Available: ₹{wallet_balance}"
            )
        
        # Step 4: Create policy record
        policy_id = f"policy_{uuid.uuid4().hex[:12]}"
        
        velocity = await get_or_calculate_earning_velocity(request.rider_id)
        weather_prob, _ = await _get_weather_for_zone(request.zone_id)
        civic_prob, _ = await get_or_calculate_civic_risk(request.zone_id)
        
        policy_data = {
            "policy_id": policy_id,
            "rider_id": request.rider_id,
            "zone_id": request.zone_id,
            "coverage_amount": float(quote_dict["coverage_amount"]),
            "earning_velocity_locked": velocity.earning_velocity if velocity else 100,
            "premium_paid": total_premium,
            "platform_fee_paid": 10.0,
            "total_cost": total_premium,
            "weather_probability_at_purchase": weather_prob,
            "civic_probability_at_purchase": civic_prob,
            "risk_multiplier_at_purchase": quote_dict["risk_components"].get("risk_multiplier", 1.05),
            "event_types_covered": list(EventType.__members__.keys()),
            "status": PolicyStatus.ACTIVE.value,
            "payouts_triggered": 0,
            "total_payout_amount": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("policies").insert(policy_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create policy")
        
        # Step 5: Deduct premium from wallet
        new_balance = wallet_balance - total_premium
        supabase.table("users").update({"wallet_balance": new_balance}).filter(
            "id", "eq", request.rider_id
        ).execute()
        
        # Step 6: Create transaction record
        transaction_data = {
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "rider_id": request.rider_id,
            "type": "premium_payment",
            "amount": total_premium,
            "reference_id": policy_id,
            "status": "completed",
            "created_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("transactions").insert(transaction_data).execute()
        
        # Step 7: Start monitoring in background
        background_tasks.add_task(_start_policy_monitoring, policy_id)
        
        return PolicyPurchaseResponse(
            policy_id=policy_id,
            policy=policy_data,
            wallet_deduction=total_premium,
            confirmation_message=f"✅ GIG PROTECT activated! You're covered for ₹{quote_dict['coverage_amount']} this week. Auto-payouts trigger when disruptions hit. Zero claims hassle."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error purchasing policy: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Policy purchase failed: {str(e)}")


# ============================================================================
# RIDER DASHBOARD - Policy & Payout History
# ============================================================================

@router.get("/rider/{rider_id}/policies")
async def get_rider_policies(rider_id: str):
    """
    Get all policies for a rider
    Shows active, expired, and claimed policies
    """
    try:
        # Return mock data for demo (database tables will be created later)
        from datetime import datetime, timedelta
        current_time = datetime.utcnow()
        
        mock_policies = [
            {
                "policy_id": f"POL_{rider_id}_001",
                "rider_id": rider_id,
                "zone_id": "zone_456",
                "coverage_amount": 5000,
                "premium_paid": 500,
                "purchase_timestamp": (current_time - timedelta(days=7)).isoformat(),
                "activation_timestamp": (current_time - timedelta(days=7)).isoformat(),
                "expiry_timestamp": (current_time + timedelta(days=7)).isoformat(),
                "is_active": True,
                "risk_profile": {
                    "risk_multiplier": 1.15,
                    "weather_probability": 0.35,
                    "civic_probability": 0.20
                }
            },
            {
                "policy_id": f"POL_{rider_id}_002",
                "rider_id": rider_id,
                "zone_id": "zone_456",
                "coverage_amount": 4000,
                "premium_paid": 380,
                "purchase_timestamp": (current_time - timedelta(days=14)).isoformat(),
                "activation_timestamp": (current_time - timedelta(days=14)).isoformat(),
                "expiry_timestamp": (current_time - timedelta(days=7)).isoformat(),
                "is_active": False,
                "risk_profile": {
                    "risk_multiplier": 1.10,
                    "weather_probability": 0.30,
                    "civic_probability": 0.18
                }
            }
        ]
        
        active = [p for p in mock_policies if p.get("is_active")]
        expired = [p for p in mock_policies if not p.get("is_active")]
        
        return {
            "total_policies": len(mock_policies),
            "active_policies": len(active),
            "expired_policies": len(expired),
            "claimed_policies": 0,
            "policies": {
                "active": active,
                "expired": expired,
                "claimed": []
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rider/{rider_id}/payouts")
async def get_rider_payouts(rider_id: str, limit: int = 50):
    """
    Get payout history for rider
    Shows all auto-triggered payouts (zero-touch claims)
    """
    try:
        # Return mock data for demo (database tables will be created later)
        from datetime import datetime, timedelta
        current_time = datetime.utcnow()
        
        mock_payouts = [
            {
                "payout_id": f"PAYOUT_{rider_id}_001",
                "policy_id": f"POL_{rider_id}_001",
                "disruption_event_id": "EVENT_RAIN_001",
                "payout_amount": 1250,
                "payout_trigger_reason": "Heavy rainfall detected - Zone H3 disruption confirmed",
                "timestamp": (current_time - timedelta(days=2)).isoformat(),
                "status": "completed",
                "delivery_address": "123 Main St, Bangalore"
            },
            {
                "payout_id": f"PAYOUT_{rider_id}_002",
                "policy_id": f"POL_{rider_id}_001",
                "disruption_event_id": "EVENT_CURFEW_001",
                "payout_amount": 2100,
                "payout_trigger_reason": "Civic curfew declared - 2 hrs delivery disruption",
                "timestamp": (current_time - timedelta(days=5)).isoformat(),
                "status": "completed",
                "delivery_address": "123 Main St, Bangalore"
            }
        ]
        
        total_payouts = len(mock_payouts)
        total_amount = sum([float(p.get("payout_amount", 0)) for p in mock_payouts])
        
        processed = [p for p in mock_payouts if p.get("status") in ["completed"]]
        pending = [p for p in mock_payouts if p.get("status") in ["pending"]]
        
        return {
            "total_payouts": total_payouts,
            "total_payout_amount": round(total_amount, 2),
            "payouts_processed": len(processed),
            "payouts_pending": len(pending),
            "payouts_failed": 0,
            "status_distribution": {
                "completed": len(processed),
                "pending": len(pending),
                "failed": 0
            },
            "payouts": mock_payouts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rider/{rider_id}/stats")
async def get_rider_stats(rider_id: str):
    """
    Get comprehensive statistics about rider's policies and payouts
    """
    try:
        supabase = get_supabase_client()
        
        # Get policies
        policies_response = supabase.table("policies").select("coverage_amount, premium_paid").filter(
            "rider_id", "eq", rider_id
        ).execute()
        
        policies = policies_response.data if policies_response.data else []
        
        # Get payouts
        payouts_response = supabase.table("auto_payouts").select("payout_amount, status").filter(
            "rider_id", "eq", rider_id
        ).execute()
        
        payouts = payouts_response.data if payouts_response.data else []
        
        # Calculate statistics
        total_coverage = sum([float(p.get("coverage_amount", 0)) for p in policies])
        total_premiums = sum([float(p.get("premium_paid", 0)) for p in policies])
        total_payouts = sum([float(p.get("payout_amount", 0)) for p in payouts])
        
        processed_payouts = [p for p in payouts if p.get("status") in ["processed", "completed"]]
        total_received = sum([float(p.get("payout_amount", 0)) for p in processed_payouts])
        
        roi = (total_received - total_premiums) / total_premiums * 100 if total_premiums > 0 else 0
        
        return RiderPolicyHistory(
            rider_id=rider_id,
            total_policies_purchased=len(policies),
            total_premiums_paid=round(total_premiums, 2),
            total_coverage_amount=round(total_coverage, 2),
            total_payouts=len(processed_payouts),
            total_payout_amount=round(total_received, 2),
            average_payout_size=round(total_received / len(processed_payouts), 2) if processed_payouts else 0,
            claim_to_premium_ratio=round(total_received / total_premiums, 2) if total_premiums > 0 else 0
        ).dict()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ADMIN ENDPOINTS - Disruption Monitoring & Testing
# ============================================================================

@router.post("/admin/simulate-disruption")
async def simulate_disruption(
    zone_id: str,
    event_type: str = "heavy_rainfall",
    event_probability: float = 0.8
):
    """
    TESTING ONLY: Simulate a disruption event
    Triggers payouts for affected policies
    """
    try:
        # Mock simulation for testing
        result = {
            "payouts_triggered": 3,
            "total_payout": 5200.50,
            "policies_affected": [
                "policy_abc123",
                "policy_def456", 
                "policy_ghi789"
            ]
        }
        
        return {
            "status": "success",
            "simulation_result": result,
            "message": f"Simulated {event_type} in {zone_id}: {result['payouts_triggered']} policies triggered"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/zone/{zone_id}/stats")
async def get_zone_statistics(zone_id: str):
    """
    Get zone statistics: active policies, total coverage, payout rate
    """
    try:
        supabase = get_supabase_client()
        
        # Get active policies in zone
        policies_response = supabase.table("policies").select(
            "policy_id, coverage_amount, premium_paid, status"
        ).filter("zone_id", "eq", zone_id).filter(
            "status", "eq", PolicyStatus.ACTIVE.value
        ).execute()
        
        policies = policies_response.data if policies_response.data else []
        
        # Get payouts in zone
        payouts_response = supabase.table("auto_payouts").select(
            "payout_id, payout_amount, status"
        ).filter("zone_id", "eq", zone_id).execute()
        
        payouts = payouts_response.data if payouts_response.data else []
        
        active_coverage = sum([float(p.get("coverage_amount", 0)) for p in policies])
        total_premiums = sum([float(p.get("premium_paid", 0)) for p in policies])
        total_payouts = sum([float(p.get("payout_amount", 0)) for p in payouts])
        
        return {
            "zone_id": zone_id,
            "active_policies": len(policies),
            "total_coverage_pool": round(active_coverage, 2),
            "total_premiums_collected": round(total_premiums, 2),
            "total_payouts_dispersed": round(total_payouts, 2),
            "payout_rate": round(total_payouts / total_premiums * 100, 2) if total_premiums > 0 else 0,
            "combined_loss_ratio": round(total_payouts / active_coverage * 100, 2) if active_coverage > 0 else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# INTERNAL HELPERS
# ============================================================================

async def _get_weather_for_zone(zone_id: str) -> tuple:
    """Helper to get weather probability for a zone"""
    try:
        from services.weather_service import check_disruption
        disruption = await check_disruption(zone_id)
        weather_prob = disruption.get("weather_severity", 30) / 100 if disruption else 0.2
        return weather_prob, disruption
    except:
        return 0.2, {}


async def _start_policy_monitoring(policy_id: str):
    """
    Background task: Start monitoring policy for disruption events
    In production: Would listen to real-time event stream
    """
    try:
        supabase = get_supabase_client()
        
        # For now, just log that monitoring started
        print(f"[INFO] Started monitoring for policy {policy_id}")
        
        # In production:
        # 1. Subscribe to disruption event stream
        # 2. Check if event affects policy zone
        # 3. Call ParametricTriggerService.process_disruption_event()
        
    except Exception as e:
        print(f"[ERROR] Error starting policy monitoring: {str(e)}")




# ============================================================================
# POLICY RENEWAL - Weekly Renewable Insurance
# ============================================================================

@router.post("/renew-quote")
async def get_renewal_quote(request: RenewalQuoteRequest):
    """
    Get a renewal quote for an expiring/expired policy
    Shows updated GigScore discount and new premium
    
    Use Case:
    - Policy expiring in 3 days → show renewal option
    - Policy expired → allow renewal within grace period
    - GigScore improved → show savings/discount
    """
    try:
        supabase = get_supabase_client()
        
        # Get current policy
        policy_response = supabase.table("policies").select(
            "*, gigscore_at_purchase, renewal_count, premium_paid, discount_percentage, gig_score_at_purchase"
        ).filter(
            "policy_id", "eq", request.policy_id
        ).eq("rider_id", request.rider_id).execute()
        
        if not policy_response.data:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        current_policy = policy_response.data[0]
        previous_gigscore = current_policy.get("gigscore_at_purchase", 65)
        previous_premium = float(current_policy.get("premium_paid", 500))
        
        # Get updated GigScore
        gigscore_resp = supabase.table("gigscore").select("score").filter(
            "uid", "eq", request.rider_id
        ).execute()
        
        current_gigscore = 65
        if gigscore_resp.data:
            current_gigscore = gigscore_resp.data[0].get("score", 65)
        
        # Calculate new renewal premium with updated GigScore
        from services.premium_calculator_service import PremiumCalculator
        
        renewal_count = current_policy.get("renewal_count", 0) + 1
        new_quote = await PremiumCalculator.generate_quote(
            rider_id=request.rider_id,
            zone_id=current_policy.get("zone_id"),
            coverage_amount=float(current_policy.get("coverage_amount", 5000)),
            renewal_count=renewal_count
        )
        
        new_premium = new_quote["premium_breakdown"]["final_premium"]
        new_discount = new_quote["premium_breakdown"]["discount_percentage"]
        savings = previous_premium - new_premium
        
        # Calculate days until expiry
        from datetime import datetime as dt
        policy_end = dt.fromisoformat(str(current_policy.get("policy_end_date")))
        days_until_expiry = (policy_end - dt.utcnow()).days
        if days_until_expiry < 0:
            days_until_expiry = 0  # Already expired
        
        # Build message
        gigscore_change = current_gigscore - previous_gigscore
        if gigscore_change > 0:
            message = f"🎉 Your GigScore improved by {gigscore_change}! Get {new_discount}% discount. New premium: ₹{new_premium} (Save ₹{savings})"
        elif gigscore_change == 0:
            message = f"Steady performance! Renew at ₹{new_premium} with {new_discount}% discount"
        else:
            message = f"Renew your coverage at ₹{new_premium} for continued protection"
        
        return RenewalQuoteResponse(
            policy_id=request.policy_id,
            current_gigscore=current_gigscore,
            previous_gigscore=previous_gigscore,
            previous_premium=previous_premium,
            new_premium=new_premium,
            discount_percentage=new_discount,
            savings=savings,
            days_until_expiry=max(0, days_until_expiry),
            renewal_date_recommended=policy_end,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error generating renewal quote: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Renewal quote failed: {str(e)}")


@router.post("/renew-policy", response_model=PolicyRenewalResponse)
async def renew_policy(request: PolicyRenewalRequest, background_tasks: BackgroundTasks):
    """
    Renew an expiring/expired policy
    
    Process:
    1. Get current policy details
    2. Calculate new premium with updated GigScore
    3. Check wallet balance
    4. Create new policy record
    5. Deduct premium from wallet
    6. Archive old policy
    """
    try:
        supabase = get_supabase_client()
        
        # Step 1: Get current policy
        policy_response = supabase.table("policies").select("*").filter(
            "policy_id", "eq", request.policy_id
        ).eq("rider_id", request.rider_id).execute()
        
        if not policy_response.data:
            raise HTTPException(status_code=404, detail="Policy not found for renewal")
        
        old_policy = policy_response.data[0]
        old_premium = float(old_policy.get("premium_paid", 0))
        old_renewal_count = old_policy.get("renewal_count", 0)
        old_gigscore = old_policy.get("gigscore_at_purchase", 65)
        
        # Step 2: Get rider wallet
        user_response = supabase.table("users").select("id, wallet_balance").filter(
            "id", "eq", request.rider_id
        ).execute()
        
        if not user_response.data:
            raise HTTPException(status_code=404, detail="Rider not found")
        
        user = user_response.data[0]
        wallet_balance = float(user.get("wallet_balance", 0))
        
        # Step 3: Calculate new premium
        from services.premium_calculator_service import PremiumCalculator
        
        coverage_amount = request.coverage_amount or float(old_policy.get("coverage_amount", 5000))
        renewal_count = old_renewal_count + 1
        
        new_quote = await PremiumCalculator.generate_quote(
            rider_id=request.rider_id,
            zone_id=old_policy.get("zone_id"),
            coverage_amount=coverage_amount,
            renewal_count=renewal_count
        )
        
        new_premium = new_quote["premium_breakdown"]["final_premium"]
        new_discount_pct = new_quote["premium_breakdown"]["discount_percentage"]
        
        # Get fresh GigScore
        gigscore_resp = supabase.table("gigscore").select("score").filter(
            "uid", "eq", request.rider_id
        ).execute()
        
        current_gigscore = 65
        if gigscore_resp.data:
            current_gigscore = gigscore_resp.data[0].get("score", 65)
        
        # Step 4: Check wallet
        if wallet_balance < new_premium:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient balance. Need ₹{new_premium}, Have ₹{wallet_balance}"
            )
        
        # Step 5: Create new policy
        new_policy_id = f"policy_{uuid.uuid4().hex[:12]}"
        from datetime import datetime, timedelta
        
        new_policy_data = {
            "policy_id": new_policy_id,
            "rider_id": request.rider_id,
            "zone_id": old_policy.get("zone_id"),
            "coverage_amount": coverage_amount,
            "earning_velocity_locked": old_policy.get("earning_velocity_locked", 100),
            "premium_paid": new_premium,
            "platform_fee_paid": 10.0,
            "total_cost": new_premium,
            "weather_probability_at_purchase": new_quote["risk_profile"]["weather_probability"],
            "civic_probability_at_purchase": new_quote["risk_profile"]["civic_probability"],
            "risk_multiplier_at_purchase": 1.05,
            "event_types_covered": old_policy.get("event_types_covered", []),
            "status": "active",
            "payouts_triggered": 0,
            "total_payout_amount": 0,
            "gigscore_at_purchase": current_gigscore,
            "discount_percentage": new_discount_pct,
            "renewal_count": renewal_count,
            "last_renewal_date": datetime.utcnow().isoformat(),
            "renewal_multiplier": PremiumCalculator.calculate_renewal_multiplier(renewal_count),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "policy_start_date": datetime.utcnow().isoformat(),
            "policy_end_date": (datetime.utcnow() + timedelta(days=7)).isoformat()
        }
        
        response = supabase.table("policies").insert(new_policy_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create renewal policy")
        
        # Step 6: Deduct from wallet
        new_balance = wallet_balance - new_premium
        supabase.table("users").update({"wallet_balance": new_balance}).filter(
            "id", "eq", request.rider_id
        ).execute()
        
        # Step 7: Record transaction
        transaction_data = {
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "rider_id": request.rider_id,
            "type": "policy_renewal",
            "amount": new_premium,
            "reference_id": new_policy_id,
            "status": "completed",
            "created_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("transactions").insert(transaction_data).execute()
        
        # Step 8: Archive old policy (update status)
        supabase.table("policies").update({"status": "renewed"}).filter(
            "policy_id", "eq", request.policy_id
        ).execute()
        
        return PolicyRenewalResponse(
            new_policy_id=new_policy_id,
            previous_policy_id=request.policy_id,
            renewal_count=renewal_count,
            gigscore_at_renewal=current_gigscore,
            old_premium=old_premium,
            new_premium=new_premium,
            discount_percentage=new_discount_pct,
            gig_score_improvement=current_gigscore - old_gigscore,
            policy_start_date=new_policy_data["policy_start_date"],
            policy_end_date=new_policy_data["policy_end_date"],
            confirmation_message=f"✅ Policy renewed! New premium: ₹{new_premium} with {new_discount_pct}% discount. Coverage: ₹{coverage_amount} for 7 days."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error renewing policy: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Policy renewal failed: {str(e)}")


@router.get("/health")

async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "winkit-parametric-insurance"}
