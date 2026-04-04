from pydantic import BaseModel
from typing import Literal
from datetime import datetime

class PremiumBreakdown(BaseModel):
    base: float
    zone_multiplier: float
    gigscore_multiplier: float

class PolicyCreate(BaseModel):
    coverage_per_day: Literal[500, 750, 1000]

class PolicyOut(BaseModel):
    policy_id: str
    uid: str
    week_start: datetime
    week_end: datetime
    coverage_per_day: int
    weekly_premium: float
    premium_breakdown: PremiumBreakdown
    status: Literal["active", "expired", "cancelled"]
    zone: str
    pincode: str
    gigscore_at_creation: int
    is_first_policy: bool
    created_at: datetime