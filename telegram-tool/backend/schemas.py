from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ---------- Telegram session ----------
class ConnectRequest(BaseModel):
    api_id: int
    api_hash: str
    phone: str


class VerifyOtpRequest(BaseModel):
    code: str
    password: Optional[str] = None


class SessionStatusResponse(BaseModel):
    is_active: bool
    phone: Optional[str] = None
    tg_username: Optional[str] = None
    tg_first_name: Optional[str] = None


# ---------- Scraper ----------
class ScrapeStartRequest(BaseModel):
    target: str
    aggressive: bool = False


class ScrapeJobResponse(BaseModel):
    id: int
    target: str
    status: str
    total_count: int
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ScrapedMemberResponse(BaseModel):
    tg_user_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_bot: bool
    premium: bool
    access_hash: Optional[int] = None

    class Config:
        from_attributes = True


class MembersPageResponse(BaseModel):
    total: int
    members: list[ScrapedMemberResponse]


# ---------- Sender ----------
class RecipientInput(BaseModel):
    tg_user_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    access_hash: Optional[int] = None


class CreateCampaignRequest(BaseModel):
    name: str
    message_text: str
    delay_seconds: float = Field(default=3.0, ge=1.0, le=10.0)
    recipients: Optional[list[RecipientInput]] = None
    scrape_job_id: Optional[int] = None
    selected_tg_user_ids: Optional[list[int]] = None


class CampaignResponse(BaseModel):
    id: int
    name: str
    message_text: str
    delay_seconds: float
    status: str
    total: int
    sent: int
    failed: int
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CampaignProgressPayload(BaseModel):
    type: Optional[str] = None
    sent: int
    failed: int
    total: int
    status: str
    current_username: Optional[str] = None
