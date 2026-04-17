import uuid
from fastapi import APIRouter, HTTPException, Depends
from models.user_model import RegisterRequest, VerifyOTPRequest, LoginRequest
from controllers.auth_controller import (
    hash_password, verify_password,
    create_access_token, generate_otp,
    send_otp_email, save_otp, verify_otp
)
from controllers.gigscore_engine_controller import init_gigscore
from db.supabase_client import get_supabase_client
from core.dependencies import get_current_user

router = APIRouter(tags=["auth"])


@router.post("/register")
async def register(body: RegisterRequest):
    db = get_supabase_client()

    existing = db.table("users").select("uid").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    uid = str(uuid.uuid4())
    hashed_pw = hash_password(body.password)

    db.table("users").insert({
        "uid": uid,
        "name": body.name,
        "email": body.email,
        "hashed_password": hashed_pw,
        "phone": body.phone,
        "platform": body.platform,
        "zone": body.zone,
        "pincode": body.pincode,
        "avg_weekly_earnings": body.avg_weekly_earnings,
        "work_days_per_week": body.work_days_per_week,
        "tenure_months": body.tenure_months,
        "role": "worker",
        "is_verified": False
    }).execute()

    otp = generate_otp()
    save_otp(body.email, otp)
    send_otp_email(body.email, otp)

    return {
        "message": "OTP sent to your email. Verify to complete registration.",
        "email": body.email,
        "otp_dev": otp  # DEV MODE: Return OTP for frontend testing (remove in production)
    }


@router.post("/verify-otp")
async def verify_otp_route(body: VerifyOTPRequest):
    db = get_supabase_client()

    # Debug logging
    print(f"[DEBUG] Verifying OTP for email: {body.email}, OTP: {body.otp}")
    
    # Check what OTPs exist for this email
    otp_records = db.table("otp_verifications").select("*").eq("email", body.email).execute()
    print(f"[DEBUG] OTP records found: {otp_records.data}")
    
    is_valid = verify_otp(body.email, body.otp)
    if not is_valid:
        print(f"[ERROR] OTP verification failed for {body.email}")
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    db.table("users").update({"is_verified": True}).eq("email", body.email).execute()

    user = db.table("users").select("*").eq("email", body.email).execute()
    user_data = user.data[0]

    try:
        print(f"[DEBUG] Initializing GigScore for uid: {user_data['uid']}")
        init_gigscore(user_data["uid"], user_data["tenure_months"])
        print(f"[OK] GigScore initialized")
    except Exception as e:
        print(f"[ERROR] Failed to init GigScore: {e}")
        raise HTTPException(status_code=500, detail=f"GigScore init failed: {str(e)}")

    token = create_access_token(user_data["uid"])
    return {"access_token": token, "token_type": "bearer", "uid": user_data["uid"]}


@router.post("/login")
async def login(body: LoginRequest):
    db = get_supabase_client()

    result = db.table("users").select("*").eq("email", body.email).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = result.data[0]

    if not user["is_verified"]:
        raise HTTPException(status_code=403, detail="Email not verified. Check your inbox.")

    if not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Wrong password")

    token = create_access_token(user["uid"])
    return {"access_token": token, "token_type": "bearer", "uid": user["uid"]}


@router.get("/me")
async def get_me(uid: str = Depends(get_current_user)):
    db = get_supabase_client()
    result = db.table("users").select("uid, name, email, platform, zone, is_verified, role").eq("uid", uid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]