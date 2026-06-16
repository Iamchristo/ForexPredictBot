from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, date
import json
from . import models, schemas
from .auth import hash_password


# ─── Users ────────────────────────────────────────────────────────────────────

def get_user(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(
        email=user.email,
        name=user.name,
        password_hash=hash_password(user.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, data: dict) -> models.User | None:
    user = get_user(db, user_id)
    if not user:
        return None
    for key, value in data.items():
        if hasattr(user, key):
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def delete_user_soft(db: Session, user_id: int):
    user = get_user(db, user_id)
    if user:
        user.status = "deleted"
        db.commit()


def get_users_list(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: str = None,
    status: str = None,
    role: str = None,
) -> list:
    query = db.query(models.User)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.User.email.ilike(search_term)) | (models.User.name.ilike(search_term))
        )
    if status:
        query = query.filter(models.User.status == status)
    if role:
        query = query.filter(models.User.role == role)
    return query.order_by(desc(models.User.created_at)).offset(skip).limit(limit).all()


def get_users_count(db: Session) -> int:
    return db.query(func.count(models.User.id)).scalar()


# ─── Subscriptions ─────────────────────────────────────────────────────────────

def get_subscription(db: Session, sub_id: int) -> models.Subscription | None:
    return db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()


def get_active_subscriptions(db: Session) -> list:
    return (
        db.query(models.Subscription)
        .filter(models.Subscription.is_active == True)
        .order_by(models.Subscription.price_monthly)
        .all()
    )


def create_subscription(db: Session, data: dict) -> models.Subscription:
    sub = models.Subscription(**data)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def update_subscription(db: Session, sub_id: int, data: dict) -> models.Subscription | None:
    sub = get_subscription(db, sub_id)
    if not sub:
        return None
    for key, value in data.items():
        if hasattr(sub, key):
            setattr(sub, key, value)
    db.commit()
    db.refresh(sub)
    return sub


# ─── UserSubscriptions ─────────────────────────────────────────────────────────

def get_user_subscription(db: Session, user_id: int) -> models.UserSubscription | None:
    return (
        db.query(models.UserSubscription)
        .filter(
            models.UserSubscription.user_id == user_id,
            models.UserSubscription.status == "active",
        )
        .order_by(desc(models.UserSubscription.started_at))
        .first()
    )


def create_user_subscription(
    db: Session, user_id: int, subscription_id: int, billing_cycle: str
) -> models.UserSubscription:
    # Cancel any existing active subscription first
    cancel_user_subscription(db, user_id)
    user_sub = models.UserSubscription(
        user_id=user_id,
        subscription_id=subscription_id,
        billing_cycle=billing_cycle,
        status="active",
    )
    db.add(user_sub)
    db.commit()
    db.refresh(user_sub)
    return user_sub


def cancel_user_subscription(db: Session, user_id: int):
    existing = get_user_subscription(db, user_id)
    if existing:
        existing.status = "cancelled"
        db.commit()


# ─── Transactions ──────────────────────────────────────────────────────────────

def create_transaction(db: Session, data: dict) -> models.Transaction:
    txn = models.Transaction(**data)
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


def get_user_transactions(db: Session, user_id: int) -> list:
    return (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == user_id)
        .order_by(desc(models.Transaction.created_at))
        .all()
    )


def get_all_transactions(db: Session, skip: int = 0, limit: int = 50) -> list:
    return (
        db.query(models.Transaction)
        .order_by(desc(models.Transaction.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


# ─── Trade History ─────────────────────────────────────────────────────────────

def create_trade_history(db: Session, data: dict) -> models.TradeHistory:
    trade = models.TradeHistory(**data)
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return trade


def get_user_trade_history(
    db: Session, user_id: int, skip: int = 0, limit: int = 50
) -> list:
    return (
        db.query(models.TradeHistory)
        .filter(models.TradeHistory.user_id == user_id)
        .order_by(desc(models.TradeHistory.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_trade_history_count_today(db: Session, user_id: int) -> int:
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    return (
        db.query(func.count(models.TradeHistory.id))
        .filter(
            models.TradeHistory.user_id == user_id,
            models.TradeHistory.created_at >= today_start,
        )
        .scalar()
    )


# ─── App Settings ──────────────────────────────────────────────────────────────

def get_setting(db: Session, key: str) -> models.AppSettings | None:
    return db.query(models.AppSettings).filter(models.AppSettings.key == key).first()


def get_all_settings(db: Session) -> list:
    return db.query(models.AppSettings).order_by(models.AppSettings.key).all()


def upsert_setting(
    db: Session, key: str, value: str, description: str = None
) -> models.AppSettings:
    setting = get_setting(db, key)
    if setting:
        setting.value = value
        if description is not None:
            setting.description = description
        setting.updated_at = datetime.utcnow()
    else:
        setting = models.AppSettings(key=key, value=value, description=description)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


# ─── Admin Stats ───────────────────────────────────────────────────────────────

def get_admin_stats(db: Session) -> dict:
    total_users = db.query(func.count(models.User.id)).scalar()

    active_subscriptions = (
        db.query(func.count(models.UserSubscription.id))
        .filter(models.UserSubscription.status == "active")
        .scalar()
    )

    # Monthly revenue: sum of completed transactions this calendar month
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_revenue = (
        db.query(func.sum(models.Transaction.amount))
        .filter(
            models.Transaction.status == "completed",
            models.Transaction.created_at >= month_start,
        )
        .scalar()
        or 0.0
    )

    # Trades today
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    total_trades_today = (
        db.query(func.count(models.TradeHistory.id))
        .filter(models.TradeHistory.created_at >= today_start)
        .scalar()
    )

    # New users today
    new_users_today = (
        db.query(func.count(models.User.id))
        .filter(models.User.created_at >= today_start)
        .scalar()
    )

    return {
        "total_users": total_users,
        "active_subscriptions": active_subscriptions,
        "monthly_revenue": float(monthly_revenue),
        "total_trades_today": total_trades_today,
        "new_users_today": new_users_today,
    }
