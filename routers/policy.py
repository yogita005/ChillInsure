from fastapi import APIRouter, Depends
from core.dependencies import get_current_user
from models.policy import PolicyCreate
from controllers.policy_controller import (
    handle_create_policy,
    handle_get_my_policies
)

router = APIRouter(prefix="/policy", tags=["policy"])


@router.post("/create")
async def create_policy(
    payload: PolicyCreate,
    current_user: dict = Depends(get_current_user)
):
    return await handle_create_policy(
        uid=current_user["uid"],
        coverage_per_day=payload.coverage_per_day
    )


@router.get("/me")
async def get_my_policies(
    current_user: dict = Depends(get_current_user)
):
    return await handle_get_my_policies(uid=current_user["uid"])