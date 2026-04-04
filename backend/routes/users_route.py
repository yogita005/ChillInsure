from fastapi import APIRouter, Depends
from pydantic import BaseModel
from core.dependencies import get_current_user
from controllers.users_controller import handle_activate_policy

router = APIRouter(tags=["users"])


class ActivatePolicyRequest(BaseModel):
    userId: str
    planId: int  # coverage_per_day
    premiumAmount: float


@router.post("/activate-policy")
async def activate_policy(
    payload: ActivatePolicyRequest,
    uid: str = Depends(get_current_user)
):
    """Activate a policy after payment confirmation"""
    return await handle_activate_policy(
        uid=uid,
        coverage_per_day=payload.planId,
        premium_amount=payload.premiumAmount
    )
