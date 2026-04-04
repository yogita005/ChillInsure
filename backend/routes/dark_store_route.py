"""
ChillInsure Dark Store Disruption API Routes
Handles: store status, alternative store suggestions, relocation routing
"""

from fastapi import APIRouter, HTTPException
from services.dark_store_service import (
    find_alternative_stores,
    get_store_status_report,
    simulate_store_outage,
    restore_store,
    get_nearby_stores
)

router = APIRouter(prefix="/api/dark-store", tags=["dark-store"])

@router.post("/find-alternative")
async def find_alternative(request: dict):
    """
    Find alternative dark stores when current one is disrupted
    
    Request body:
    {
        "partner_lat": 13.0827,
        "partner_lng": 77.6055,
        "current_zone": "HSR Layout",
        "disrupted_store": "HSR_Layout",
        "expected_earnings_hourly": 300,
        "disruption_duration_hours": 1.0
    }
    """
    try:
        result = await find_alternative_stores(
            request.get("partner_lat", 13.0827),
            request.get("partner_lng", 77.6055),
            request.get("current_zone", "HSR Layout"),
            request.get("disrupted_store", "HSR_Layout"),
            request.get("expected_earnings_hourly", 300),
            request.get("disruption_duration_hours", 1.0)
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_store_status():
    """Get real-time status of all dark stores"""
    try:
        return get_store_status_report()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/nearby")
async def get_nearby(lat: float, lng: float, radius_km: float = 5.0):
    """
    Get nearby stores within radius
    
    Query params:
    - lat: latitude
    - lng: longitude
    - radius_km: search radius in kilometers (default 5)
    """
    try:
        stores = get_nearby_stores(lat, lng, radius_km)
        return {
            "status": "success",
            "nearby_stores": [
                {
                    "store_id": s.store_id,
                    "name": s.name,
                    "lat": s.lat,
                    "lng": s.lng,
                    "distance_km": round(s.distance_from_partner, 2),
                    "travel_time_minutes": int(s.travel_time_minutes),
                    "capacity": s.capacity,
                    "status": s.status
                }
                for s in stores
            ],
            "count": len(stores)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulate-outage")
async def simulate_outage(request: dict):
    """
    TESTING: Simulate a store outage for testing purposes
    
    Request body:
    {
        "store_name": "HSR_Layout",
        "duration_minutes": 45
    }
    """
    try:
        result = simulate_store_outage(
            request.get("store_name", "HSR_Layout"),
            request.get("duration_minutes", 45)
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/restore")
async def restore_store_endpoint(request: dict):
    """
    TESTING: Restore a store after outage
    
    Request body:
    {
        "store_name": "HSR_Layout"
    }
    """
    try:
        result = restore_store(request.get("store_name", "HSR_Layout"))
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
