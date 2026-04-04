"""
ChillInsure Fraud Detection Service
Detects GPS spoofing, fake inactivity, fake relocation, and coordinated fraud rings
Uses Isolation Forest + DBSCAN + behavioral analysis
"""

import math
import json
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN

@dataclass
class GPSPoint:
    lat: float
    lng: float
    timestamp: str
    accuracy: float

class FraudDetector:
    """
    Advanced fraud detection system combining:
    1. GPS spoofing detection (speed anomaly, teleportation)
    2. Fake inactivity detection (GPS stationary but orders active)
    3. Behavioral pattern analysis (timing, consistency)
    4. Isolation Forest (univariate anomaly)
    5. DBSCAN (fraud ring clustering)
    """
    
    def __init__(self):
        self.speed_threshold_kmh = 150  # Impossible speed = teleportation
        self.accuracy_threshold = 100   # Meters - poor accuracy flag
        self.isolation_forest = IsolationForest(
            contamination=0.1,  # Expect ~10% anomalies
            random_state=42,
            n_estimators=100
        )
        self.fraud_ring_detector = DBSCAN(eps=0.5, min_samples=3)
    
    def calculate_gps_speed(
        self,
        lat1: float,
        lng1: float,
        lat2: float,
        lng2: float,
        time_seconds: float
    ) -> float:
        """Calculate speed in km/h between two GPS points"""
        R = 6371  # Earth radius km
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = (math.sin(delta_lat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance_km = R * c
        
        if time_seconds <= 0:
            return 0
        
        hours = time_seconds / 3600
        return distance_km / hours if hours > 0 else 0
    
    def detect_gps_spoofing(self, gps_trail: List[Dict]) -> Dict:
        """
        Detect GPS spoofing: impossible speeds (>150 km/h)
        Returns: verdict, confidence, anomalies
        """
        if len(gps_trail) < 2:
            return {
                "status": "insufficient_data",
                "spoofing_detected": False,
                "confidence": 0,
                "anomalies": []
            }
        
        anomalies = []
        suspicious_jumps = 0
        
        for i in range(len(gps_trail) - 1):
            p1 = gps_trail[i]
            p2 = gps_trail[i + 1]
            
            try:
                time1 = datetime.fromisoformat(p1["timestamp"].replace("Z", "+00:00"))
                time2 = datetime.fromisoformat(p2["timestamp"].replace("Z", "+00:00"))
                time_diff = (time2 - time1).total_seconds()
            except:
                continue
            
            if time_diff <= 0:
                continue
            
            speed = self.calculate_gps_speed(
                p1["lat"], p1["lng"],
                p2["lat"], p2["lng"],
                time_diff
            )
            
            # Flag impossible speeds
            if speed > self.speed_threshold_kmh:
                suspicious_jumps += 1
                anomalies.append({
                    "type": "teleportation",
                    "from": {"lat": p1["lat"], "lng": p1["lng"]},
                    "to": {"lat": p2["lat"], "lng": p2["lng"]},
                    "calculated_speed_kmh": round(speed, 1),
                    "time_gap_seconds": int(time_diff),
                    "severity": "HIGH"
                })
        
        spoofing_detected = suspicious_jumps >= 1  # Even one teleportation is suspicious
        confidence = min(100, suspicious_jumps * 40)  # 40% per teleportation
        
        return {
            "status": "analysis_complete",
            "spoofing_detected": spoofing_detected,
            "confidence": confidence,
            "teleportation_count": suspicious_jumps,
            "anomalies": anomalies
        }
    
    def detect_fake_inactivity(
        self,
        gps_trail: List[Dict],
        orders_during_period: int = 0,
        expected_activity_minutes: int = 120
    ) -> Dict:
        """
        Detect fake inactivity: GPS stationary but orders active
        Calculation: GPS variance vs order count
        """
        if len(gps_trail) < 3:
            return {
                "status": "insufficient_data",
                "fake_inactivity_detected": False,
                "confidence": 0
            }
        
        # Calculate average GPS variance
        lats = [p["lat"] for p in gps_trail]
        lngs = [p["lng"] for p in gps_trail]
        
        lat_variance = np.var(lats) if len(lats) > 1 else 0
        lng_variance = np.var(lngs) if len(lngs) > 1 else 0
        total_variance = lat_variance + lng_variance
        
        # Very low variance = stationary
        is_stationary = total_variance < 0.00001
        
        # But if orders were active, this is suspicious
        variance_vs_activity_ratio = total_variance / max(1, orders_during_period)
        
        fake_inactivity_detected = is_stationary and orders_during_period > 2
        confidence = 80 if fake_inactivity_detected else 10
        
        return {
            "status": "analysis_complete",
            "fake_inactivity_detected": fake_inactivity_detected,
            "confidence": confidence,
            "gps_variance": float(total_variance),
            "is_stationary": is_stationary,
            "orders_during_stationary_period": orders_during_period,
            "variance_activity_ratio": round(variance_vs_activity_ratio, 6)
        }
    
    def detect_fake_relocation(
        self,
        gps_trail: List[Dict],
        zone_boundaries: Dict = None
    ) -> Dict:
        """
        Detect fake relocation: sudden zone jump without transition
        Returns: verdict, confidence, jump_details
        """
        if len(gps_trail) < 2:
            return {
                "status": "insufficient_data",
                "fake_relocation_detected": False,
                "confidence": 0
            }
        
        # Define Bangalore zones (simplified)
        zones = {
            "HSR_Layout": (13.0827, 77.6055, 1.0),  # (lat, lng, radius_km)
            "Koramangala": (12.9352, 77.6245, 1.0),
            "Whitefield": (12.9698, 77.7499, 1.2),
            "JP_Nagar": (12.9352, 77.5945, 1.0),
            "Indiranagar": (13.0359, 77.6245, 1.0),
            "MG_Road": (13.0352, 77.6245, 1.0),
        }
        
        def get_zone(lat: float, lng: float) -> Optional[str]:
            """Find which zone a coordinate is in"""
            for zone_name, (z_lat, z_lng, radius) in zones.items():
                dist = self.calculate_gps_speed(lat, lng, z_lat, z_lng, 1) * 1000 / 3.6  # meters
                if dist <= radius * 1000:
                    return zone_name
            return None
        
        zone_jumps = []
        prev_zone = None
        
        for i, point in enumerate(gps_trail):
            current_zone = get_zone(point["lat"], point["lng"])
            
            if prev_zone and current_zone and prev_zone != current_zone:
                zone_jumps.append({
                    "from_zone": prev_zone,
                    "to_zone": current_zone,
                    "point_index": i,
                    "timestamp": point["timestamp"]
                })
            
            prev_zone = current_zone
        
        # Multiple sudden zone jumps = suspicious
        rapid_jumps = len(zone_jumps) > 1
        confidence = min(100, len(zone_jumps) * 30)
        
        return {
            "status": "analysis_complete",
            "fake_relocation_detected": rapid_jumps,
            "confidence": confidence,
            "zone_jump_count": len(zone_jumps),
            "jumps": zone_jumps
        }
    
    def behavioral_anomaly_score(
        self,
        gps_trail: List[Dict],
        trigger_type: str
    ) -> Dict:
        """
        Calculate behavioral anomaly using Isolation Forest
        Generates features from GPS trail for ML detection
        """
        if len(gps_trail) < 3:
            return {
                "status": "insufficient_data",
                "anomaly_score": 0,
                "is_anomaly": False
            }
        
        try:
            # Feature engineering from GPS trail
            features = []
            speeds = []
            
            for i in range(len(gps_trail) - 1):
                p1, p2 = gps_trail[i], gps_trail[i + 1]
                try:
                    time1 = datetime.fromisoformat(p1["timestamp"].replace("Z", "+00:00"))
                    time2 = datetime.fromisoformat(p2["timestamp"].replace("Z", "+00:00"))
                    time_diff = (time2 - time1).total_seconds()
                except:
                    continue
                
                if time_diff > 0:
                    speed = self.calculate_gps_speed(
                        p1["lat"], p1["lng"],
                        p2["lat"], p2["lng"],
                        time_diff
                    )
                    speeds.append(speed)
            
            if not speeds:
                return {"status": "no_speeds_calculated", "anomaly_score": 0}
            
            # Create feature vector
            avg_speed = np.mean(speeds)
            max_speed = np.max(speeds)
            speed_variance = np.var(speeds)
            
            # Expected speeds by trigger (km/h)
            expected_speeds = {
                "rain": (2, 10),
                "aqi": (3, 12),
                "curfew": (0, 5),
                "heat": (3, 12),
                "outage": (5, 20),
                "strike": (0, 8),
            }
            
            min_exp, max_exp = expected_speeds.get(trigger_type, (5, 25))
            speed_deviation = 0
            
            if avg_speed < min_exp:
                speed_deviation = (min_exp - avg_speed) / max(1, min_exp)
            elif avg_speed > max_exp:
                speed_deviation = (avg_speed - max_exp) / max(1, max_exp)
            
            # Feature vector for Isolation Forest
            feature_vector = np.array([
                [avg_speed, max_speed, speed_variance, speed_deviation, len(speeds)]
            ])
            
            # Train and predict (in production: use pre-trained model)
            self.isolation_forest.fit(feature_vector)
            prediction = self.isolation_forest.predict(feature_vector)
            anomaly_score = self.isolation_forest.score_samples(feature_vector)[0]
            
            # Convert to 0-100 scale
            normalized_score = max(0, min(100, -anomaly_score * 50))  # Normalize
            is_anomaly = prediction[0] == -1
            
            return {
                "status": "analysis_complete",
                "anomaly_score": round(normalized_score, 1),
                "is_anomaly": bool(is_anomaly),
                "features": {
                    "avg_speed_kmh": round(avg_speed, 2),
                    "max_speed_kmh": round(max_speed, 2),
                    "speed_variance": round(speed_variance, 2),
                    "speed_deviation_percent": round(speed_deviation * 100, 1)
                },
                "threshold_exceeded": is_anomaly
            }
        except Exception as e:
            return {"status": "error", "error": str(e), "anomaly_score": 0}
    
    def detect_fraud_rings(self, riders_data: List[Dict]) -> Dict:
        """
        Detect coordinated fraud rings using DBSCAN clustering
        Identifies riders making the same suspicious claims
        """
        if len(riders_data) < 3:
            return {
                "status": "insufficient_data",
                "fraud_rings_detected": False,
                "rings": []
            }
        
        try:
            # Create feature matrix (simplified: lat/lng + timestamp + earnings drop)
            features = []
            rider_ids = []
            
            for rider in riders_data:
                if "location" in rider and "earnings" in rider:
                    features.append([
                        rider["location"]["lat"],
                        rider["location"]["lng"],
                        rider["earnings"]["expectedEarnings"],
                        rider["earnings"]["actualEarnings"]
                    ])
                    rider_ids.append(rider.get("uid", "unknown"))
            
            if len(features) < 3:
                return {"status": "insufficient_data", "fraud_rings_detected": False}
            
            # Normalize features
            features_array = np.array(features)
            features_normalized = (features_array - features_array.mean(axis=0)) / (features_array.std(axis=0) + 1e-6)
            
            # DBSCAN clustering
            clusters = self.fraud_ring_detector.fit_predict(features_normalized)
            
            # Find suspicious clusters (noise = -1, anomalies)
            rings = []
            for cluster_id in set(clusters):
                if cluster_id != -1:  # Skip noise
                    members = [rider_ids[i] for i, c in enumerate(clusters) if c == cluster_id]
                    if len(members) >= 2:  # At least 2 members
                        rings.append({
                            "ring_id": f"ring_{cluster_id}",
                            "member_count": len(members),
                            "member_uids": members,
                            "severity": "HIGH" if len(members) >= 3 else "MEDIUM"
                        })
            
            return {
                "status": "analysis_complete",
                "fraud_rings_detected": len(rings) > 0,
                "rings": rings,
                "total_suspicious_clusters": len(rings)
            }
        except Exception as e:
            return {"status": "error", "error": str(e), "fraud_rings_detected": False}
    
    def generate_fraud_score(
        self,
        gps_trail: List[Dict],
        trigger_type: str,
        orders_during_period: int = 0,
        riders_context: List[Dict] = None
    ) -> Dict:
        """
        MAIN FUNCTION: Generate comprehensive fraud score (0-100)
        0 = Clean, 100 = Definite Fraud
        """
        
        scores = {}
        
        # 1. GPS Spoofing Detection
        spoofing_result = self.detect_gps_spoofing(gps_trail)
        scores["spoofing"] = spoofing_result.get("confidence", 0)
        
        # 2. Fake Inactivity Detection
        inactivity_result = self.detect_fake_inactivity(gps_trail, orders_during_period)
        scores["fake_inactivity"] = inactivity_result.get("confidence", 0)
        
        # 3. Fake Relocation Detection
        relocation_result = self.detect_fake_relocation(gps_trail)
        scores["fake_relocation"] = relocation_result.get("confidence", 0)
        
        # 4. Behavioral Anomaly
        behavior_result = self.behavioral_anomaly_score(gps_trail, trigger_type)
        scores["behavioral_anomaly"] = behavior_result.get("anomaly_score", 0)
        
        # 5. Fraud Ring Detection (if riders context provided)
        ring_detection = {"fraud_rings_detected": False}
        if riders_context:
            ring_detection = self.detect_fraud_rings(riders_context)
        scores["ring_involvement"] = 60 if ring_detection.get("fraud_rings_detected") else 0
        
        # Weighted average (different weights for different signals)
        weights = {
            "spoofing": 0.35,           # Highest: spoofing is definitive
            "fake_inactivity": 0.25,    # High: obvious contradiction
            "behavioral_anomaly": 0.20, # Medium: ML-based, less conclusive
            "fake_relocation": 0.15,    # Medium: could be legitimate
            "ring_involvement": 0.05    # Lower: coordination is harder to prove
        }
        
        fraud_score = sum(scores[k] * weights.get(k, 0) for k in scores)
        
        # Determine fraud verdict
        if fraud_score >= 70:
            fraud_verdict = "FRAUD"
            risk_level = "HIGH"
        elif fraud_score >= 40:
            fraud_verdict = "SUSPICIOUS"
            risk_level = "MEDIUM"
        else:
            fraud_verdict = "CLEAN"
            risk_level = "LOW"
        
        return {
            "status": "fraud_score_calculated",
            "fraud_score": round(fraud_score, 1),
            "fraud_verdict": fraud_verdict,
            "risk_level": risk_level,
            "confidence": min(100, int(abs(fraud_score - 50) * 2)),  # Higher confidence at extremes
            "signals": {
                "gps_spoofing": round(scores["spoofing"], 1),
                "fake_inactivity": round(scores["fake_inactivity"], 1),
                "fake_relocation": round(scores["fake_relocation"], 1),
                "behavioral_anomaly": round(scores["behavioral_anomaly"], 1),
                "fraud_ring_involvement": round(scores["ring_involvement"], 1)
            },
            "details": {
                "spoofing": spoofing_result.get("teleportation_count", 0),
                "inactivity": inactivity_result.get("orders_during_stationary_period", 0),
                "relocation_jumps": relocation_result.get("zone_jump_count", 0),
                "anomaly_score": behavior_result.get("anomaly_score", 0),
                "rings_detected": len(ring_detection.get("rings", []))
            },
            "recommendations": self._get_recommendations(fraud_verdict, scores)
        }
    
    def _get_recommendations(self, verdict: str, scores: Dict) -> List[str]:
        """Generate actionable recommendations based on fraud analysis"""
        recommendations = []
        
        if verdict == "FRAUD":
            recommendations.append("REJECT claim immediately")
            recommendations.append("Flag rider account for review")
            recommendations.append("Check for coordinated attacks")
        elif verdict == "SUSPICIOUS":
            recommendations.append("PARTIAL payout recommended")
            recommendations.append("Request additional verification")
            recommendations.append("Monitor rider for patterns")
        else:
            recommendations.append("APPROVE claim")
            recommendations.append("Standard processing")
        
        if scores.get("spoofing", 0) > 50:
            recommendations.append("HIGH ALERT: GPS spoofing detected")
        if scores.get("ring_involvement", 0) > 50:
            recommendations.append("Investigate fraud ring involvement")
        
        return recommendations
