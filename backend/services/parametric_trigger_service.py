"""
ChillInsure Parametric Trigger System
Automatically triggers claims when disruption conditions are met
NO manual claims - fully automated
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
from services.weather_service import get_weather_disruption, get_aqi_disruption

class ParametricTriggerEngine:
    """
    Parametric insurance triggers
    Auto-triggers when:
    - Rainfall > threshold
    - AQI > threshold
    - Store offline
    - Curfew/civic disruption
    """
    
    def __init__(self):
        # Trigger thresholds
        self.rain_threshold_mm = 15
        self.aqi_threshold = 200
        self.temperature_extreme = 42  # °C
        self.downtime_threshold_minutes = 30
        
        # Payout amounts by trigger (default)
        self.payout_multipliers = {
            "rain": 1.0,      # 100% of configured amount
            "aqi": 0.8,       # 80%
            "curfew": 1.2,    # 120%
            "heat": 0.9,      # 90%
            "outage": 1.1,    # 110%
            "strike": 1.2     # 120%
        }
    
    async def check_rainfall_trigger(
        self,
        city: str,
        zone: str,
        threshold_mm: Optional[float] = None
    ) -> Dict:
        """
        Check if rainfall exceeds threshold for auto-trigger
        """
        threshold = threshold_mm or self.rain_threshold_mm
        
        try:
            weather = await get_weather_disruption(city)
            rainfall = weather.get("rain_mm", 0)
            temp = weather.get("temp_c", 30)
            
            triggered = rainfall > threshold
            
            return {
                "trigger_type": "rainfall",
                "zone": zone,
                "triggered": triggered,
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "rainfall_mm": rainfall,
                    "threshold_mm": threshold,
                    "exceeded_by": max(0, rainfall - threshold)
                },
                "confidence": min(100, 50 + (rainfall / threshold * 40)) if triggered else 0,
                "spillover": self._calculate_spillover_effect(rainfall, threshold)
            }
        except Exception as e:
            return {
                "trigger_type": "rainfall",
                "triggered": False,
                "error": str(e)
            }
    
    async def check_aqi_trigger(
        self,
        city: str,
        zone: str,
        threshold: Optional[int] = None
    ) -> Dict:
        """Check if AQI exceeds threshold for auto-trigger"""
        threshold = threshold or self.aqi_threshold
        
        try:
            aqi_data = await get_aqi_disruption(city)
            aqi = aqi_data.get("aqi", 0)
            
            triggered = aqi > threshold
            
            return {
                "trigger_type": "aqi",
                "zone": zone,
                "triggered": triggered,
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "aqi": aqi,
                    "threshold": threshold,
                    "exceeded_by": max(0, aqi - threshold),
                    "category": self._get_aqi_category(aqi)
                },
                "confidence": min(100, 60 + (aqi / threshold * 35)) if triggered else 0
            }
        except Exception as e:
            return {
                "trigger_type": "aqi",
                "triggered": False,
                "error": str(e)
            }
    
    async def check_temperature_trigger(
        self,
        city: str,
        zone: str,
        threshold_c: Optional[float] = None
    ) -> Dict:
        """Check if temperature is extreme for auto-trigger"""
        threshold = threshold_c or self.temperature_extreme
        
        try:
            weather = await get_weather_disruption(city)
            temp = weather.get("temp_c", 30)
            
            triggered = temp > threshold
            
            return {
                "trigger_type": "extreme_heat",
                "zone": zone,
                "triggered": triggered,
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "temperature_c": temp,
                    "threshold_c": threshold,
                    "exceeded_by": max(0, temp - threshold),
                    "health_risk": "severe" if temp > 45 else "high" if temp > 42 else"moderate"
                },
                "confidence": min(100, 70 + ((temp - threshold) / 5 * 20)) if triggered else 0
            }
        except Exception as e:
            return {
                "trigger_type": "extreme_heat",
                "triggered": False,
                "error": str(e)
            }
    
    def check_store_outage_trigger(
        self,
        zone: str,
        store_online: bool,
        downtime_duration_minutes: int = 0
    ) -> Dict:
        """Check if store outage triggers auto-payout"""
        triggered = not store_online and downtime_duration_minutes >= self.downtime_threshold_minutes
        
        return {
            "trigger_type": "store_outage",
            "zone": zone,
            "triggered": triggered,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "store_online": store_online,
                "downtime_duration_minutes": downtime_duration_minutes,
                "threshold_minutes": self.downtime_threshold_minutes
            },
            "confidence": 95 if triggered else (50 if downtime_duration_minutes > 15 else 0),
            "auto_redirect_available": triggered
        }
    
    def check_civic_trigger(
        self,
        zone: str,
        curfew_active: bool = False,
        strike_ongoing: bool = False,
        protest_count: int = 0
    ) -> Dict:
        """Check if civic disruption triggers auto-payout"""
        triggered = curfew_active or strike_ongoing or protest_count >= 1
        
        trigger_reason = []
        if curfew_active:
            trigger_reason.append("curfew")
        if strike_ongoing:
            trigger_reason.append("strike")
        if protest_count >= 1:
            trigger_reason.append(f"protests({protest_count})")
        
        return {
            "trigger_type": "civic_disruption",
            "zone": zone,
            "triggered": triggered,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "curfew_active": curfew_active,
                "strike_ongoing": strike_ongoing,
                "protest_count": protest_count,
                "trigger_reasons": trigger_reason
            },
            "confidence": 98 if triggered else 0
        }
    
    async def check_all_triggers(
        self,
        city: str,
        zone: str,
        store_online: bool = True,
        curfew_active: bool = False,
        strike_ongoing: bool = False
    ) -> Dict:
        """
        Check all parametric triggers simultaneously
        Returns: which triggers fired, auto-payout recommendation
        """
        
        triggers_fired = []
        
        # Check weather
        rainfall = await self.check_rainfall_trigger(city, zone)
        if rainfall.get("triggered"):
            triggers_fired.append({
                "trigger": "rainfall",
                "severity": "HIGH",
                "data": rainfall
            })
        
        aqi = await self.check_aqi_trigger(city, zone)
        if aqi.get("triggered"):
            triggers_fired.append({
                "trigger": "aqi",
                "severity": "HIGH",
                "data": aqi
            })
        
        heat = await self.check_temperature_trigger(city, zone)
        if heat.get("triggered"):
            triggers_fired.append({
                "trigger": "extreme_heat",
                "severity": "HIGH",
                "data": heat
            })
        
        # Check civic
        civic = self.check_civic_trigger(zone, curfew_active, strike_ongoing)
        if civic.get("triggered"):
            triggers_fired.append({
                "trigger": "civic_disruption",
                "severity": "CRITICAL",
                "data": civic
            })
        
        # Check store
        store = self.check_store_outage_trigger(zone, store_online)
        if store.get("triggered"):
            triggers_fired.append({
                "trigger": "store_outage",
                "severity": "HIGH",
                "data": store
            })
        
        return {
            "zone": zone,
            "timestamp": datetime.utcnow().isoformat(),
            "triggers_fired": len(triggers_fired),
            "active_triggers": triggers_fired,
            "auto_payout_recommended": len(triggers_fired) > 0,
            "payout_acceleration": self._calculate_payout_acceleration(triggers_fired),
            "recommendations": self._get_trigger_recommendations(triggers_fired)
        }
    
    def _calculate_payout_acceleration(self, triggers: List[Dict]) -> Dict:
        """
        Calculate accelerated payout based on trigger severity/count
        Multiple concurrent triggers increase payout
        """
        if not triggers:
            return {"multiplier": 1.0, "acceleration": "normal"}
        
        total_severity_weight = 0
        for t in triggers:
            severity = t.get("severity", "MEDIUM")
            weight = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}.get(severity, 2)
            total_severity_weight += weight
        
        # More triggers = higher multiplier
        if len(triggers) >= 3:
            multiplier = 1.5  # 150% payout acceleration
            acceleration = "ultra_fast"
        elif len(triggers) >= 2:
            multiplier = 1.3  # 130% payout acceleration
            acceleration = "fast"
        else:
            multiplier = 1.1  # 110% payout acceleration
            acceleration = "standard"
        
        return {
            "multiplier": multiplier,
            "acceleration": acceleration,
            "trigger_count": len(triggers),
            "total_severity": total_severity_weight
        }
    
    def _calculate_spillover_effect(self, rainfall: float, threshold: float) -> Dict:
        """
        Calculate spillover effect: yesterday's disruption affects today
        p_spillover = p_yesterday × (0.66 × V_zone)
        """
        # Simplified: if heavy rain yesterday, increase today's trigger sensitivity
        spillover_factor = 0.66
        
        return {
            "factor": spillover_factor,
            "effect": "increased_sensitivity",
            "memo": "Yesterday's disruption increases today's risk"
        }
    
    def _get_aqi_category(self, aqi: float) -> str:
        """Get AQI category"""
        if aqi <= 50:
            return "Good"
        elif aqi <= 100:
            return "Satisfactory"
        elif aqi <= 200:
            return "Moderately Polluted"
        elif aqi <= 300:
            return "Poor"
        elif aqi <= 400:
            return "Very Poor"
        else:
            return "Severe"
    
    def _get_trigger_recommendations(self, triggers: List[Dict]) -> List[str]:
        """Generate recommendations for triggered payouts"""
        recommendations = []
        
        for t in triggers:
            trigger_name = t.get("trigger")
            
            if trigger_name == "rainfall":
                recommendations.append("✅ Auto-payout triggered: Heavy rainfall confirmed")
            elif trigger_name == "aqi":
                recommendations.append("✅ Auto-payout triggered: Critical air quality levels")
            elif trigger_name == "extreme_heat":
                recommendations.append("✅ Auto-payout triggered: Extreme heat conditions")
            elif trigger_name == "civic_disruption":
                recommendations.append("🚨 CRITICAL: Civic disruption auto-payout (highest priority)")
            elif trigger_name == "store_outage":
                recommendations.append("✅ Auto-payout triggered + Automatic relocation routing activated")
        
        if not recommendations:
            recommendations.append("👍 No triggers detected - standard monitoring continues")
        
        return recommendations
    
    def create_auto_claim(
        self,
        trigger_type: str,
        zone: str,
        pincode: str,
        rider_id: str,
        est_earnings_per_hour: float = 300
    ) -> Dict:
        """
        AUTO-GENERATE a claim when parametric trigger fires
        NO manual submission needed
        """
        
        # Estimate loss based on trigger type and duration
        avg_downtime = {
            "rainfall": 90,  # 90 minutes
            "aqi": 120,
            "extreme_heat": 120,
            "civic_disruption": 180,
            "store_outage": 45
        }
        
        downtime_minutes = avg_downtime.get(trigger_type, 60)
        gross_loss = (est_earnings_per_hour / 60) * downtime_minutes
        
        claim_id = f"AUTO_{trigger_type.upper()}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        return {
            "auto_claim_id": claim_id,
            "trigger_type": trigger_type,
            "zone": zone,
            "pincode": pincode,
            "rider_id": rider_id,
            "trigger_timestamp": datetime.utcnow().isoformat(),
            "estimated_downtime_minutes": downtime_minutes,
            "estimated_gross_loss": round(gross_loss, 2),
            "estimated_payout": round(gross_loss * self.payout_multipliers.get(trigger_type, 1.0), 2),
            "status": "READY_FOR_VERIFICATION",
            "auto_generated": True,
            "requires_manual_review": trigger_type == "civic_disruption"
        }
