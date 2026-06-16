from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, auth
import json
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/")
def list_plans(db: Session = Depends(get_db)):
    plans = crud.get_active_subscriptions(db)
    result = []
    for p in plans:
        d = {
            "id": p.id,
            "name": p.name,
            "price_monthly": p.price_monthly,
            "price_yearly": p.price_yearly,
            "features": json.loads(p.features) if p.features else [],
            "max_analyses_per_day": p.max_analyses_per_day,
            "has_ai_chat": p.has_ai_chat,
            "has_advanced_indicators": p.has_advanced_indicators,
            "is_active": p.is_active,
        }
        result.append(d)
    return result


@router.get("/my")
def my_subscription(
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    sub = crud.get_user_subscription(db, current_user.id)
    if not sub:
        return {"subscription": None, "plan": None}
    plan = crud.get_subscription(db, sub.subscription_id)
    plan_data = None
    if plan:
        plan_data = {
            "id": plan.id,
            "name": plan.name,
            "price_monthly": plan.price_monthly,
            "price_yearly": plan.price_yearly,
            "features": json.loads(plan.features) if plan.features else [],
            "max_analyses_per_day": plan.max_analyses_per_day,
            "has_ai_chat": plan.has_ai_chat,
        }
    return {
        "subscription": {
            "id": sub.id,
            "status": sub.status,
            "started_at": sub.started_at,
            "expires_at": sub.expires_at,
            "billing_cycle": sub.billing_cycle,
        },
        "plan": plan_data,
    }


@router.post("/subscribe")
def subscribe(
    data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    plan_id = data.get("plan_id")
    billing_cycle = data.get("billing_cycle", "monthly")
    plan = crud.get_subscription(db, plan_id)
    if not plan or not plan.is_active:
        raise HTTPException(400, "Invalid subscription plan")
    amount = plan.price_monthly if billing_cycle == "monthly" else plan.price_yearly
    transaction = crud.create_transaction(db, {
        "user_id": current_user.id,
        "subscription_id": plan_id,
        "amount": amount,
        "currency": "USD",
        "status": "completed",
        "payment_method": "card",
        "payment_ref": f"REF-{current_user.id}-{plan_id}",
    })
    sub = crud.create_user_subscription(db, current_user.id, plan_id, billing_cycle)
    return {"message": "Subscribed successfully", "subscription": sub}


@router.post("/cancel")
def cancel_subscription(
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    crud.cancel_user_subscription(db, current_user.id)
    return {"message": "Subscription cancelled"}
