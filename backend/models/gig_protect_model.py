"""
GIG PROTECT Parametric Insurance Models
Defines all data structures for the parametric insurance pricing engine
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class EventCategory(str, Enum):
    """Event categories covered by GIG PROTECT"""
    ENVIRONMENTAL = "environmental"
    TRAFFIC_URBAN = "traffic_urban"
    REGULATORY = "regulatory"


class EventType(str, Enum):
    """Specific event types covered"""
    # Environmental
    HEAVY_RAINFALL = "heavy_rainfall"
    CYCLONE = "cyclone"
    SEVERE_THUNDERSTORM = "severe_thunderstorm"
    FLOODING = "flooding"
    LOW_VISIBILITY = "low_visibility"
    
    # Traffic/Urban
    MAJOR_ROAD_CLOSURE = "major_road_closure"
    ACCIDENT_HOTSPOT = "accident_hotspot"
    SEVERE_CONGESTION = "severe_congestion"
    CONSTRUCTION_BLOCKAGE = "construction_blockage"
    VIP_MOVEMENT_RESTRICTION = "vip_movement_restriction"
    
    # Regulatory
    SECTION_144_CURFEW = "section_144_curfew"
    EMERGENCY_LOCKDOWN = "emergency_lockdown"
    ELECTION_RESTRICTION = "election_restriction"
    FESTIVAL_CROWD_CONTROL = "festival_crowd_control"
    PROTEST_ZONE = "protest_zone"


class PolicyStatus(str, Enum):
    """Status of an insurance policy"""
    ACTIVE = "active"
    EXPIRED = "expired"
    CLAIMED = "claimed"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"


class PayoutStatus(str, Enum):
    """Status of a payout"""
    PENDING = "pending"
    TRIGGERED = "triggered"
    PROCESSED = "processed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class EarningVelocity(BaseModel):
    """
    Earning Velocity: ₹/hour based on historical delivery ledger
    Calculated from last 30 days of delivery data
    """
    rider_id: str
    daily_earnings: float = Field(..., description="Average daily earnings (₹)")
    daily_delivery_hours: float = Field(..., description="Average hours worked per day")
    earning_velocity: float = Field(..., description="Earnings per hour (₹/hr)")
    weekly_earnings: float = Field(..., description="Projected weekly earnings (₹)")
    confidence_score: float = Field(..., description="Confidence in calculation (0-100)")
    data_points: int = Field(..., description="Number of delivery days used in calculation")
    calculation_date: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "rider_id": "rider_123",
                "daily_earnings": 750,
                "daily_delivery_hours": 5,
                "earning_velocity": 150,
                "weekly_earnings": 3750,
                "confidence_score": 92,
                "data_points": 28
            }
        }


class RiskProfile(BaseModel):
    """
    Risk profile for a rider in a specific zone
    Includes weather, civic, infrastructure, and fraud risks
    """
    rider_id: str
    zone_id: str = Field(..., description="H3 hexagon zone identifier")
    
    # Weather risk components
    weather_probability: float = Field(..., description="p_weather (0-1)")
    weather_unpredictability: float = Field(..., description="U_weather (0-1)")
    weather_boosted: float = Field(..., description="p_boosted weather with infrastructure")
    weather_spillover: float = Field(..., description="p_spillover from previous day")
    weather_effective: float = Field(..., description="Max of boosted or spillover")
    
    # Civic risk components
    civic_probability: float = Field(..., description="p_civic (0-1)")
    civic_events: List[Dict] = Field(default_factory=list, description="Active civic events")
    
    # Zone/Infrastructure risk
    zone_vulnerability: float = Field(..., description="V_zone vulnerability score")
    infrastructure_multiplier: float = Field(default=1.0)
    
    # User risk factors
    fraud_risk: float = Field(..., description="F_risk fraud buffer")
    gigscore_penalty: float = Field(default=0, description="Penalty based on GigScore")
    
    # Composite multiplier
    risk_multiplier: float = Field(..., description="β = 1.0 + U_weather + F_risk")
    
    # Final effective probability
    effective_risk_probability: float = Field(..., description="Union probability for premium")
    
    calculation_date: datetime = Field(default_factory=datetime.utcnow)


class PremiumQuote(BaseModel):
    """
    Premium quote for a policy
    Calculation: Premium = Union_Prob × Payout × β + Platform_Fee
    """
    rider_id: str
    zone_id: str
    coverage_amount: float = Field(..., description="Payout amount L (₹)")
    time_horizon_days: int = Field(default=7, description="Days ahead for forecast")
    
    # Risk components
    risk_profile: RiskProfile
    earning_velocity: EarningVelocity
    
    # Premium break-down
    union_probability: float = Field(..., description="Combined weather + civic risk")
    platform_fee: float = Field(default=10, description="Fixed platform fee (₹)")
    risk_adjusted_base: float = Field(..., description="Union_Prob × L")
    multiplier_adjusted: float = Field(..., description="Risk_adjusted_base × β")
    total_premium: float = Field(..., description="Final premium including platform fee")
    
    # Premium economics
    premium_percentage: float = Field(..., description="Premium as % of coverage")
    expected_payout_likelihood: float = Field(..., description="% chance payout triggers")
    
    valid_until: datetime = Field(..., description="Quote validity (15 min from generation)")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Policy(BaseModel):
    """
    Purchased insurance policy - Weekly Renewable
    Parametric: Pays automatically when API threshold is crossed
    Renewable: Customers can renew every 7 days with updated GigScore & premium
    """
    policy_id: str
    rider_id: str
    zone_id: str
    
    # Coverage terms
    coverage_amount: float = Field(..., description="Maximum payout (₹)")
    earning_velocity_locked: float = Field(..., description="Velocity at purchase time")
    premium_paid: float
    platform_fee_paid: float
    total_cost: float
    
    # Policy term (7 days = 1 week)
    policy_start_date: datetime = Field(default_factory=datetime.utcnow)
    policy_end_date: datetime = Field(..., description="7 days from start (weekly renewal)")
    
    # GigScore-based discount & renewal tracking
    gigscore_at_purchase: int = Field(default=65, description="GigScore locked at purchase time")
    discount_percentage: float = Field(default=0, description="Discount applied (0-50%)")
    renewal_count: int = Field(default=0, description="Number of times renewed (0=new, 1=first renewal, etc)")
    last_renewal_date: Optional[datetime] = Field(default=None, description="When policy was last renewed")
    renewal_multiplier: float = Field(default=1.0, description="Cost multiplier for renewals (1.0 + 0.05*renewal_count)")
    
    # Risk factors
    weather_probability_at_purchase: float
    civic_probability_at_purchase: float
    risk_multiplier_at_purchase: float
    
    # Trigger configuration
    event_types_covered: List[EventType] = Field(default_factory=list)
    weather_threshold: float = Field(default=0.6, description="Threshold for weather disruption")
    civic_threshold: float = Field(default=0.5, description="Threshold for civic disruption")
    
    # Policy state
    status: PolicyStatus = PolicyStatus.ACTIVE
    
    # Monitoring data
    payouts_triggered: int = Field(default=0, description="Number of auto-payouts")
    total_payout_amount: float = Field(default=0)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DisruptionEvent(BaseModel):
    """
    Real-time disruption event detected via API or Agentic AI
    """
    event_id: str
    event_type: EventType
    event_category: EventCategory
    
    # Location
    zone_id: str
    latitude: float
    longitude: float
    
    # Timing
    detected_at: datetime
    started_at: datetime
    estimated_end_at: Optional[datetime]
    duration_hours: Optional[float]
    
    # Severity & Impact
    severity: str = Field(..., enum=["low", "medium", "high", "critical"])
    impact_radius_km: float = Field(..., description="Radius affected (km)")
    
    # Data source
    data_source: str = Field(..., description="weather_api, rss_feed, manual_report, etc.")
    source_reliability: float = Field(..., description="Confidence in data (0-1)")
    raw_data: Dict = Field(default_factory=dict, description="Raw API response or extracted data")
    
    # API confirmation
    meets_threshold: bool = Field(..., description="Exceeds policy trigger threshold")
    api_confirmed: bool = Field(default=False)
    confirmation_time: Optional[datetime]
    
    # Payout details
    affected_rider_ids: List[str] = Field(default_factory=list)
    policies_triggered: int = Field(default=0)
    total_payout: float = Field(default=0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AutoPayout(BaseModel):
    """
    Automatic payout triggered by parametric condition
    Zero-touch: No claims adjuster, no manual verification
    """
    payout_id: str
    policy_id: str
    rider_id: str
    
    # Triggering event
    disruption_event_id: str
    event_type: EventType
    
    # Payout calculation
    coverage_amount: float = Field(..., description="Policy coverage amount")
    disruption_severity: str
    
    # Actual payout (can be less than coverage)
    rides_lost: int = Field(..., description="Deliveries rider missed")
    time_affected_hours: float = Field(..., description="Hours of disruption")
    earning_velocity_used: float = Field(..., description="Locked velocity at policy purchase")
    payout_amount: float = Field(..., description="Actual payout = rides_lost × avg_per_ride OR time × velocity")
    
    # Confidence & adjustments
    calculation_confidence: float = Field(..., description="Confidence in calculation (0-100)")
    adjustment_factors: Dict = Field(default_factory=dict, description="Applied adjustments")
    
    # Payment details
    wallet_address: str
    transaction_id: Optional[str] = None
    
    # Status
    status: PayoutStatus = PayoutStatus.PENDING
    
    # Timestamps
    detected_at: datetime
    calculated_at: datetime
    processed_at: Optional[datetime]
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RiderPolicyHistory(BaseModel):
    """
    Historical summary of rider's policies and payouts
    """
    rider_id: str
    total_policies_purchased: int = 0
    total_premiums_paid: float = 0
    total_coverage_amount: float = 0
    
    # Payout history
    total_payouts: int = 0
    total_payout_amount: float = 0
    average_payout_size: float = 0
    
    # Experience metrics
    claim_to_premium_ratio: float = 0
    average_days_between_claims: float = 0
    
    # Trust metrics
    fraud_flags: int = 0
    claims_disputed: int = 0
    
    # Calculation date
    last_updated: datetime = Field(default_factory=datetime.utcnow)


# Request/Response models
class QuickQuoteRequest(BaseModel):
    """Request to generate a quick policy quote"""
    rider_id: str
    zone_id: str
    days: int = Field(default=7, description="Policy term in days")
    custom_coverage: Optional[float] = None


class QuickQuoteResponse(BaseModel):
    """Quick quote response with all pricing details"""
    quote_id: str
    earning_velocity: Dict
    coverage_amount: float
    total_premium: float
    premium_percentage: float
    expected_payout_likelihood: float
    risk_components: Dict
    valid_until: str
    recommendation: str


class PolicyPurchaseRequest(BaseModel):
    """Request to purchase a policy"""
    rider_id: str
    quote_id: str
    zone_id: str


class PolicyPurchaseResponse(BaseModel):
    """Policy purchase confirmation"""
    policy_id: str
    policy: Policy
    wallet_deduction: float
    confirmation_message: str


class PayoutWebhookEvent(BaseModel):
    """Webhook event for real-time disruption detection"""
    event_id: str
    event_type: str
    zone_id: str
    severity: str
    triggered_policies: int
    total_payout: float
    timestamp: datetime


class PolicyRenewalRequest(BaseModel):
    """Request to renew an expiring/expired policy"""
    policy_id: str
    rider_id: str
    zone_id: str
    coverage_amount: Optional[float] = Field(default=None, description="New coverage amount (optional)")


class PolicyRenewalResponse(BaseModel):
    """Response for successful policy renewal"""
    new_policy_id: str
    previous_policy_id: str
    renewal_count: int
    gigscore_at_renewal: int
    old_premium: float
    new_premium: float
    discount_percentage: float
    gig_score_improvement: int = Field(
        ..., 
        description="Difference in GigScore from purchase (positive = improvement)"
    )
    policy_start_date: datetime
    policy_end_date: datetime
    confirmation_message: str


class RenewalQuoteRequest(BaseModel):
    """Request renewal quote before committing payment"""
    policy_id: str
    rider_id: str


class RenewalQuoteResponse(BaseModel):
    """Quote for renewing a policy"""
    policy_id: str
    current_gigscore: int
    previous_gigscore: int
    previous_premium: float
    new_premium: float
    discount_percentage: float
    savings: float
    days_until_expiry: int
    renewal_date_recommended: datetime
    message: str  # E.g., "Your GigScore improved! New premium: ₹299 (25% discount)"
