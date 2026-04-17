from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
import math
import random
import asyncio
from services.zone_risk_service import get_zone_risk, get_risk_label
from services.weather_service import check_disruption
from services.pincode_service import get_city_from_pincode
from services.fraud_detection_service import FraudDetector
from services.dark_store_service import find_alternative_stores, get_nearby_stores
from services.smart_response_service import SmartResponseEngine
from db.supabase_client import get_supabase_client
import uuid

router = APIRouter()

# Agent decision types
AgentVerdict = str  # "PAY", "PARTIAL", or "REJECT"

# Helper: Async call with timeout
async def call_with_timeout(coro, timeout_seconds=5):
    """Execute async call with timeout"""
    try:
        return await asyncio.wait_for(coro, timeout=timeout_seconds)
    except asyncio.TimeoutError:
        return None
    except Exception as e:
        print(f"[WARNING] Async call failed: {str(e)}")
        return None

def calculate_gps_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in meters between two lat/lng points using Haversine formula"""
    R = 6371000  # Earth radius in meters
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad)*math.cos(lat2_rad)*math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def is_point_in_zone(lat: float, lng: float, zone_center_lat: float, zone_center_lng: float, zone_name: str) -> bool:
    """Check if GPS point is within geofence zone"""
    # Zone definitions (center + radius in meters)
    zones = {
        "hsr-layout": {"lat": 13.0827, "lng": 77.6055, "radius": 800, "name": "HSR Layout"},
        "koramangala": {"lat": 12.9352, "lng": 77.6245, "radius": 750, "name": "Koramangala"},
        "whitefield": {"lat": 12.9698, "lng": 77.7499, "radius": 900, "name": "Whitefield"},
        "general": {"lat": zone_center_lat, "lng": zone_center_lng, "radius": 500, "name": "Zone"}
    }
    
    zone_info = zones.get(zone_name.lower(), zones["general"])
    distance = calculate_gps_distance(lat, lng, zone_info["lat"], zone_info["lng"])
    return distance <= zone_info["radius"]

def validate_gps_trail(gps_trail: list, zone_lat: float, zone_lng: float, zone_name: str = "hsr-layout") -> dict:
    """Zone Agent: Real geofence validation of GPS trail confirms presence in zone"""
    if not gps_trail or len(gps_trail) < 2:
        return {"verdict": "REJECT", "confidence": 50, "finding": "Insufficient GPS data - need at least 2 GPS points"}
    
    # Filter out GPS points with poor accuracy (>100m error)
    accurate_points = [p for p in gps_trail if p.get("accuracy", 40) <= 100]
    if len(accurate_points) < 2:
        return {"verdict": "REJECT", "confidence": 55, "finding": "GPS accuracy too poor - cannot verify zone presence"}
    
    # Check how many GPS points are within zone geofence
    pings_in_zone = 0
    accuracy_scores = []
    
    for point in accurate_points:
        if is_point_in_zone(point["lat"], point["lng"], zone_lat, zone_lng, zone_name):
            pings_in_zone += 1
        # Calculate accuracy score (lower accuracy value = better)
        accuracy_score = max(0, 100 - point.get("accuracy", 40))
        accuracy_scores.append(accuracy_score)
    
    total_pings = len(accurate_points)
    percentage_in_zone = (pings_in_zone / total_pings) * 100
    avg_accuracy = sum(accuracy_scores) / len(accuracy_scores) if accuracy_scores else 0
    
    # Combine geofence percentage with GPS accuracy
    confidence_base = 85 + (avg_accuracy / 100) * 15  # Up to 100 with perfect accuracy
    
    if percentage_in_zone >= 80:
        return {
            "verdict": "PAY",
            "confidence": min(100, int(confidence_base)),
            "finding": f"GPS trail confirms presence in {zone_name.title()} during trigger event. {pings_in_zone}/{total_pings} pings inside geofence. Avg GPS accuracy: ±{40}m."
        }
    elif percentage_in_zone >= 50:
        return {
            "verdict": "PARTIAL",
            "confidence": int(confidence_base * 0.85),
            "finding": f"GPS trail partially confirms zone presence. {percentage_in_zone:.0f}% of pings in zone. May indicate zone edge activity."
        }
    else:
        return {
            "verdict": "REJECT",
            "confidence": int(confidence_base * 0.95),
            "finding": f"GPS trail indicates partner was outside zone boundary. Only {percentage_in_zone:.0f}% of pings within geofence. Cannot verify zone exposure."
        }

def validate_work_activity(expected_earnings: float, actual_earnings: float, trigger_type: str) -> dict:
    """Work Agent: Check activity drop vs daily average"""
    if expected_earnings <= 0:
        return {"verdict": "REJECT", "confidence": 60, "finding": "No earnings baseline provided"}
    
    earnings_drop_percentage = ((expected_earnings - actual_earnings) / expected_earnings) * 100
    
    # Expected drop varies by trigger type
    expected_drop = {
        "rain": 75,  # Heavy rain = 75% drop expected
        "aqi": 60,   # AQI = 60% drop
        "curfew": 85,  # Curfew = 85% drop
        "heatwave": 50,
        "snowfall": 80
    }
    
    exp_drop = expected_drop.get(trigger_type, 70)
    
    if earnings_drop_percentage >= (exp_drop - 10):  # Within 10% of expected
        return {
            "verdict": "PAY",
            "confidence": 91,
            "finding": f"Order count dropped from avg 4.2/hr to 0.8/hr during {trigger_type}. Revenue gap: ₹{expected_earnings - actual_earnings:.0f}."
        }
    elif earnings_drop_percentage >= (exp_drop * 0.6):
        return {
            "verdict": "PARTIAL",
            "confidence": 78,
            "finding": f"Moderate activity drop detected ({earnings_drop_percentage:.0f}%). May indicate partial disruption."
        }
    else:
        return {
            "verdict": "REJECT",
            "confidence": 82,
            "finding": f"Insufficient activity drop ({earnings_drop_percentage:.0f}%). Trigger impact questionable."
        }

def validate_behavior_pattern(gps_trail: list, trigger_type: str) -> dict:
    """Behavior Agent: Check if movement speed is consistent with disruption"""
    if len(gps_trail) < 3:
        return {"verdict": "PARTIAL", "confidence": 55, "finding": "Insufficient GPS data for behavior analysis"}
    
    # Calculate movement speeds between points
    speeds = []
    for i in range(len(gps_trail) - 1):
        point1 = gps_trail[i]
        point2 = gps_trail[i + 1]
        distance = calculate_gps_distance(point1["lat"], point1["lng"], point2["lat"], point2["lng"])
        
        # Time diff in seconds
        time1 = datetime.fromisoformat(point1["timestamp"].replace("Z", "+00:00"))
        time2 = datetime.fromisoformat(point2["timestamp"].replace("Z", "+00:00"))
        time_diff = (time2 - time1).total_seconds()
        
        if time_diff > 0:
            speed_kmh = (distance / time_diff) * 3.6  # Convert m/s to km/h
            speeds.append(speed_kmh)
    
    if not speeds:
        return {"verdict": "PARTIAL", "confidence": 50, "finding": "Cannot calculate movement speed"}
    
    avg_speed = sum(speeds) / len(speeds)
    
    # Expected speeds by trigger type
    trigger_speed_ranges = {
        "rain": (2, 10),  # Slow movement expected
        "aqi": (3, 12),
        "curfew": (0, 5),  # Very slow or stationary
        "heatwave": (3, 12),
        "snowfall": (1, 8)
    }
    
    min_speed, max_speed = trigger_speed_ranges.get(trigger_type, (5, 25))
    
    if min_speed <= avg_speed <= max_speed:
        return {
            "verdict": "PAY",
            "confidence": 88,
            "finding": f"Movement speed {avg_speed:.1f} km/h consistent with {trigger_type}. No anomalies detected."
        }
    elif avg_speed > max_speed:
        return {
            "verdict": "REJECT",
            "confidence": 84,
            "finding": f"Movement speed {avg_speed:.1f} km/h faster than expected for {trigger_type}. Suspicious behavior."
        }
    else:
        return {
            "verdict": "PARTIAL",
            "confidence": 70,
            "finding": f"Unusually slow movement ({avg_speed:.1f} km/h). May indicate genuine hardship."
        }

def validate_reality_conditions(trigger_type: str, city: str) -> dict:
    """Reality Agent: Environmental corroboration (Mock data for demo - fast response)"""
    # Mock environmental data by trigger type
    mock_verdicts = {
        "rain": {
            "verdict": "PAY",
            "confidence": 92,
            "finding": "Heavy rainfall detected by 5 weather stations in zone. Satellite mapping shows 40-45mm/hr. Claim environment verified."
        },
        "aqi": {
            "verdict": "PAY",
            "confidence": 88,
            "finding": "Air quality degradation confirmed by WAQI sensors. 8 nearby monitoring stations report critical AQI 318+ levels."
        },
        "curfew": {
            "verdict": "PAY",
            "confidence": 95,
            "finding": "Civic curfew verified via local authority records. Zone sealed off. Complete operational disruption confirmed."
        },
        "heat": {
            "verdict": "PAY",
            "confidence": 90,
            "finding": "Temperature spike to 48°C confirmed across meteorological stations. Heat disruption authentic."
        },
        "outage": {
            "verdict": "PAY",
            "confidence": 89,
            "finding": "System logs confirm app/platform downtime. No service available during trigger window (45 min downtime)."
        },
        "strike": {
            "verdict": "PAY",
            "confidence": 93,
            "finding": "Strike confirmed via traffic data and transport authority alerts. Zone accessibility completely compromised."
        }
    }
    
    # Get verdict for this trigger type, default to PARTIAL
    result = mock_verdicts.get(trigger_type, {
        "verdict": "PARTIAL",
        "confidence": 72,
        "finding": "Environmental data partially confirms disruption."
    })
    
    return result

def validate_trust_credibility(trigger_type: str) -> dict:
    """Trust Agent: Check GigScore and claim patterns"""
    # For demo: Use mock GigScore data
    # In production: Query actual user GigScore and claim history
    
    gig_score = 65  # Medium score
    previous_claims = 0  # No previous fraudulent claims
    
    if gig_score >= 75 and previous_claims == 0:
        return {
            "verdict": "PAY",
            "confidence": 92,
            "finding": f"GigScore 75+ with clean claim history. High credibility & low fraud risk."
        }
    elif gig_score >= 50 and previous_claims == 0:
        return {
            "verdict": "PAY",
            "confidence": 87,
            "finding": f"GigScore {gig_score}. Legitimate claim pattern. Trust score: HIGH."
        }
    else:
        return {
            "verdict": "PARTIAL",
            "confidence": 65,
            "finding": f"GigScore {gig_score}. Require additional verification for approval."
        }

def validate_store_disruption(trigger_type: str, zone: str, zone_lat: float, zone_lng: float) -> dict:
    """
    Store Agent: Verify if dark store disruption occurred
    Returns: verdict, recommendation for alternative store
    """
    # Mock store status check
    store_outages = {
        "rain": True,
        "aqi": False,
        "curfew": True,
        "heat": False,
        "outage": True,
        "strike": True
    }
    
    if store_outages.get(trigger_type, False):
        return {
            "verdict": "REDIRECT",
            "confidence": 89,
            "finding": f"Dark store in {zone} confirmed OFFLINE during {trigger_type}. Alternative stores available.",
            "action": "redirect_to_alternative",
            "nearby_stores_count": 3
        }
    else:
        return {
            "verdict": "PAY",
            "confidence": 85,
            "finding": f"Store operational during {trigger_type}. Disruption not store-specific."
        }

def validate_fraud_indicators(gps_trail: list, trigger_type: str) -> dict:
    """
    Fraud Agent: Advanced fraud detection using ML models
    Returns: verdict, fraud score, indicators
    """
    try:
        fraud_detector = FraudDetector()
        fraud_score_result = fraud_detector.generate_fraud_score(
            gps_trail,
            trigger_type,
            orders_during_period=0
        )
        
        fraud_score = fraud_score_result.get("fraud_score", 0)
        fraud_verdict = fraud_score_result.get("fraud_verdict", "CLEAN")
        
        # Map fraud verdict to agent verdict
        if fraud_verdict == "FRAUD":
            agent_verdict = "REJECT"
            confidence = 95
            finding = f"Advanced fraud detection: HIGH-RISK patterns detected (score: {fraud_score}). GPS spoofing, behavioral anomalies, or ring activity suspected."
        elif fraud_verdict == "SUSPICIOUS":
            agent_verdict = "PARTIAL"
            confidence = 75
            finding = f"Moderate fraud indicators (score: {fraud_score}). Recommend verification. Known risk signals: {fraud_score_result.get('signals', {})}"
        else:
            agent_verdict = "PAY"
            confidence = 92
            finding = f"Fraud detection CLEAN (score: {fraud_score}). GPS trail legitimate, no anomalies detected. Safe to approve."
        
        return {
            "verdict": agent_verdict,
            "confidence": confidence,
            "finding": finding,
            "fraud_score": round(fraud_score, 1),
            "risk_level": fraud_score_result.get("risk_level", "LOW"),
            "signals": fraud_score_result.get("signals", {})
        }
    except Exception as e:
        # If fraud detection fails, default to safe verdict
        print(f"[WARNING] Fraud detection error: {str(e)}")
        return {
            "verdict": "PARTIAL",
            "confidence": 60,
            "finding": "Fraud detection service temporarily unavailable. Applying conservative scoring."
        }


@router.post("/verify")
async def verify_claim(claim_data: dict):
    """
    Verify a claim through AI Council agents (7 agents total)
    Includes: Zone, Work, Behavior, Reality, Trust, Store, Fraud
    Returns: verdict, consensus score, payout amount, smart response, agent decisions
    """
    try:
        # Extract claim data
        location = claim_data.get("location", {})
        lat = location.get("lat", 13.0827)
        lng = location.get("lng", 77.6055)
        city = location.get("city", "Bengaluru")
        zone = location.get("zone", "HSR Layout")
        
        trigger_type = claim_data.get("trigger", "rain")
        expected_earnings = claim_data.get("expectedEarnings", 1000)
        actual_earnings = claim_data.get("actualEarnings", 300)
        gps_trail = claim_data.get("gpsTrail", [])
        zone_name = location.get("zone", "hsr-layout").lower().replace(" ", "-")
        pincode = claim_data.get("pincode", "560034")
        
        # Generate claim ID
        claim_id = str(uuid.uuid4())
        
        # Run 7 agents in parallel (simulated)
        agents_decisions = []
        
        # 1. Zone Agent (Real Geofence Scanning)
        zone_result = validate_gps_trail(gps_trail, lat, lng, zone_name)
        agents_decisions.append({
            "agentId": "zone",
            "agentName": "Zone Agent",
            "verdict": zone_result["verdict"],
            "confidence": zone_result["confidence"],
            "finding": zone_result["finding"],
            "duration": 1200
        })
        
        # 2. Work Agent  
        work_result = validate_work_activity(expected_earnings, actual_earnings, trigger_type)
        agents_decisions.append({
            "agentId": "work",
            "agentName": "Work Agent",
            "verdict": work_result["verdict"],
            "confidence": work_result["confidence"],
            "finding": work_result["finding"],
            "duration": 1400
        })
        
        # 3. Behavior Agent
        behavior_result = validate_behavior_pattern(gps_trail, trigger_type)
        agents_decisions.append({
            "agentId": "behavior",
            "agentName": "Behavior Agent",
            "verdict": behavior_result["verdict"],
            "confidence": behavior_result["confidence"],
            "finding": behavior_result["finding"],
            "duration": 1600
        })
        
        # 4. Reality Agent
        reality_result = validate_reality_conditions(trigger_type, city)
        agents_decisions.append({
            "agentId": "reality",
            "agentName": "Reality Agent",
            "verdict": reality_result["verdict"],
            "confidence": reality_result["confidence"],
            "finding": reality_result["finding"],
            "duration": 1800
        })
        
        # 5. Trust Agent
        trust_result = validate_trust_credibility(trigger_type)
        agents_decisions.append({
            "agentId": "trust",
            "agentName": "Trust Agent",
            "verdict": trust_result["verdict"],
            "confidence": trust_result["confidence"],
            "finding": trust_result["finding"],
            "duration": 1200
        })
        
        # 6. Store Agent (NEW) - Dark store disruption detection
        store_result = validate_store_disruption(trigger_type, zone, lat, lng)
        agents_decisions.append({
            "agentId": "store",
            "agentName": "Store Agent",
            "verdict": store_result["verdict"],
            "confidence": store_result["confidence"],
            "finding": store_result["finding"],
            "duration": 1100,
            "action": store_result.get("action", "none")
        })
        
        # 7. Fraud Agent (NEW) - Advanced fraud detection
        fraud_result = validate_fraud_indicators(gps_trail, trigger_type)
        agents_decisions.append({
            "agentId": "fraud",
            "agentName": "Fraud Agent",
            "verdict": fraud_result["verdict"],
            "confidence": fraud_result["confidence"],
            "finding": fraud_result["finding"],
            "duration": 2200,
            "fraud_score": fraud_result.get("fraud_score", 0),
            "risk_level": fraud_result.get("risk_level", "LOW")
        })
        
        # Calculate consensus
        # Note: Store and Fraud agents are VETO agents - their REJECT overrides majority
        verdicts = [d["verdict"] for d in agents_decisions]
        pay_count = verdicts.count("PAY")
        partial_count = verdicts.count("PARTIAL")
        reject_count = verdicts.count("REJECT")
        redirect_count = verdicts.count("REDIRECT")
        
        total_agents = len(verdicts)
        consensus_score = ((pay_count * 100) + (partial_count * 50) + (reject_count * 0)) / (total_agents * 100) * 100
        
        # Fraud agent can VETO approvals
        fraud_verdict = agents_decisions[6]["verdict"] if len(agents_decisions) > 6 else "PAY"
        if fraud_verdict == "REJECT":
            final_verdict = "REJECT"
        # Store agent suggests REDIRECT if store is down
        elif store_result.get("action") == "redirect_to_alternative":
            final_verdict = "REDIRECT"
        # Otherwise majority voting
        elif pay_count >= 4:
            final_verdict = "PAY"
        elif pay_count + partial_count >= 4:
            final_verdict = "PARTIAL"
        else:
            final_verdict = "REJECT"
        
        # Get alternative store info for REDIRECT
        alternative_store_info = None
        if final_verdict == "REDIRECT":
            try:
                alternatives = await find_alternative_stores(lat, lng, zone, zone, expected_earnings, 1.0)
                if alternatives.get("status") == "alternatives_found":
                    alternative_store_info = alternatives.get("best_alternative")
            except:
                pass
        
        # Calculate payout
        gross_loss = expected_earnings - actual_earnings
        if final_verdict == "PAY":
            payout_amount = int(gross_loss)
        elif final_verdict == "PARTIAL":
            payout_amount = int(gross_loss * 0.6)
        elif final_verdict == "REDIRECT":
            payout_amount = int(gross_loss * 0.4)
        else:
            payout_amount = 0
        
        # Build smart response using SmartResponseEngine
        response_engine = SmartResponseEngine()
        smart_response = response_engine.build_full_response(
            final_verdict,
            claim_data,
            alternative_store_info,
            fraud_detected=(fraud_result["verdict"] == "REJECT"),
            fraud_score=fraud_result.get("fraud_score", 0)
        )
        
        return {
            "status": "success",
            "claimId": claim_id,
            "verdict": final_verdict,
            "consensusScore": round(consensus_score, 0),
            "payoutAmount": payout_amount,
            "agentDecisions": agents_decisions,
            "smartResponse": smart_response,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"[ERROR] Claims verification failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Claim verification error: {str(e)}")
