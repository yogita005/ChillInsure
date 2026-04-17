"""
Earning Velocity Service
Calculates rider's earning velocity (₹/hour) based on historical data
"""

from typing import Optional
from models.gig_protect_model import EarningVelocity
from datetime import datetime


async def get_or_calculate_earning_velocity(
    rider_id: str,
    days_lookback: int = 30
) -> Optional[EarningVelocity]:
    """
    Get or calculate rider's earning velocity
    Velocity = Total earnings / Total hours worked
    """
    try:
        # Mock calculation - in production this would query delivery history
        velocity = EarningVelocity(
            rider_id=rider_id,
            daily_earnings=750.0,
            daily_delivery_hours=5.0,
            earning_velocity=150.0,  # ₹150/hour
            weekly_earnings=3750.0,
            confidence_score=92.0,
            data_points=28,
            calculation_date=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        return velocity
    except Exception as e:
        print(f"[ERROR] Failed to calculate earning velocity: {e}")
        return None
