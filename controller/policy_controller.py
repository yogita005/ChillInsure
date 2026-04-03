from datetime import datetime, timedelta
import uuid
from fastapi import HTTPException
from db.firestore import db

# ── Zone Risk Map ─────────────────────────────────────────────────────────────

ZONE_RISK: dict[str, float] = {
    "560034": 1.2,   # Koramangala, Bengaluru
    "560001": 1.0,   # MG Road, Bengaluru
    "600001": 1.1,   # Chennai Central
    "600028": 1.2,   # Velachery, Chennai
    "400001": 1.3,   # Mumbai CST
    "110001": 0.9,   # Delhi Connaught Place
    "500001": 1.0,   # Hyderabad
    "700001": 1.1,   # Kolkata
}

# ── Tier Base Prices ──────────────────────────────────────────────────────────

TIER_BASE: dict[int, float] = {
    500:  47.0,   # Basic
    750:  63.0,   # Standard
    1000: 84.0,   # Premium
}


# ── Helper Functions ──────────────────────────────────────────────────────────

def get_zone_multiplier(pincode: str) -> float:
    return ZONE_RISK.get(pincode, 1.0)

def get_gigscore_multiplier(score: int) -> float:
    if score >= 80:
        return 0.85
    elif score >= 50:
        return 1.0
    else:
        return 1.2

def calculate_premium(coverage_per_day: int, pincode: str, gigscore: int) -> dict:
    BASE      = TIER_BASE[coverage_per_day]
    zone_mult = get_zone_multiplier(pincode)
    gs_mult   = get_gigscore_multiplier(gigscore)

    weekly_premium = round(BASE * zone_mult * gs_mult, 2)

    return {
        "weekly_premium": weekly_premium,
        "breakdown": {
            "base":                BASE,
            "zone_multiplier":     zone_mult,
            "gigscore_multiplier": gs_mult,
        }
    }


# ── Controller Functions ──────────────────────────────────────────────────────

async def handle_create_policy(uid: str, coverage_per_day: int) -> dict:

    # 1. Block duplicate active policy
    existing = (
        db.collection("policies")
        .where("uid", "==", uid)
        .where("status", "==", "active")
        .limit(1)
        .get()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have an active policy this week."
        )

    # 2. Fetch user profile
    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found.")
    user_data = user_doc.to_dict()

    pincode = user_data.get("pincode", "000000")
    zone    = user_data.get("zone", "unknown")

    # 3. Check if first policy ever
    all_policies = (
        db.collection("policies")
        .where("uid", "==", uid)
        .limit(1)
        .get()
    )
    is_first_policy = len(all_policies) == 0

    # 4. Get GigScore
    if is_first_policy:
        gigscore = 65
    else:
        gs_doc   = db.collection("gigscore").document(uid).get()
        gigscore = gs_doc.to_dict().get("score", 65) if gs_doc.exists else 65

    # 5. Calculate premium
    result = calculate_premium(coverage_per_day, pincode, gigscore)

    # 6. Build policy document
    policy_id = str(uuid.uuid4())
    now       = datetime.utcnow()

    policy_doc = {
        "policy_id":            policy_id,
        "uid":                  uid,
        "week_start":           now,
        "week_end":             now + timedelta(days=7),
        "coverage_per_day":     coverage_per_day,
        "weekly_premium":       result["weekly_premium"],
        "premium_breakdown":    result["breakdown"],
        "status":               "active",
        "zone":                 zone,
        "pincode":              pincode,
        "gigscore_at_creation": gigscore,
        "is_first_policy":      is_first_policy,
        "created_at":           now,
    }

    # 7. Save to Firestore
    db.collection("policies").document(policy_id).set(policy_doc)

    return {
        "message": "Policy created successfully.",
        "policy":  policy_doc
    }


async def handle_get_my_policies(uid: str) -> dict:

    docs = (
        db.collection("policies")
        .where("uid", "==", uid)
        .order_by("week_start", direction="DESCENDING")
        .get()
    )

    policies = [doc.to_dict() for doc in docs]

    active = [p for p in policies if p["status"] == "active"]
    past   = [p for p in policies if p["status"] != "active"]

    return {
        "active_policy":  active[0] if active else None,
        "past_policies":  past,
        "total_policies": len(policies)
    }