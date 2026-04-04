from datetime import datetime, timedelta
from db.supabase_client import get_supabase_client

BASE_SCORE = 65


def calculate_risk_tier(score: int) -> tuple[str, float]:
    if score >= 80:
        return "low", 0.85
    elif score >= 50:
        return "medium", 1.0
    else:
        return "high", 1.2


def calculate_tenure_bonus(tenure_months: int) -> int:
    bonus = min(tenure_months / 24 * 10, 10)
    return int(bonus)


def apply_event_delta(current_score: int, event: str) -> tuple[int, int, str]:
    deltas = {
        "claim_approved":  (+5,  "Claim verified and approved"),
        "claim_rejected":  (-8,  "Claim rejected — policy misuse"),
        "claim_flagged":   (-15, "Claim flagged for anomaly"),
        "policy_renewed":  (+2,  "Weekly policy renewal"),
        "no_claim_week":   (+3,  "Clean week — no disruption claimed"),
    }
    delta, reason = deltas.get(event, (0, "Unknown event"))
    new_score = max(0, min(100, current_score + delta))
    return new_score, delta, reason


def init_gigscore(uid: str, tenure_months: int) -> dict:
    db = get_supabase_client()

    initial_score = BASE_SCORE + calculate_tenure_bonus(tenure_months)
    initial_score = max(0, min(100, initial_score))
    risk_tier, premium_multiplier = calculate_risk_tier(initial_score)

    now = datetime.utcnow().isoformat()
    history = [
        {
            "date": now,
            "score": initial_score,
            "reason": "Account created",
            "delta": initial_score - BASE_SCORE
        }
    ]

    doc = {
        "uid": uid,
        "score": initial_score,
        "risk_tier": risk_tier,
        "premium_multiplier": premium_multiplier,
        "last_updated": now,
        "score_history": history
    }

    db.table("gigscore").upsert(doc).execute()
    return doc


def update_gigscore(uid: str, event: str) -> dict:
    db = get_supabase_client()

    result = db.table("gigscore").select("*").eq("uid", uid).execute()

    if not result.data:
        raise ValueError(f"GigScore not found for uid: {uid}")

    data = result.data[0]
    current_score = data["score"]
    history = data.get("score_history", [])

    new_score, delta, reason = apply_event_delta(current_score, event)
    risk_tier, premium_multiplier = calculate_risk_tier(new_score)
    now = datetime.utcnow().isoformat()

    history.append({
        "date": now,
        "score": new_score,
        "reason": reason,
        "delta": delta
    })

    history = history[-20:]

    updated = {
        "score": new_score,
        "risk_tier": risk_tier,
        "premium_multiplier": premium_multiplier,
        "last_updated": now,
        "score_history": history
    }

    db.table("gigscore").update(updated).eq("uid", uid).execute()
    return updated


def get_gigscore(uid: str) -> dict:
    db = get_supabase_client()

    result = db.table("gigscore").select("*").eq("uid", uid).execute()

    if not result.data:
        raise ValueError(f"GigScore not found for uid: {uid}")

    data = result.data[0]
    data["score_history"] = data.get("score_history", [])[-5:]
    return data