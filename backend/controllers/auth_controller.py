import random
import string
import resend
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
from db.supabase_client import get_supabase_client
from core.config import (
    SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES,
    RESEND_API_KEY, FROM_EMAIL, OTP_EXPIRE_MINUTES
)

resend.api_key = RESEND_API_KEY
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(uid: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": uid, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        if uid is None:
            raise ValueError("Invalid token")
        return uid
    except JWTError:
        raise ValueError("Invalid or expired token")


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def send_otp_email(email: str, otp: str):
    try:
        # For development/testing: use verified email
        # In production with verified domain, use: email
        send_to = "saumaygoel123@gmail.com"  # Resend verified address for testing
        
        result = resend.Emails.send({
            "from": FROM_EMAIL,
            "to": send_to,
            "subject": "ChillInsure — Your OTP",
            "html": f"""
                <h2>Verify your ChillInsure account</h2>
                <p>Your OTP is:</p>
                <h1 style="letter-spacing: 8px;">{otp}</h1>
                <p>This OTP expires in {OTP_EXPIRE_MINUTES} minutes.</p>
                <p>Do not share this with anyone.</p>
                <hr/>
                <p><small>Sent to registered email: {email}</small></p>
            """
        })
        print(f"[OK] OTP sent to verified inbox (for user: {email}). OTP: {otp}")
        return result
    except Exception as e:
        print(f"[ERROR] Failed to send OTP: {e}")
        print(f"[DEBUG] OTP for {email}: {otp}")
        raise


def save_otp(email: str, otp: str):
    db = get_supabase_client()
    expires_at = (datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)).isoformat()

    db.table("otp_verifications").update({"is_used": True}).eq("email", email).eq("is_used", False).execute()

    db.table("otp_verifications").insert({
        "email": email,
        "otp": otp,
        "expires_at": expires_at,
        "is_used": False
    }).execute()


def verify_otp(email: str, otp: str) -> bool:
    db = get_supabase_client()

    result = db.table("otp_verifications")\
        .select("*")\
        .eq("email", email)\
        .eq("otp", otp)\
        .eq("is_used", False)\
        .execute()

    if not result.data:
        return False

    record = result.data[0]

    # Parse expires_at — handle Supabase's variable-length microseconds
    expires_str = record["expires_at"]
    try:
        expires_at = datetime.fromisoformat(expires_str)
    except ValueError:
        # Supabase sometimes returns truncated microseconds (e.g. .64408 instead of .064408)
        # Strip fractional seconds as a fallback
        if "." in expires_str:
            expires_str = expires_str.split(".")[0]
        expires_at = datetime.fromisoformat(expires_str)

    if datetime.utcnow() > expires_at:
        return False

    db.table("otp_verifications").update({"is_used": True}).eq("id", record["id"]).execute()
    return True