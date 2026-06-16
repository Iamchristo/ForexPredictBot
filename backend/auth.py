import hmac
import hashlib
import base64
import json
import time
import bcrypt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from . import models
import os

SECRET_KEY = os.getenv("SECRET_KEY", "forex-predict-bot-secret-change-in-production-xyz-2024")
ACCESS_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24 * 7  # 7 days

security = HTTPBearer()


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += '=' * padding
    return base64.urlsafe_b64decode(s)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(data: dict) -> str:
    header = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = data.copy()
    payload["exp"] = int(time.time()) + ACCESS_TOKEN_EXPIRE_SECONDS
    payload_b64 = _b64url_encode(json.dumps(payload).encode())
    signing_input = f"{header}.{payload_b64}"
    sig = hmac.new(SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f"{signing_input}.{_b64url_encode(sig)}"


def decode_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Bad token")
        header, payload_b64, sig_b64 = parts
        signing_input = f"{header}.{payload_b64}"
        expected_sig = hmac.new(SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(expected_sig, _b64url_decode(sig_b64)):
            raise ValueError("Bad signature")
        payload = json.loads(_b64url_decode(payload_b64))
        if payload.get("exp", 0) < int(time.time()):
            raise ValueError("Token expired")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    from . import crud
    user = crud.get_user(db, int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.status == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended")
    return user


def get_admin_user(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
