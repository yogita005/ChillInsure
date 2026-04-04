from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from services.zone_risk_service import get_zone_risk, get_risk_label
from services.weather_service import check_disruption, ZONE_TO_CITY
from services.pincode_service import get_city_from_pincode
from controllers.auth_controller import decode_access_token
from db.supabase_client import get_supabase_client
from datetime import datetime
import random

router = APIRouter()

def generate_alert_message(disruption_type: str, city: str, data: dict) -> dict:
    """Generate alert message based on disruption type"""
    
    base_alerts = {
        "heavy_rain": {
            "icon": "cloud-rain",
            "title": f"Heavy rainfall incoming — {city}",
            "action": "Policy will auto-trigger if threshold met",
        },
        "extreme_heat": {
            "icon": "thermometer",
            "title": f"Extreme heat warning — {city}",
            "action": "High heat disruptions expected",
        },
        "severe_pollution": {
            "icon": "wind",
            "title": f"AQI rising — {city} zone",
            "action": "Monitoring — policy triggers at AQI 300+",
        }
    }
    
    alert = base_alerts.get(disruption_type, {
        "icon": "alert-triangle",
        "title": f"Zone alert — {city}",
        "action": "Monitoring — no trigger yet",
    })
    
    # Add data-specific details
    if "weather_data" in data:
        weather = data["weather_data"]
        alert["desc"] = f"Temperature: {weather.get('temp_c')}°C, Rainfall: {weather.get('rain_mm')}mm"
        alert["probability"] = f"{random.randint(75, 95)}%"
    
    if "aqi_data" in data:
        aqi_data = data["aqi_data"]
        alert["desc"] = f"AQI at {aqi_data.get('aqi')} and climbing. Threshold trigger at 300."
        alert["probability"] = f"{random.randint(65, 89)}%"
    
    return alert

@router.get("/risk-alerts/{user_id}")
async def get_risk_alerts(
    user_id: str,
    authorization: Optional[str] = Header(None)
):
    """Fetch risk alerts for user's zone based on zone risk and weather data"""
    
    try:
        # Verify token
        if not authorization:
            raise HTTPException(status_code=401, detail="Missing authorization header")
        
        token = authorization.replace("Bearer ", "")
        try:
            decoded_uid = decode_access_token(token)
        except ValueError as e:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        if decoded_uid != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Get user's pincode from database
        db = get_supabase_client()
        user_data = db.table("users").select("pincode, zone").eq("uid", user_id).execute()
        
        if not user_data.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_pincode = user_data.data[0].get("pincode", "560034")  # Default to Bengaluru
        user_zone = user_data.data[0].get("zone", "koramangala_bengaluru")
        
        # Get city from pincode
        city = get_city_from_pincode(user_pincode)
        
        # Get zone risk
        zone_risk = get_zone_risk(user_pincode)
        risk_label = get_risk_label(user_pincode)
        
        # Get weather and AQI disruptions
        disruption_data = await check_disruption(city)
        
        # Generate alerts list
        alerts = []
        
        # Primary disruption alert
        if disruption_data["disruption_type"]:
            alert = generate_alert_message(
                disruption_data["disruption_type"],
                city,
                disruption_data
            )
            alert["severity"] = "high" if disruption_data["disruption_type"] in ["heavy_rain", "severe_pollution"] else "medium"
            alert["time"] = "12 min ago"
            alerts.append(alert)
        
        # Zone risk alert based on multiplier
        if zone_risk >= 1.3:
            alerts.append({
                "icon": "alert-triangle",
                "severity": "medium",
                "title": f"High-risk zone — {city}",
                "desc": f"Your delivery zone has elevated weather risk (multiplier: {zone_risk})",
                "time": "25 min ago",
                "action": "Extra precaution recommended",
                "probability": "78%"
            })
        
        # Generic monitoring alert if no disruptions
        if not alerts:
            alerts.append({
                "icon": "radio",
                "severity": "low",
                "title": f"Zone status normal — {city}",
                "desc": "No weather or AQI disruptions detected. Stay safe!",
                "time": "Just now",
                "action": "Monitoring — no trigger needed",
                "probability": "5%"
            })
        
        return {
            "status": "success",
            "user_id": user_id,
            "zone": user_zone,
            "city": city,
            "zone_risk_multiplier": zone_risk,
            "zone_risk_label": risk_label,
            "alerts_count": len(alerts),
            "alerts": alerts
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        # Fallback to generic alerts if API fails
        return {
            "status": "success",
            "user_id": user_id,
            "alerts_count": 1,
            "alerts": [{
                "icon": "radio",
                "severity": "low",
                "title": "Live monitoring active",
                "desc": "Real-time zone risk monitoring is running",
                "time": "Now",
                "action": "Monitoring — no trigger needed",
                "probability": "0%"
            }],
            "error": str(e)
        }


@router.get("/zone-risk/{pincode}")
async def get_zone_risk_data(pincode: str):
    """Get zone risk data for a specific pincode"""
    
    try:
        risk = get_zone_risk(pincode)
        risk_label = get_risk_label(pincode)
        
        return {
            "status": "success",
            "pincode": pincode,
            "risk_multiplier": risk,
            "risk_label": risk_label,
            "risk_description": {
                "low": "Minimal weather disruption risk",
                "medium": "Moderate weather disruption potential",
                "high": "High weather disruption risk"
            }.get(risk_label, "Unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weather-status/{city}")
async def get_weather_status(city: str):
    """Get current weather disruption status for a city"""
    
    try:
        disruption = await check_disruption(city)
        return {
            "status": "success",
            "city": city,
            "disruption_detected": disruption["disruption_type"] is not None,
            "disruption_type": disruption["disruption_type"],
            "api_verified": disruption["api_verified"],
            "weather": disruption.get("weather_data"),
            "aqi": disruption.get("aqi_data")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
