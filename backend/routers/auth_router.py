from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from .. import crud, schemas, auth
from ..models import Subscription

router = APIRouter()


@router.post("/register", response_model=schemas.TokenResponse)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = crud.create_user(db, user_data)
    # Give free subscription
    free_sub = db.query(Subscription).filter_by(name="Free").first()
    if free_sub:
        crud.create_user_subscription(db, user.id, free_sub.id, "monthly")
    token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, credentials.email)
    if not user or not auth.verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.status == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended")
    if user.status == "deleted":
        raise HTTPException(status_code=403, detail="Account not found")
    user.last_login = datetime.utcnow()
    db.commit()
    token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user=Depends(auth.get_current_user)):
    return current_user


@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh_token(current_user=Depends(auth.get_current_user)):
    token = auth.create_access_token({"sub": str(current_user.id), "role": current_user.role})
    return {"access_token": token, "token_type": "bearer", "user": current_user}
