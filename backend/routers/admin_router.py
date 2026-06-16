from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, auth, models
import json

router = APIRouter()


@router.get("/stats")
def admin_stats(db: Session = Depends(get_db), _=Depends(auth.get_admin_user)):
    return crud.get_admin_stats(db)


@router.get("/users")
def list_users(
    skip: int = 0,
    limit: int = 50,
    search: str = None,
    status: str = None,
    role: str = None,
    db: Session = Depends(get_db),
    _=Depends(auth.get_admin_user),
):
    users = crud.get_users_list(db, skip=skip, limit=limit, search=search, status=status, role=role)
    total = crud.get_users_count(db)
    return {"users": users, "total": total}


@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db), _=Depends(auth.get_admin_user)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    _=Depends(auth.get_admin_user),
):
    user = crud.update_user(db, user_id, data)
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(auth.get_admin_user)):
    crud.delete_user_soft(db, user_id)
    return {"message": "User deleted"}


@router.post("/users/{user_id}/impersonate")
def impersonate_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(auth.get_admin_user),
):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    token = auth.create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "impersonated_by": admin.id,
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
        "impersonated": True,
        "admin_id": admin.id,
    }


@router.post("/users/{user_id}/suspend")
def suspend_user(user_id: int, db: Session = Depends(get_db), _=Depends(auth.get_admin_user)):
    user = crud.update_user(db, user_id, {"status": "suspended"})
    if not user:
        raise HTTPException(404, "User not found")
    return {"message": "User suspended"}


@router.post("/users/{user_id}/activate")
def activate_user(user_id: int, db: Session = Depends(get_db), _=Depends(auth.get_admin_user)):
    user = crud.update_user(db, user_id, {"status": "active"})
    if not user:
        raise HTTPException(404, "User not found")
    return {"message": "User activated"}


@router.get("/transactions")
def list_transactions(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(auth.get_admin_user),
):
    transactions = crud.get_all_transactions(db, skip=skip, limit=limit)
    return {"transactions": transactions}


@router.get("/subscriptions")
def list_subscription_plans(db: Session = Depends(get_db), _=Depends(auth.get_admin_user)):
    plans = db.query(models.Subscription).all()
    return {"plans": plans}


@router.post("/subscriptions")
def create_plan(
    data: schemas.SubscriptionCreate,
    db: Session = Depends(get_db),
    _=Depends(auth.get_admin_user),
):
    plan_data = data.model_dump()
    plan_data["features"] = json.dumps(plan_data.get("features", []))
    return crud.create_subscription(db, plan_data)


@router.put("/subscriptions/{sub_id}")
def update_plan(
    sub_id: int,
    data: schemas.SubscriptionUpdate,
    db: Session = Depends(get_db),
    _=Depends(auth.get_admin_user),
):
    update_data = data.model_dump(exclude_none=True)
    if "features" in update_data:
        update_data["features"] = json.dumps(update_data["features"])
    plan = crud.update_subscription(db, sub_id, update_data)
    if not plan:
        raise HTTPException(404, "Plan not found")
    return plan


@router.get("/settings")
def get_settings(db: Session = Depends(get_db), _=Depends(auth.get_admin_user)):
    settings = crud.get_all_settings(db)
    return {s.key: s.value for s in settings}


@router.put("/settings")
def update_settings(
    data: dict,
    db: Session = Depends(get_db),
    _=Depends(auth.get_admin_user),
):
    for key, value in data.items():
        crud.upsert_setting(db, key, str(value))
    return {"message": "Settings updated"}
