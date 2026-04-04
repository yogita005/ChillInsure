from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ScoreHistoryEntry(BaseModel):
    date: str
    score: int
    reason: str
    delta: int


class GigScoreResponse(BaseModel):
    uid: str
    score: int
    risk_tier: str
    premium_multiplier: float
    last_updated: str
    score_history: List[ScoreHistoryEntry] = []


class GigScoreUpdateRequest(BaseModel):
    uid: str
    event: str
    # event options:
    # "claim_approved", "claim_rejected", "claim_flagged",
    # "policy_renewed", "no_claim_week"


class GigScoreInitRequest(BaseModel):
    uid: str
    tenure_months: int
    platform: str
    zone: str
