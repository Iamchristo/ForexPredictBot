from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, auth

router = APIRouter()


@router.get("/me", response_model=schemas.UserResponse)
def get_profile(current_user=Depends(auth.get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.UserResponse)
def update_profile(
    update_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    updated = crud.update_user(db, current_user.id, update_data.model_dump(exclude_none=True))
    return updated


@router.get("/me/trades", response_model=list[schemas.TradeHistoryResponse])
def get_my_trades(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    return crud.get_user_trade_history(db, current_user.id, skip=skip, limit=limit)


@router.get("/me/subscription")
def get_my_subscription(
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    sub = crud.get_user_subscription(db, current_user.id)
    if not sub:
        return {"subscription": None, "plan": None}
    plan = crud.get_subscription(db, sub.subscription_id)
    return {"subscription": sub, "plan": plan}


@router.delete("/me")
def delete_account(
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    crud.delete_user_soft(db, current_user.id)
    return {"message": "Account deleted"}
