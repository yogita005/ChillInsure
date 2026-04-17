from fastapi import APIRouter, Depends, HTTPException
from models.gigscore_model import GigScoreResponse, GigScoreUpdateRequest
from controllers.gigscore_engine_controller import get_gigscore, update_gigscore
from core.dependencies import get_current_user

router = APIRouter(tags=["gigscore"])


@router.get("/me", response_model=GigScoreResponse)
async def get_my_gigscore(uid: str = Depends(get_current_user)):
    try:
        data = get_gigscore(uid)
        return data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/update")
async def update_my_gigscore(
        body: GigScoreUpdateRequest,
        uid: str = Depends(get_current_user)
):
    valid_events = [
        "claim_approved", "claim_rejected",
        "claim_flagged", "policy_renewed", "no_claim_week"
    ]
    if body.event not in valid_events:
        raise HTTPException(status_code=400, detail=f"Invalid event. Choose from: {valid_events}")

    try:
        updated = update_gigscore(body.uid, body.event)
        return {"status": "updated", "new_score": updated["score"], "risk_tier": updated["risk_tier"]}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
