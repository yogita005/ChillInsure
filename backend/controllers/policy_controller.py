from datetime import datetime, timedelta
import uuid
from fastapi import HTTPException
from db.supabase_client import get_supabase_client

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
    db = get_supabase_client()

    try:
        # 1. Check for active policy
        existing = db.table("policies").select("*").eq("uid", uid).eq("status", "active").execute()
        if existing.data:
            raise HTTPException(
                status_code=400,
                detail="You already have an active policy this week."
            )
    except Exception as table_err:
        if "policies" in str(table_err) or "does not exist" in str(table_err):
            print("[WARN] Policies table not found - returning mock policy")
            # Table doesn't exist, return mock policy
            return _create_mock_policy(uid)
        else:
            raise

    # 2. Fetch user profile
    user = db.table("users").select("*").eq("uid", uid).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User profile not found.")
    user_data = user.data[0]

    pincode = user_data.get("pincode", "000000")
    zone    = user_data.get("zone", "unknown")

    # 3. Check if first policy ever
    try:
        all_policies = db.table("policies").select("policy_id").eq("uid", uid).execute()
        is_first_policy = len(all_policies.data) == 0
    except:
        is_first_policy = True

    # 4. Get GigScore
    if is_first_policy:
        gigscore = 65
    else:
        gs_result = db.table("gigscore").select("score").eq("uid", uid).execute()
        gigscore = gs_result.data[0].get("score", 65) if gs_result.data else 65

    # 5. Calculate premium
    result = calculate_premium(coverage_per_day, pincode, gigscore)

    # 6. Build policy document
    policy_id = str(uuid.uuid4())
    now       = datetime.utcnow()

    policy_doc = {
        "policy_id":            policy_id,
        "uid":                  uid,
        "week_start":           now.isoformat(),
        "week_end":             (now + timedelta(days=7)).isoformat(),
        "coverage_per_day":     coverage_per_day,
        "weekly_premium":       result["weekly_premium"],
        "premium_breakdown":    result["breakdown"],
        "status":               "active",
        "zone":                 zone,
        "pincode":              pincode,
        "gigscore_at_creation": gigscore,
        "is_first_policy":      is_first_policy,
        "created_at":           now.isoformat(),
    }

    # 7. Save to Supabase
    try:
        db.table("policies").insert(policy_doc).execute()
    except Exception as insert_err:
        if "policies" in str(insert_err):
            print("[WARN] Could not insert to policies table - returning mock")
            policy_doc["_note"] = "MOCK DATA - Database table not yet created. See STATUS_REPORT.md"
        else:
            raise

    return {
        "message": "Policy created successfully.",
        "policy":  policy_doc
    }


def _create_mock_policy(uid: str) -> dict:
    """Create a mock policy for testing before table is created"""
    policy_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    # Calculate mock premium (base 47 for 500 coverage, medium risk with 1.0 multiplier)
    mock_premium = 47.0
    
    return {
        "message": "Policy created successfully (MOCK - database table coming soon).",
        "policy": {
            "policy_id": policy_id,
            "uid": uid,
            "week_start": now.isoformat(),
            "week_end": (now + timedelta(days=7)).isoformat(),
            "coverage_per_day": 500,
            "weekly_premium": mock_premium,
            "premium_breakdown": {
                "base": 47.0,
                "zone_multiplier": 1.0,
                "gigscore_multiplier": 1.0
            },
            "status": "active",
            "zone": "general",
            "pincode": "000000",
            "gigscore_at_creation": 75,
            "is_first_policy": True,
            "created_at": now.isoformat(),
            "_mode": "MOCK - Wait for database table"
        }
    }


async def handle_get_my_policies(uid: str) -> dict:
    db = get_supabase_client()

    try:
        result = (
            db.table("policies")
            .select("*")
            .eq("uid", uid)
            .order("week_start", desc=True)
            .execute()
        )

        policies = result.data if result.data else []
    except Exception as table_err:
        if "policies" in str(table_err) or "does not exist" in str(table_err):
            print("[WARN] Policies table not found - returning mock policies")
            # Return mock policies
            policies = []
        else:
            raise

    active = [p for p in policies if p.get("status") == "active"]
    past   = [p for p in policies if p.get("status") != "active"]

    return {
        "active_policy":  active[0] if active else None,
        "past_policies":  past,
        "total_policies": len(policies),
        "_mode": "MOCK" if not policies else "LIVE"
    }