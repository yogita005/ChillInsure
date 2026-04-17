from fastapi import Header, HTTPException
from controllers.auth_controller import decode_access_token


async def get_current_user(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header format")
    token = authorization.replace("Bearer ", "")
    try:
        uid = decode_access_token(token)
        return uid
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
