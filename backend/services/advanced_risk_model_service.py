"""
ChillInsure Advanced Risk Model Service
Calculates comprehensive risk combining: weather, dark store, traffic, civic, fraud
Implements the merged premium model with all risk factors
"""

import math
from typing import Dict, Tuple
from datetime import datetime
import numpy as np
from dotenv import load_dotenv

load_dotenv()

class AdvancedRiskModel:
    """
    Advanced risk calculation combining:
    - Weather risk (p_effective_weather)
    - Dark store risk (p_store_failure)
    - Traffic risk (p_traffic)
    - Civic risk (p_civic)
    - Fraud risk (p_fraud)
    
    Final: p_effective = max(all risk factors)
    Premium = [1 - (1 - p_effective)(1 - p_civic)] × L × β + platform_fee
    """
    
    def __init__(self):
        # Constants
        self.k = 0.05  # Time decay constant
        self.w = 0.05  # Variance weight
        self.platform_fee = 10  # ₹
        self.base_uncertainty = 0.1  # Base uncertainty factor
        
        # Zone vulnerability multipliers (H3 grid simplified to pincodes)
        self.zone_vulnerability = {
            "560034": 1.3,   # Koramangala (high congestion)
            "560001": 1.0,   # MG Road
            "560095": 0.8,   # Whitefield
            "560068": 1.1,   # JP Nagar
            "560001": 1.2,   # Central Bangalore
        }
    
    # ── WEATHER RISK ──────────────────────────────────────────────────────────
    
    def calculate_weather_probability(
        self,
        rainfall_mm: float = 0,
        temperature_c: float = 30,
        humidity_percent: float = 60
    ) -> float:
        """
        Calculate weather disruption probability (0-1)
        Factors: rainfall, temperature, humidity
        """
        p_rain = 0
        p_temp = 0
        
        # Rainfall probability (sigmoidal curve)
        if rainfall_mm > 15:
            p_rain = min(0.95, rainfall_mm / 100)
        elif rainfall_mm > 5:
            p_rain = 0.3 + (rainfall_mm - 5) / 20
        
        # Temperature probability
        if temperature_c > 42:
            p_temp = 0.7 + min(0.25, (temperature_c - 42) / 10)
        elif temperature_c < 10:
            p_temp = 0.4 + (10 - temperature_c) / 20
        
        # Combined weather probability
        p_weather = max(p_rain, p_temp)
        
        return min(0.95, p_weather)
    
    def calculate_weather_uncertainty(
        self,
        forecast_days: int = 1,
        precipitation_prob: float = 0.5
    ) -> float:
        """
        Calculate weather uncertainty (β component)
        U_weather = k√t + w × p(1 - p)
        
        Where:
          k = 0.05 (time decay)
          w = 0.05 (variance weight)
          t = forecast days
          p = precipitation probability
        """
        time_component = self.k * math.sqrt(forecast_days)
        variance_component = self.w * precipitation_prob * (1 - precipitation_prob)
        
        return time_component + variance_component
    
    def calculate_spillover_weather_risk(
        self,
        yesterday_probability: float,
        zone_vulnerability: float
    ) -> float:
        """
        Calculate weather spillover effect (previous day disruption affecting today)
        p_spillover = p_yesterday × (0.66 × V_zone)
        """
        return yesterday_probability * (0.66 * zone_vulnerability)
    
    def calculate_effective_weather_risk(
        self,
        rainfall_mm: float,
        temperature_c: float,
        humidity: float,
        zone_vuln: float,
        yesterday_disruption: float = 0,
        forecast_days: int = 1
    ) -> Dict:
        """
        Calculate effective weather risk combining all factors
        p_effective_weather = max(p_boosted, p_spillover)
        """
        # Base weather probability
        p_weather = self.calculate_weather_probability(rainfall_mm, temperature_c, humidity)
        
        # Boosted probability with zone vulnerability
        p_boosted = min(1.0, p_weather * (1 + zone_vuln))
        
        # Spillover probability
        p_spillover = self.calculate_spillover_weather_risk(yesterday_disruption, zone_vuln)
        
        # Effective weather risk (take max)
        p_effective_weather = max(p_boosted, p_spillover)
        
        # Weather uncertainty
        u_weather = self.calculate_weather_uncertainty(forecast_days, p_weather)
        
        return {
            "base_weather_prob": round(p_weather, 3),
            "p_boosted": round(p_boosted, 3),
            "p_spillover": round(p_spillover, 3),
            "p_effective_weather": round(p_effective_weather, 3),
            "uncertainty_beta": round(u_weather, 3),
            "risk_level": self._classify_risk_level(p_effective_weather)
        }
    
    # ── DARK STORE RISK ───────────────────────────────────────────────────────
    
    def calculate_store_failure_probability(
        self,
        store_uptime_percent: float = 98,
        orders_backlog: int = 0,
        daily_volatility: float = 0.05
    ) -> float:
        """
        Calculate probability of dark store failure
        Factors: uptime history, order backlog, volatility
        """
        # Uptime-based probability (inverse)
        p_uptime_fail = (100 - store_uptime_percent) / 100
        
        # Backlog increases risk
        p_backlog = min(0.5, orders_backlog / 200)
        
        # Volatility increases risk
        p_volatility = daily_volatility
        
        # Combined store failure probability
        p_store_fail = min(0.8, p_uptime_fail * 0.4 + p_backlog * 0.4 + p_volatility * 0.2)
        
        return p_store_fail
    
    # ── TRAFFIC RISK ──────────────────────────────────────────────────────────
    
    def calculate_traffic_probability(
        self,
        current_speed_kmh: float = 25,
        congestion_level: str = "normal"
    ) -> float:
        """
        Calculate severe traffic probability
        Factors: current speed, congestion prediction
        """
        # Speed-based probability (lower speed = higher risk)
        if current_speed_kmh < 5:
            p_speed = 0.8
        elif current_speed_kmh < 10:
            p_speed = 0.6
        elif current_speed_kmh < 15:
            p_speed = 0.4
        else:
            p_speed = 0.1
        
        # Congestion level mapping
        congestion_map = {
            "light": 0.1,
            "normal": 0.2,
            "moderate": 0.4,
            "heavy": 0.7,
            "severe": 0.9
        }
        
        p_congestion = congestion_map.get(congestion_level.lower(), 0.2)
        
        # Combined traffic risk
        p_traffic = (p_speed * 0.6 + p_congestion * 0.4)
        
        return min(0.9, p_traffic)
    
    # ── CIVIC RISK ────────────────────────────────────────────────────────────
    
    def calculate_civic_probability(
        self,
        curfew_active: bool = False,
        protest_zones: int = 0,
        strike_ongoing: bool = False,
        event_type: str = "none"
    ) -> float:
        """
        Calculate civic disruption probability
        Factors: curfews, protests, strikes, special events
        """
        p_civic = 0
        
        if curfew_active:
            p_civic = max(p_civic, 0.95)  # Curfew = almost certain disruption
        
        if strike_ongoing:
            p_civic = max(p_civic, 0.85)  # Strike = high disruption
        
        if protest_zones >= 1:
            p_civic = max(p_civic, 0.5 + protest_zones * 0.15)
        
        # Special events
        event_map = {
            "holiday": 0.2,
            "festival": 0.3,
            "election": 0.6,
            "sporting_event": 0.4
        }
        p_civic = max(p_civic, event_map.get(event_type.lower(), 0))
        
        return min(0.95, p_civic)
    
    # ── FRAUD RISK ────────────────────────────────────────────────────────────
    
    def calculate_fraud_probability(self, fraud_score: float = 0) -> float:
        """
        Convert fraud detection score (0-100) to probability (0-1)
        """
        # Linear mapping with threshold
        if fraud_score < 20:
            return 0  # Clean
        elif fraud_score > 80:
            return 0.8  # Almost certain fraud
        else:
            return (fraud_score - 20) / 100
    
    # ── FINAL PREMIUM CALCULATION ─────────────────────────────────────────────
    
    def calculate_beta_coefficient(
        self,
        u_weather: float,
        zone_vulnerability: float,
        fraud_score: float = 0
    ) -> float:
        """
        Calculate β coefficient
        β = 1.0 + U_weather + F_risk + V_zone
        """
        f_risk = 0.2 if fraud_score > 40 else 0
        
        beta = 1.0 + u_weather + f_risk + (zone_vulnerability * 0.1)
        
        return min(2.0, max(1.0, beta))  # Clamp between 1.0 and 2.0
    
    def calculate_comprehensive_risk(
        self,
        # Weather inputs
        rainfall_mm: float = 0,
        temperature_c: float = 30,
        humidity_percent: float = 60,
        forecast_days: int = 1,
        yesterday_disruption: float = 0,
        
        # Store inputs
        store_uptime_percent: float = 98,
        orders_backlog: int = 0,
        
        # Traffic inputs
        current_speed_kmh: float = 25,
        congestion_level: str = "normal",
        
        # Civic inputs
        curfew_active: bool = False,
        protest_zones: int = 0,
        strike_ongoing: bool = False,
        
        # Fraud inputs
        fraud_score: float = 0,
        
        # Zone info
        pincode: str = "560034",
        coverage_limit: int = 750
    ) -> Dict:
        """
        MAIN FUNCTION: Calculate comprehensive risk and final premium
        
        Returns: all risk components, effective risk, premium, β coefficient
        """
        
        # Get zone vulnerability
        zone_vuln = self.zone_vulnerability.get(pincode, 1.0)
        
        # 1. Calculate all risk factors
        weather_result = self.calculate_effective_weather_risk(
            rainfall_mm, temperature_c, humidity_percent,
            zone_vuln, yesterday_disruption, forecast_days
        )
        
        p_store_failure = self.calculate_store_failure_probability(store_uptime_percent, orders_backlog)
        p_traffic = self.calculate_traffic_probability(current_speed_kmh, congestion_level)
        p_civic = self.calculate_civic_probability(curfew_active, protest_zones, strike_ongoing)
        p_fraud = self.calculate_fraud_probability(fraud_score)
        
        # 2. Calculate final effective risk
        p_effective = max(
            weather_result["p_effective_weather"],
            p_store_failure,
            p_traffic,
            p_civic
        )
        
        # 3. Calculate β coefficient
        beta = self.calculate_beta_coefficient(
            weather_result["uncertainty_beta"],
            zone_vuln,
            fraud_score
        )
        
        # 4. Calculate final premium
        # Premium = [1 - (1 - p_effective)(1 - p_civic)] × L × β + platform_fee
        # This models the combined effect of all risks
        combined_risk = 1 - (1 - p_effective) * (1 - p_civic)
        base_premium = combined_risk * coverage_limit * beta
        final_premium = base_premium + self.platform_fee
        
        # 5. Calculate GigScore multiplier (simplified)
        gigscore_multiplier = 1.0  # Would be fetched from GigScore service
        final_premium = final_premium * gigscore_multiplier
        
        return {
            "status": "comprehensive_risk_calculated",
            "timestamp": datetime.utcnow().isoformat(),
            
            # Risk components
            "risk_components": {
                "weather": {
                    "base_probability": weather_result["base_weather_prob"],
                    "effective_probability": weather_result["p_effective_weather"],
                    "risk_level": weather_result["risk_level"],
                    "spillover_effect": weather_result["p_spillover"]
                },
                "dark_store": {
                    "failure_probability": round(p_store_failure, 3),
                    "risk_level": self._classify_risk_level(p_store_failure)
                },
                "traffic": {
                    "congestion_probability": round(p_traffic, 3),
                    "current_speed_kmh": current_speed_kmh,
                    "risk_level": self._classify_risk_level(p_traffic)
                },
                "civic": {
                    "disruption_probability": round(p_civic, 3),
                    "curfew_active": curfew_active,
                    "strikes": strike_ongoing,
                    "risk_level": self._classify_risk_level(p_civic)
                },
                "fraud": {
                    "fraud_probability": round(p_fraud, 3),
                    "fraud_score": fraud_score,
                    "risk_level": self._classify_fraud_risk(fraud_score)
                }
            },
            
            # Final risk metrics
            "effective_risk": {
                "p_effective": round(p_effective, 3),
                "combined_civic_risk": round(combined_risk, 3),
                "overall_risk_level": self._classify_risk_level(p_effective)
            },
            
            # Premium calculation breakdown
            "premium_calculation": {
                "coverage_limit": coverage_limit,
                "base_premium": round(base_premium, 2),
                "platform_fee": self.platform_fee,
                "final_weekly_premium": round(final_premium, 2),
                "daily_premium": round(final_premium / 7, 2)
            },
            
            # Coefficients
            "coefficients": {
                "beta": round(beta, 3),
                "zone_vulnerability": round(zone_vuln, 3),
                "weather_uncertainty": round(weather_result["uncertainty_beta"], 3),
                "gigscore_multiplier": gigscore_multiplier
            },
            
            # Recommendations
            "recommendations": self._generate_risk_recommendations(
                p_effective, fraud_score, curfew_active, strike_ongoing
            )
        }
    
    def _classify_risk_level(self, probability: float) -> str:
        """Classify risk level based on probability"""
        if probability >= 0.75:
            return "CRITICAL"
        elif probability >= 0.5:
            return "HIGH"
        elif probability >= 0.25:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _classify_fraud_risk(self, fraud_score: float) -> str:
        """Classify fraud risk based on score"""
        if fraud_score >= 70:
            return "HIGH"
        elif fraud_score >= 40:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _generate_risk_recommendations(
        self,
        effective_risk: float,
        fraud_score: float,
        curfew: bool,
        strike: bool
    ) -> Dict:
        """Generate actionable recommendations based on risk analysis"""
        recommendations = {
            "policy_action": "ACCEPT",  # default
            "additional_checks": [],
            "premium_adjustment": "none"
        }
        
        if effective_risk >= 0.75:
            recommendations["policy_action"] = "REVIEW"
            recommendations["premium_adjustment"] = "increase_20_percent"
        
        if fraud_score >= 70:
            recommendations["additional_checks"].append("BLOCK - High fraud risk")
            recommendations["policy_action"] = "REJECT"
        elif fraud_score >= 40:
            recommendations["additional_checks"].append("Manual review required")
            recommendations["premium_adjustment"] = "increase_15_percent"
        
        if curfew:
            recommendations["additional_checks"].append("Curfew active - monitor claims")
        
        if strike:
            recommendations["additional_checks"].append("Strike ongoing - cluster detection enabled")
        
        return recommendations
