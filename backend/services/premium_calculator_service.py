"""
Premium Calculator Service - GigProtect Insurance Pricing
Calculates premiums with GigScore-based discounts and renewal logic
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
from db.supabase_client import get_supabase_client


class PremiumCalculator:
    """Calculate insurance premiums with GigScore discount"""
    
    # Base premium thresholds
    MIN_COVERAGE = 1000
    MAX_COVERAGE = 50000
    PLATFORM_FEE = 10.0
    
    # GigScore discount formula: discount % = gigscore * 0.5
    # E.g., GigScore 80 = 40% discount, GigScore 100 = 50% discount
    GIGSCORE_DISCOUNT_MULTIPLIER = 0.5
    
    # Age multiplier: older policies cost more to renew
    # Each renewal adds 5% to base cost
    RENEWAL_COST_INCREMENT = 0.05
    
    @staticmethod
    def calculate_gigscore_discount(gigscore: int) -> float:
        """
        Calculate discount percentage based on GigScore
        Formula: discount_pct = (gigscore / 100) * 50
        
        Examples:
        - GigScore 100 → 50% discount
        - GigScore 80 → 40% discount
        - GigScore 60 → 30% discount
        - GigScore 50 → 25% discount
        - GigScore 0 → 0% discount
        """
        if gigscore < 0:
            return 0.0
        if gigscore > 100:
            gigscore = 100
        
        discount_pct = (gigscore / 100) * 50
        return discount_pct
    
    @staticmethod
    def calculate_base_premium(
        coverage_amount: float,
        weather_probability: float,
        civic_probability: float,
        platform_fee: float = PLATFORM_FEE
    ) -> Dict:
        """
        Calculate base premium without discounts
        
        Formula:
        - union_probability = max(weather_prob, civic_prob)  # Or use: 1 - (1-p_w)(1-p_c)
        - base_premium = union_probability × coverage_amount
        - total = base_premium + platform_fee
        """
        # Union probability: Probability of at least one event occurring
        union_prob = 1 - ((1 - weather_probability) * (1 - civic_probability))
        
        base_premium = union_prob * coverage_amount
        total_premium = base_premium + platform_fee
        
        return {
            "union_probability": round(union_prob, 4),
            "weather_probability": weather_probability,
            "civic_probability": civic_probability,
            "base_premium": round(base_premium, 2),
            "platform_fee": platform_fee,
            "total_premium_before_discount": round(total_premium, 2)
        }
    
    @staticmethod
    def apply_discount(
        total_premium: float,
        discount_percentage: float
    ) -> Dict:
        """
        Apply discount to premium
        
        discount_percentage: 0-50 (from GigScore)
        """
        discount_amount = total_premium * (discount_percentage / 100)
        final_premium = total_premium - discount_amount
        
        return {
            "discount_percentage": round(discount_percentage, 2),
            "discount_amount": round(discount_amount, 2),
            "final_premium": round(final_premium, 2)
        }
    
    @staticmethod
    def calculate_renewal_multiplier(renewal_count: int) -> float:
        """
        Calculate renewal multiplier based on number of renewals
        
        renewal_count 0: 1.0x (first purchase)
        renewal_count 1: 1.05x (first renewal)
        renewal_count 2: 1.10x (second renewal)
        etc.
        """
        multiplier = 1.0 + (renewal_count * RENEWAL_COST_INCREMENT)
        return multiplier
    
    @staticmethod
    async def generate_quote(
        rider_id: str,
        zone_id: str,
        coverage_amount: float = 5000,
        weather_probability: float = 0.35,
        civic_probability: float = 0.20,
        renewal_count: int = 0
    ) -> Dict:
        """
        Generate complete premium quote with GigScore discount
        
        Returns: Complete quote with itemized breakdown
        """
        supabase = get_supabase_client()
        
        # Get rider's GigScore
        gigscore_response = supabase.table("gigscore").select("score").filter(
            "uid", "eq", rider_id
        ).execute()
        
        gigscore = 65  # Default
        if gigscore_response.data and len(gigscore_response.data) > 0:
            gigscore = gigscore_response.data[0].get("score", 65)
        
        # Validate coverage
        coverage_amount = max(MIN_COVERAGE, min(MAX_COVERAGE, coverage_amount))
        
        # Calculate base premium
        base_calc = PremiumCalculator.calculate_base_premium(
            coverage_amount=coverage_amount,
            weather_probability=weather_probability,
            civic_probability=civic_probability
        )
        
        # Calculate discount from GigScore
        discount_pct = PremiumCalculator.calculate_gigscore_discount(gigscore)
        discount_calc = PremiumCalculator.apply_discount(
            total_premium=base_calc["total_premium_before_discount"],
            discount_percentage=discount_pct
        )
        
        # Apply renewal multiplier (increases premium for renewals)
        renewal_multiplier = PremiumCalculator.calculate_renewal_multiplier(renewal_count)
        final_premium = discount_calc["final_premium"] * renewal_multiplier
        
        # Build quote response
        quote = {
            "rider_id": rider_id,
            "zone_id": zone_id,
            "coverage_amount": coverage_amount,
            "gigscore": gigscore,
            "renewal_count": renewal_count,
            
            # Risk factors
            "risk_profile": {
                "weather_probability": base_calc["weather_probability"],
                "civic_probability": base_calc["civic_probability"],
                "union_probability": base_calc["union_probability"]
            },
            
            # Premium breakdown
            "premium_breakdown": {
                "base_premium": base_calc["base_premium"],
                "platform_fee": base_calc["platform_fee"],
                "subtotal": base_calc["total_premium_before_discount"],
                "discount_percentage": discount_calc["discount_percentage"],
                "discount_amount": discount_calc["discount_amount"],
                "after_discount": discount_calc["final_premium"],
                "renewal_multiplier": round(renewal_multiplier, 2),
                "final_premium": round(final_premium, 2)
            },
            
            # Additional info
            "policy_term_days": 7,
            "valid_until": (datetime.utcnow() + timedelta(minutes=15)).isoformat(),
            "quote_timestamp": datetime.utcnow().isoformat(),
            
            # Message for rider
            "message": f"✅ Premium: ₹{final_premium} • Coverage: ₹{coverage_amount} • GigScore Discount: {discount_calc['discount_percentage']}%"
        }
        
        return quote


async def calculate_quick_quote(
    rider_id: str,
    zone_id: str,
    coverage_amount: float = 5000,
    weather_probability: float = 0.35,
    civic_probability: float = 0.20,
    renewal_count: int = 0
) -> Dict:
    """
    Public function to get quick quote
    Called by gig_protect_route endpoints
    """
    return await PremiumCalculator.generate_quote(
        rider_id=rider_id,
        zone_id=zone_id,
        coverage_amount=coverage_amount,
        weather_probability=weather_probability,
        civic_probability=civic_probability,
        renewal_count=renewal_count
    )
