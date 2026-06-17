from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import telegram_manager
from ..auth import get_current_user
from ..database import get_db
from ..models import TelegramSession, User
from ..schemas import ConnectRequest, SessionStatusResponse, VerifyOtpRequest

router = APIRouter(prefix="/api/telegram", tags=["telegram"])


@router.get("/session", response_model=SessionStatusResponse)
def session_status(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    tg_session = (
        db.query(TelegramSession)
        .filter_by(user_id=current_user.id)
        .first()
    )
    if not tg_session or not tg_session.is_active:
        return SessionStatusResponse(is_active=False)

    return SessionStatusResponse(
        is_active=True,
        phone=tg_session.phone,
        tg_username=tg_session.tg_username,
        tg_first_name=tg_session.tg_first_name,
    )


@router.post("/connect")
async def connect(
    payload: ConnectRequest,
    current_user: User = Depends(get_current_user),
):
    await telegram_manager.initiate_connection(
        current_user.id, payload.api_id, payload.api_hash, payload.phone
    )
    return {"status": "code_sent"}


@router.post("/verify-otp")
async def verify_otp(
    payload: VerifyOtpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tg_me = await telegram_manager.verify_otp(
        current_user.id, payload.code, payload.password, db
    )
    return {
        "status": "connected",
        "tg_username": tg_me.username,
        "tg_first_name": tg_me.first_name,
    }


@router.delete("/session")
async def disconnect(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    await telegram_manager.disconnect(current_user.id, db)
    return {"status": "disconnected"}
