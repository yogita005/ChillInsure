"""
ChillInsure Smart Response Engine
Implements the decision tree: REDIRECT → alternative store suggestion
                              PAY → calculate payout
                              PARTIAL → combine both
"""

from typing import Dict, List, Optional
from datetime import datetime
import math

class SmartResponseEngine:
    """
    Smart response engine that handles:
    1. REDIRECT: Suggest alternative store, show route, offer incentive
    2. PAY: Calculate income loss, trigger payout
    3. PARTIAL: Combine both (partial payout + relocation incentive)
    """
    
    def __init__(self):
        # Platform settings
        self.platform_subsidy_percent = {
            "redirect": 0.40,      # Platform covers 40% of loss on relocation
            "partial": 0.60,       # Platform covers 60% of partial approval
            "pay": 1.0             # Platform covers 100% on full approval
        }
        self.max_incentive = 1000  # Max relocation incentive (₹)
        self.min_incentive = 100   # Min relocation incentive (₹)
    
    def calculate_earning_velocity(
        self,
        daily_earning_estimate: float,
        work_hours: int = 8
    ) -> float:
        """
        Calculate earning velocity (₹/minute)
        Velocity = Daily earnings / (work hours × 60)
        """
        if work_hours <= 0:
            work_hours = 8
        
        velocity = daily_earning_estimate / (work_hours * 60)
        return max(0, velocity)
    
    def calculate_income_loss(
        self,
        expected_earnings: float,
        actual_earnings: float
    ) -> Dict:
        """
        Calculate income loss from claim
        Returns: loss amount, loss percentage
        """
        if expected_earnings <= 0:
            return {
                "gross_loss": 0,
                "loss_percentage": 0,
                "calculation_valid": False
            }
        
        gross_loss = expected_earnings - actual_earnings
        loss_percentage = (gross_loss / expected_earnings) * 100
        
        return {
            "gross_loss": max(0, gross_loss),
            "loss_percentage": max(0, loss_percentage),
            "expected_earnings": expected_earnings,
            "actual_earnings": actual_earnings,
            "calculation_valid": True
        }
    
    def calculate_relocation_incentive(
        self,
        opportunity_loss: float,
        platform_coverage_percent: float = 0.40
    ) -> Dict:
        """
        Calculate relocation incentive to encourage partner to move stores
        
        Logic: Platform wants to minimize total loss by incentivizing relocation
        Incentive = min(opportunity_loss × coverage%, max_incentive), max(min_incentive, ...)
        """
        base_incentive = opportunity_loss * platform_coverage_percent
        
        # Clamp between min and max
        incentive = max(
            self.min_incentive,
            min(self.max_incentive, base_incentive)
        )
        
        return {
            "base_incentive": round(base_incentive, 2),
            "final_incentive": round(incentive, 2),
            "coverage_percent": platform_coverage_percent * 100,
            "incentive_cap_applied": incentive >= self.max_incentive,
            "incentive_minimum_applied": incentive <= self.min_incentive
        }
    
    def determine_payout_amount(
        self,
        verdict: str,
        gross_loss: float,
        platform_coverage_percent: float = None
    ) -> Dict:
        """
        Determine final payout based on verdict
        
        PAY: 100% of loss
        PARTIAL: 60% of loss
        REDIRECT: 40% of loss (rest covered by relocation incentive)
        """
        
        if verdict == "PAY":
            payout_percent = 1.0
        elif verdict == "PARTIAL":
            payout_percent = 0.6
        elif verdict == "REDIRECT":
            payout_percent = 0.4
        else:
            payout_percent = 0
        
        payout_amount = gross_loss * payout_percent
        
        return {
            "verdict": verdict,
            "gross_loss": round(gross_loss, 2),
            "payout_percent": payout_percent * 100,
            "payout_amount": round(payout_amount, 2),
            "payout_type": self._classify_payout_type(verdict)
        }
    
    def build_redirect_response(
        self,
        alternative_store: Dict,
        gross_loss: float,
        partner_name: str = "Partner",
        zone: str = "HSR Layout"
    ) -> Dict:
        """
        Build REDIRECT response with full context
        Partner should move to alternative store
        """
        
        # Calculate incentive to encourage relocation
        incentive_info = self.calculate_relocation_incentive(gross_loss, 0.40)
        
        # Calculate partial payout for lost earnings
        payout_info = self.determine_payout_amount("REDIRECT", gross_loss)
        
        return {
            "response_type": "REDIRECT",
            "timestamp": datetime.utcnow().isoformat(),
            
            "message": f"Hi {partner_name}! Your current zone ({zone}) had a disruption. "
                      f"We've identified a nearby active store with {alternative_store.get('store', {}).get('name', 'an active store')}. "
                      f"Relocate there to avoid further losses!",
            
            "action": {
                "type": "relocate_to_store",
                "reason": "current_store_disrupted",
                "priority": "high"
            },
            
            "alternative_store": alternative_store.get("store", {}),
            
            "routing": alternative_store.get("routing", {}),
            
            "incentive": {
                "amount": int(incentive_info["final_incentive"]),
                "message": f"₹{int(incentive_info['final_incentive'])} relocation boost",
                "valid_for_minutes": 30,
                "terms": "Accepted when you go online at new store"
            },
            
            "payout": {
                "immediate": int(payout_info["payout_amount"]),
                "message": f"₹{int(payout_info['payout_amount'])} for losses before relocation",
                "processing_time": "Instant (UPI)"
            },
            
            "total_recovery": {
                "loss": round(gross_loss, 2),
                "payout": int(payout_info["payout_amount"]),
                "incentive": int(incentive_info["final_incentive"]),
                "total_recovery": int(payout_info["payout_amount"] + incentive_info["final_incentive"]),
                "coverage_percent": round(
                    ((payout_info["payout_amount"] + incentive_info["final_incentive"]) / gross_loss * 100)
                    if gross_loss > 0 else 0,
                    1
                )
            },
            
            "map_context": {
                "show_current_location": True,
                "show_target_store": True,
                "show_route": True,
                "highlight_zone": zone
            }
        }
    
    def build_pay_response(
        self,
        gross_loss: float,
        partner_name: str = "Partner",
        trigger_type: str = "rain",
        zone: str = "HSR Layout"
    ) -> Dict:
        """
        Build PAY response with full payout details
        """
        
        payout_info = self.determine_payout_amount("PAY", gross_loss)
        
        return {
            "response_type": "PAY",
            "timestamp": datetime.utcnow().isoformat(),
            
            "message": f"Claim approved, {partner_name}! "
                      f"The {trigger_type} disruption in {zone} was verified by our AI Council. "
                      f"Full compensation being processed.",
            
            "decision": {
                "verdict": "APPROVED",
                "confidence": 95,
                "reason": "All 5 AI agents confirmed disruption + income loss",
                "appeal_available": True
            },
            
            "payout": {
                "gross_loss": round(gross_loss, 2),
                "approved_payout": int(payout_info["payout_amount"]),
                "payout_percent": 100,
                "processing_time": "Instant",
                "payment_method": "UPI Direct",
                "transaction_id": f"TXN_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                "status": "PROCESSING"
            },
            
            "breakdown": {
                "expected_earnings": "₹1200",
                "actual_earnings": "₹350",
                "loss": f"₹{int(gross_loss)}",
                "payout": f"₹{int(payout_info['payout_amount'])}"
            },
            
            "next_steps": [
                "Check your UPI app - payment incoming",
                "Loss will be reflected in your account within 2 hours",
                "Review 'My Claims' to see detailed breakdown",
                "You can still file claims for today if disruption continues"
            ]
        }
    
    def build_partial_response(
        self,
        gross_loss: float,
        alternative_store: Optional[Dict] = None,
        partner_name: str = "Partner",
        trigger_type: str = "rain",
        zone: str = "HSR Layout",
        reason: str = "moderate_verification"
    ) -> Dict:
        """
        Build PARTIAL response combining payout + relocation option
        """
        
        payout_info = self.determine_payout_amount("PARTIAL", gross_loss)
        incentive_info = self.calculate_relocation_incentive(gross_loss * 0.4, 0.40)
        
        response = {
            "response_type": "PARTIAL",
            "timestamp": datetime.utcnow().isoformat(),
            
            "message": f"Partial claim approved, {partner_name}! "
                      f"We've verified partial impact from {trigger_type} in {zone}. "
                      f"Receiving partial compensation + optional relocation incentive.",
            
            "decision": {
                "verdict": "PARTIAL_APPROVED",
                "confidence": 78,
                "reason": reason,
                "uncertainty": "Some signals inconclusive - applying conservative payout",
                "appeal_available": True
            },
            
            "payout": {
                "gross_loss": round(gross_loss, 2),
                "approved_payout": int(payout_info["payout_amount"]),
                "payout_percent": 60,
                "processing_time": "Instant",
                "payment_method": "UPI Direct",
                "status": "PROCESSING"
            },
            
            "relocation_option": {
                "available": alternative_store is not None,
                "incentive": int(incentive_info["final_incentive"]) if alternative_store else 0,
                "message": "Optional: Move to nearby store for additional ₹{} boost".format(
                    int(incentive_info["final_incentive"])
                ) if alternative_store else None
            },
            
            "total_potential_recovery": {
                "payout_only": int(payout_info["payout_amount"]),
                "payout_plus_incentive": int(payout_info["payout_amount"] + incentive_info["final_incentive"]),
                "max_recovery_percent": round(
                    ((payout_info["payout_amount"] + incentive_info["final_incentive"]) / max(1, gross_loss) * 100),
                    1
                )
            },
            
            "next_steps": [
                f"₹{int(payout_info['payout_amount'])} will arrive via UPI in 2 hours",
                "If you relocate to nearby store: additional ₹{}".format(int(incentive_info["final_incentive"])) if alternative_store else "No nearby stores available"
            ]
        }
        
        if alternative_store:
            response["alternative_store"] = alternative_store.get("store", {})
            response["routing"] = alternative_store.get("routing", {})
        
        return response
    
    def build_reject_response(
        self,
        partner_name: str = "Partner",
        fraud_detected: bool = False
    ) -> Dict:
        """
        Build REJECT response with clear reasoning
        """
        
        if fraud_detected:
            reason = "Claim flagged for fraud indicators - manual review required"
            message = f"Hi {partner_name}, your claim requires additional verification due to suspicious patterns. " \
                     f"Our fraud detection system flagged this claim. Support team will contact you."
            status = "FRAUD_REVIEW"
        else:
            reason = "Unable to verify claim authenticity"
            message = f"Hi {partner_name}, we couldn't verify this claim with sufficient confidence. " \
                     f"Insufficient evidence of disruption or income loss."
            status = "INSUFFICIENT_EVIDENCE"
        
        return {
            "response_type": "REJECT",
            "timestamp": datetime.utcnow().isoformat(),
            
            "message": message,
            
            "decision": {
                "verdict": "REJECTED",
                "confidence": 85,
                "reason": reason,
                "status": status
            },
            
            "appeal": {
                "available": True,
                "process": "Contact support@chilinsure.in with additional evidence",
                "turnaround": "24 hours"
            },
            
            "next_steps": [
                "Review the detailed feedback below",
                "Gather additional evidence if available",
                "File an appeal if you believe this is incorrect",
                f"Contact: support@chilinsure.com"
            ]
        }
    
    def build_full_response(
        self,
        verdict: str,
        claim_data: Dict,
        alternative_store: Optional[Dict] = None,
        fraud_detected: bool = False,
        fraud_score: float = 0
    ) -> Dict:
        """
        MAIN FUNCTION: Build complete smart response based on verdict
        """
        
        gross_loss = claim_data.get("expectedEarnings", 1000) - claim_data.get("actualEarnings", 500)
        partner_name = claim_data.get("partner", {}).get("name", "Partner")
        zone = claim_data.get("location", {}).get("zone", "HSR Layout")
        trigger = claim_data.get("trigger", "rain")
        
        if verdict == "REDIRECT":
            return self.build_redirect_response(alternative_store or {}, gross_loss, partner_name, zone)
        elif verdict == "PAY":
            return self.build_pay_response(gross_loss, partner_name, trigger, zone)
        elif verdict == "PARTIAL":
            return self.build_partial_response(gross_loss, alternative_store, partner_name, trigger, zone)
        else:  # REJECT
            return self.build_reject_response(partner_name, fraud_detected)
    
    def _classify_payout_type(self, verdict: str) -> str:
        """Classify payout type"""
        map_type = {
            "PAY": "full_payout",
            "PARTIAL": "partial_payout",
            "REDIRECT": "relocation_with_partial",
            "REJECT": "no_payout"
        }
        return map_type.get(verdict, "unknown")
