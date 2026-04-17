"""
ChillInsure Monitoring & Admin API Routes
Real-time zone monitoring, risk heatmaps, analytics
"""

from fastapi import APIRouter, HTTPException
from services.monitoring_service import RealtimeMonitoringService

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

# Initialize monitoring service
monitoring_service = RealtimeMonitoringService()

@router.get("/zone-risk")
async def get_zone_risk(zone: str = "HSR Layout", pincode: str = "560034"):
    """
    Get comprehensive zone risk assessment
    
    Returns:
    - Overall risk score (0-100)
    - Individual monitor statuses (weather, AQI, traffic, civic, store)
    - Active alerts
    - Recommendations
    """
    try:
        result = await monitoring_service.get_zone_risk_assessment(zone, pincode)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all-zones")
async def get_all_zones_status(zones: str = "HSR Layout,Koramangala,Whitefield"):
    """
    Get real-time risk for all zones
    Format: comma-separated zone names
    """
    try:
        zone_list = [z.strip() for z in zones.split(",")]
        result = await monitoring_service.get_all_zones_status(zone_list)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weather")
async def get_weather_status(zone: str = "HSR Layout"):
    """Get current weather in zone"""
    try:
        result = await monitoring_service.monitor_weather("Bengaluru", zone)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/aqi")
async def get_aqi_status(zone: str = "HSR Layout"):
    """Get current air quality in zone"""
    try:
        result = await monitoring_service.monitor_aqi("Bengaluru", zone)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/traffic")
async def get_traffic_status(zone: str = "HSR Layout"):
    """Get current traffic in zone"""
    try:
        result = await monitoring_service.monitor_traffic(zone)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/civic")
async def get_civic_disruptions(zone: str = "HSR Layout"):
    """Get active civic disruptions in zone"""
    try:
        result = await monitoring_service.monitor_civic_events(zone)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/store-status")
async def get_store_status(zone: str = "HSR Layout"):
    """Get dark store status in zone"""
    try:
        result = await monitoring_service.monitor_store_status(zone)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
async def get_active_alerts(zone: str = "HSR Layout"):
    """Get active disruption alerts"""
    try:
        result = await monitoring_service.get_active_disruptions(zone)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admin routes
admin_router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/heatmap")
async def get_zone_heatmap(zones: str = "HSR Layout,Koramangala,Whitefield,JP Nagar,Indiranagar,MG Road"):
    """
    Get H3 grid-like heatmap of zone risks (simplified)
    Shows which zones are high-risk
    """
    zone_list = [z.strip() for z in zones.split(",")]
    
    try:
        assessments = await monitoring_service.get_all_zones_status(zone_list)
        
        heatmap = {
            "timestamp": assessments.get("timestamp"),
            "zones": [
                {
                    "zone": z["zone"],
                    "risk_score": z.get("overall_risk_score", 0),
                    "risk_level": z.get("risk_level", "UNKNOWN"),
                    "color": _get_heatmap_color(z.get("overall_risk_score", 0)),
                    "riders_potentially_affected": _estimate_riders(z.get("overall_risk_score", 0))
                }
                for z in assessments.get("zones", [])
            ]
        }
        
        return heatmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fraud-analytics")
async def get_fraud_analytics():
    """
    Get fraud analytics and patterns
    Shows top fraud indicators, ring detection results
    """
    return {
        "timestamp": "2026-04-04T10:30:00Z",
        "fraud_metrics": {
            "total_claims_analyzed": 1250,
            "fraud_detected": 45,
            "fraud_rate_percent": 3.6,
            "suspicious_patterns": 120,
            "fraud_rings_detected": 3
        },
        "top_fraud_indicators": [
            {"indicator": "GPS Spoofing", "count": 18, "severity": "HIGH"},
            {"indicator": "Behavioral Anomaly", "count": 25, "severity": "MEDIUM"},
            {"indicator": "Fake Inactivity", "count": 12, "severity": "HIGH"},
            {"indicator": "Fraud Ring Activity", "count": 8, "severity": "CRITICAL"}
        ],
        "fraud_rings": [
            {
                "ring_id": "ring_001",
                "member_count": 5,
                "total_fraudulent_payouts": 15000,
                "status": "MONITORED"
            },
            {
                "ring_id": "ring_002",
                "member_count": 3,
                "member_uids": ["uid_897", "uid_898", "uid_899"],
                "total_fraudulent_payouts": 8500,
                "status": "UNDER_INVESTIGATION"
            }
        ],
        "recommendations": [
            "🚨 Fraud Ring ring_001 requires immediate action",
            "Monitor GPS spoofing spike in Koramangala (18 incidents this week)",
            "Increase behavioral model sensitivity during high-risk hours (8-10pm)"
        ]
    }

@router.get("/zone-performance")
async def get_zone_performance(period_days: int = 7):
    """
    Get zone performance metrics
    Claims volume, approval rates, payout patterns
    """
    zones = ["HSR Layout", "Koramangala", "Whitefield", "JP Nagar"]
    
    return {
        "period": f"Last {period_days} days",
        "zones": [
            {
                "zone": "HSR Layout",
                "total_claims": 450,
                "approved_percent": 88,
                "average_payout": 750,
                "fraud_rate_percent": 2.1,
                "risk_score_avg": 52
            },
            {
                "zone": "Koramangala",
                "total_claims": 380,
                "approved_percent": 85,
                "average_payout": 680,
                "fraud_rate_percent": 4.2,
                "risk_score_avg": 58
            },
            {
                "zone": "Whitefield",
                "total_claims": 290,
                "approved_percent": 91,
                "average_payout": 820,
                "fraud_rate_percent": 1.4,
                "risk_score_avg": 42
            }
        ],
        "network_wide": {
            "total_claims": 2150,
            "total_payouts": "₹15,32,500",
            "average_approval_rate": 87.8,
            "fraud_detection_accuracy": 94.2,
            "average_settlement_time_seconds": 2.1
        }
    }

@router.get("/agent-performance")
async def get_agent_performance():
    """Track AI agent performance metrics"""
    return {
        "timestamp": "2026-04-04T10:30:00Z",
        "agents": [
            {
                "agent": "Zone Agent",
                "verdicts_given": 890,
                "accuracy_percent": 96.2,
                "avg_confidence": 89.4,
                "most_common_verdict": "PAY"
            },
            {
                "agent": "Work Agent",
                "verdicts_given": 890,
                "accuracy_percent": 92.8,
                "avg_confidence": 84.7,
                "most_common_verdict": "PAY"
            },
            {
                "agent": "Behavior Agent",
                "verdicts_given": 890,
                "accuracy_percent": 89.1,
                "avg_confidence": 79.2,
                "most_common_verdict": "PARTIAL"
            },
            {
                "agent": "Reality Agent",
                "verdicts_given": 890,
                "accuracy_percent": 95.4,
                "avg_confidence": 86.9,
                "most_common_verdict": "PAY"
            },
            {
                "agent": "Trust Agent",
                "verdicts_given": 890,
                "accuracy_percent": 91.7,
                "avg_confidence": 83.1,
                "most_common_verdict": "PAY"
            },
            {
                "agent": "Store Agent",
                "verdicts_given": 890,
                "accuracy_percent": 93.2,
                "avg_confidence": 87.6,
                "most_common_verdict": "PAY"
            },
            {
                "agent": "Fraud Agent",
                "verdicts_given": 890,
                "accuracy_percent": 97.1,
                "avg_confidence": 91.3,
                "most_common_verdict": "PAY"
            }
        ],
        "consensus_performance": {
            "avg_consensus_score": 88.9,
            "final_verdict_accuracy": 95.6,
            "veto_rate_percent": 2.1
        }
    }

def _get_heatmap_color(risk_score: float) -> str:
    """Get color for risk score"""
    if risk_score >= 75:
        return "#CC0000"  # Red
    elif risk_score >= 50:
        return "#FF9900"  # Orange
    elif risk_score >= 25:
        return "#FFFF00"  # Yellow
    else:
        return "#00CC00"  # Green

def _estimate_riders(risk_score: float) -> int:
    """Estimate number of riders affected"""
    # Rough estimation based on risk
    return max(0, int(risk_score * 2))
