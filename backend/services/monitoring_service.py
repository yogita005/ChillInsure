"""
ChillInsure Real-Time Monitoring Service
Continuously ingests: weather, AQI, traffic, civic events, store status
Generates real-time alerts and risk flags
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import random
from services.weather_service import get_weather_disruption, get_aqi_disruption
from dotenv import load_dotenv

load_dotenv()

class RealtimeMonitoringService:
    """
    Real-time monitoring of all disruption signals
    Generates alerts when thresholds exceeded
    """
    
    def __init__(self):
        # Alert thresholds
        self.rainfall_threshold = 15  # mm
        self.aqi_threshold = 200
        self.speed_threshold = 15  # km/h for traffic
        self.downtime_threshold = 30  # minutes
        
        # Active alerts cache
        self.active_alerts = {}
        self.zone_risk_cache = {}
    
    async def monitor_weather(self, city: str, zone: str) -> Dict:
        """Monitor weather conditions in zone"""
        try:
            weather = await get_weather_disruption(city)
            
            rainfall = weather.get("rain_mm", 0)
            temp = weather.get("temp_c", 30)
            
            alert = {
                "type": "weather",
                "zone": zone,
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "rainfall_mm": rainfall,
                    "temperature_c": temp,
                    "alert_triggered": rainfall > self.rainfall_threshold or temp > 42
                },
                "severity": self._assess_weather_severity(rainfall, temp)
            }
            
            return alert
        except Exception as e:
            return {
                "type": "weather",
                "error": str(e),
                "alert_triggered": False
            }
    
    async def monitor_aqi(self, city: str, zone: str) -> Dict:
        """Monitor air quality in zone"""
        try:
            aqi = await get_aqi_disruption(city)
            
            aqi_value = aqi.get("aqi", 0)
            
            alert = {
                "type": "aqi",
                "zone": zone,
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "aqi": aqi_value,
                    "alert_triggered": aqi_value > self.aqi_threshold
                },
                "severity": self._assess_aqi_severity(aqi_value),
                "category": self._get_aqi_category(aqi_value)
            }
            
            return alert
        except Exception as e:
            return {
                "type": "aqi",
                "error": str(e),
                "alert_triggered": False
            }
    
    async def monitor_traffic(self, zone: str, average_speed_kmh: float = 20) -> Dict:
        """Monitor traffic conditions"""
        
        # Mock traffic data based on time of day
        now = datetime.utcnow()
        hour = now.hour
        
        # Peak hours: 8-10am, 6-9pm
        if (8 <= hour <= 10) or (18 <= hour <= 21):
            mock_speed = random.uniform(8, 15)
            congestion = "heavy"
        # Off-peak
        else:
            mock_speed = random.uniform(20, 35)
            congestion = "light"
        
        alert = {
            "type": "traffic",
            "zone": zone,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "current_speed_kmh": round(mock_speed, 1),
                "congestion_level": congestion,
                "alert_triggered": mock_speed < self.speed_threshold
            },
            "severity": "HIGH" if mock_speed < 10 else "MEDIUM" if mock_speed < 15 else "LOW"
        }
        
        return alert
    
    async def monitor_civic_events(self, zone: str) -> Dict:
        """Monitor civic disruptions (curfews, protests, strikes)"""
        
        # Mock civic event data
        # In production: Parse news APIs, local authority alerts
        events = {
            "HSR Layout": {
                "curfew": False,
                "protests": 0,
                "strikes": False,
                "events": []
            },
            "Koramangala": {
                "curfew": False,
                "protests": 1,
                "strikes": False,
                "events": ["Traffic diversion near Brigade Road"]
            },
            "Whitefield": {
                "curfew": False,
                "protests": 0,
                "strikes": False,
                "events": []
            }
        }
        
        zone_data = events.get(zone, {
            "curfew": False,
            "protests": 0,
            "strikes": False,
            "events": []
        })
        
        alert_triggered = zone_data.get("curfew") or zone_data.get("strikes") or zone_data.get("protests", 0) >= 1
        
        alert = {
            "type": "civic",
            "zone": zone,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "curfew_active": zone_data.get("curfew", False),
                "protests": zone_data.get("protests", 0),
                "strikes_ongoing": zone_data.get("strikes", False),
                "events": zone_data.get("events", []),
                "alert_triggered": alert_triggered
            },
            "severity": "CRITICAL" if zone_data.get("curfew") else "HIGH" if zone_data.get("strikes") else "MEDIUM" if zone_data.get("protests", 0) > 0 else "LOW"
        }
        
        return alert
    
    async def monitor_store_status(self, zone: str) -> Dict:
        """Monitor dark store uptime and availability"""
        
        # Mock store status
        store_status = {
            "HSR Layout": {"online": True, "orders_backlog": 0, "uptime_percent": 99.2},
            "Koramangala": {"online": True, "orders_backlog": 45, "uptime_percent": 98.5},
            "Whitefield": {"online": False, "orders_backlog": 120, "uptime_percent": 95.0},  # Simulated outage
        }
        
        zone_data = store_status.get(zone, {"online": True, "orders_backlog": 0, "uptime_percent": 99.0})
        
        alert = {
            "type": "store_status",
            "zone": zone,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "store_online": zone_data.get("online"),
                "orders_backlog": zone_data.get("orders_backlog", 0),
                "uptime_percent": zone_data.get("uptime_percent", 99.0),
                "alert_triggered": not zone_data.get("online") or zone_data.get("orders_backlog", 0) > 100
            },
            "severity": "CRITICAL" if not zone_data.get("online") else "HIGH" if zone_data.get("orders_backlog", 0) > 100 else "LOW"
        }
        
        return alert
    
    async def get_zone_risk_assessment(self, zone: str, pincode: str = "560034") -> Dict:
        """
        Get comprehensive risk assessment for a zone
        Combines all monitoring signals
        """
        
        try:
            # Run all monitors in parallel
            weather_alert = await self.monitor_weather("Bengaluru", zone)
            aqi_alert = await self.monitor_aqi("Bengaluru", zone)
            traffic_alert = await self.monitor_traffic(zone)
            civic_alert = await self.monitor_civic_events(zone)
            store_alert = await self.monitor_store_status(zone)
            
            # Count active alerts
            alerts = [weather_alert, aqi_alert, traffic_alert, civic_alert, store_alert]
            triggered_alerts = [a for a in alerts if a.get("data", {}).get("alert_triggered", False)]
            
            # Calculate overall risk score (0-100)
            risk_score = self._calculate_risk_score(triggered_alerts, alerts)
            
            return {
                "zone": zone,
                "pincode": pincode,
                "timestamp": datetime.utcnow().isoformat(),
                "overall_risk_score": round(risk_score, 1),
                "risk_level": self._classify_risk(risk_score),
                "active_alerts": len(triggered_alerts),
                "total_monitors": len(alerts),
                "alerts": {
                    "weather": weather_alert,
                    "aqi": aqi_alert,
                    "traffic": traffic_alert,
                    "civic": civic_alert,
                    "store": store_alert
                },
                "triggered_alerts": triggered_alerts,
                "recommendations": self._get_zone_recommendations(triggered_alerts)
            }
        except Exception as e:
            return {
                "zone": zone,
                "error": str(e),
                "risk_level": "UNKNOWN"
            }
    
    async def get_all_zones_status(self, zones: List[str]) -> Dict:
        """Get real-time risk for all zones"""
        all_assessments = []
        
        for zone in zones:
            assessment = await self.get_zone_risk_assessment(zone)
            all_assessments.append(assessment)
        
        # Sort by risk score
        all_assessments.sort(key=lambda x: x.get("overall_risk_score", 0), reverse=True)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "total_zones": len(zones),
            "high_risk_zones": sum(1 for a in all_assessments if a.get("risk_level") in ["HIGH", "CRITICAL"]),
            "zones": all_assessments
        }
    
    def get_active_disruptions(self, zone: str) -> Dict:
        """Get details of active disruptions in zone"""
        # This would query from real-time data
        return {
            "zone": zone,
            "timestamp": datetime.utcnow().isoformat(),
            "active_disruptions": [],
            "estimated_duration_minutes": 0,
            "riders_affected": 0
        }
    
    def _assess_weather_severity(self, rainfall: float, temp: float) -> str:
        """Assess weather severity"""
        if rainfall > 25 or temp > 45:
            return "CRITICAL"
        elif rainfall > 15 or temp > 42:
            return "HIGH"
        elif rainfall > 5 or temp > 38:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _assess_aqi_severity(self, aqi: float) -> str:
        """Assess AQI severity"""
        if aqi > 300:
            return "CRITICAL"
        elif aqi > 200:
            return "HIGH"
        elif aqi > 100:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _get_aqi_category(self, aqi: float) -> str:
        """Get AQI category name"""
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
    
    def _calculate_risk_score(self, triggered_alerts: List, all_alerts: List) -> float:
        """Calculate overall risk score (0-100)"""
        if not all_alerts:
            return 0
        
        risk_weights = {
            "weather": 25,
            "civic": 30,
            "traffic": 15,
            "aqi": 20,
            "store_status": 10
        }
        
        total_risk = 0
        for alert in triggered_alerts:
            alert_type = alert.get("type")
            severity = alert.get("severity", "LOW")
            
            severity_score = {"LOW": 20, "MEDIUM": 50, "HIGH": 80, "CRITICAL": 100}.get(severity, 0)
            weight = risk_weights.get(alert_type, 10)
            
            total_risk += (severity_score * weight / 100)
        
        # Normalize by number of monitors
        total_possible = sum(risk_weights.values())
        risk_score = (total_risk / total_possible) * 100 if total_possible > 0 else 0
        
        return min(100, max(0, risk_score))
    
    def _classify_risk(self, score: float) -> str:
        """Classify risk level based on score"""
        if score >= 75:
            return "CRITICAL"
        elif score >= 50:
            return "HIGH"
        elif score >= 25:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _get_zone_recommendations(self, triggered_alerts: List) -> List[str]:
        """Generate recommendations based on active alerts"""
        recommendations = []
        
        for alert in triggered_alerts:
            alert_type = alert.get("type")
            
            if alert_type == "weather":
                recommendations.append("⚠️ Weather disruption detected - riders in danger zone may receive parametric payouts")
            elif alert_type == "aqi":
                recommendations.append("💨 Air quality critical - health risk for riders")
            elif alert_type == "traffic":
                recommendations.append("🚗 Heavy traffic - recommend zone closures or incentives")
            elif alert_type == "civic":
                recommendations.append("🚨 Civic disruption - consider automatic payouts")
            elif alert_type == "store_status":
                recommendations.append("🏪 Store disruption - enable relocation routing")
        
        return recommendations if recommendations else ["✅ Zone operational - normal monitoring continues"]
