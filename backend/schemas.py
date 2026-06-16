from pydantic import BaseModel, ConfigDict, field_validator, EmailStr
from typing import Optional, List
from datetime import datetime
import json


# ─── User Schemas ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    name: str
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    role: str
    status: str
    created_at: datetime
    last_login: Optional[datetime] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


# ─── Subscription Schemas ──────────────────────────────────────────────────────

class SubscriptionCreate(BaseModel):
    name: str
    price_monthly: float
    price_yearly: float
    features: List[str] = []
    max_analyses_per_day: int = 5
    has_ai_chat: bool = False
    has_advanced_indicators: bool = False
    is_active: bool = True


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    features: Optional[List[str]] = None
    max_analyses_per_day: Optional[int] = None
    has_ai_chat: Optional[bool] = None
    has_advanced_indicators: Optional[bool] = None
    is_active: Optional[bool] = None


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price_monthly: float
    price_yearly: float
    features: List[str] = []
    max_analyses_per_day: int
    has_ai_chat: bool
    has_advanced_indicators: bool
    is_active: bool

    @field_validator("features", mode="before")
    @classmethod
    def parse_features(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        if v is None:
            return []
        return v


# ─── UserSubscription Schemas ──────────────────────────────────────────────────

class UserSubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    subscription_id: int
    status: str
    started_at: datetime
    expires_at: Optional[datetime] = None
    billing_cycle: str
    subscription: Optional[SubscriptionResponse] = None


# ─── Transaction Schemas ───────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    user_id: int
    subscription_id: Optional[int] = None
    amount: float
    currency: str = "USD"
    status: str = "pending"
    payment_method: Optional[str] = None
    payment_ref: Optional[str] = None


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    subscription_id: Optional[int] = None
    amount: float
    currency: str
    status: str
    payment_method: Optional[str] = None
    payment_ref: Optional[str] = None
    created_at: datetime


# ─── TradeHistory Schemas ──────────────────────────────────────────────────────

class TradeHistoryCreate(BaseModel):
    user_id: int
    pair: str
    market: str
    timeframe: str
    direction: str
    confidence: float
    entry_price: float
    stop_loss: float
    take_profit_1: float
    take_profit_2: float
    take_profit_3: float
    atr: float
    signals_json: Optional[str] = None


class TradeHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    pair: str
    market: str
    timeframe: str
    direction: str
    confidence: float
    entry_price: float
    stop_loss: float
    take_profit_1: float
    take_profit_2: float
    take_profit_3: float
    atr: float
    signals_json: Optional[str] = None
    created_at: datetime


# ─── AppSettings Schemas ───────────────────────────────────────────────────────

class AppSettingsUpdate(BaseModel):
    value: str
    description: Optional[str] = None


class AppSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime


# ─── Auth / Token Schemas ──────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ─── Admin Stats Schema ────────────────────────────────────────────────────────

class AdminStatsResponse(BaseModel):
    total_users: int
    active_subscriptions: int
    monthly_revenue: float
    total_trades_today: int
    new_users_today: int
