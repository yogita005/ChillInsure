from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    platform: str
    zone: str
    pincode: str
    avg_weekly_earnings: int
    work_days_per_week: int
    tenure_months: int


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    uid: str
    name: str
    email: str
    platform: str
    zone: str
    is_verified: bool
