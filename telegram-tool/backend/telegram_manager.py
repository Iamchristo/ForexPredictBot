import asyncio
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session
from telethon import TelegramClient
from telethon.errors import PhoneCodeInvalidError, SessionPasswordNeededError
from telethon.sessions import StringSession

from .models import TelegramSession

# Process-lifetime in-memory state. A single TelegramClient is reused per app
# user so we don't re-authenticate on every request.
_client_cache: dict[int, TelegramClient] = {}
_stop_events: dict[int, asyncio.Event] = {}
_pending_otp: dict[int, dict] = {}


class TelegramNotConnectedError(Exception):
    pass


async def get_or_create_client(user_id: int, db: Session) -> TelegramClient:
    client = _client_cache.get(user_id)
    if client is not None:
        if await client.is_user_authorized():
            return client
        del _client_cache[user_id]

    tg_session = db.query(TelegramSession).filter_by(user_id=user_id).first()
    if not tg_session or not tg_session.session_string:
        raise TelegramNotConnectedError("No active Telegram session")

    client = TelegramClient(
        StringSession(tg_session.session_string),
        tg_session.api_id,
        tg_session.api_hash,
    )
    await client.connect()

    if not await client.is_user_authorized():
        tg_session.is_active = False
        db.commit()
        raise TelegramNotConnectedError("Session expired - please reconnect")

    _client_cache[user_id] = client
    tg_session.last_used_at = datetime.utcnow()
    db.commit()
    return client


async def initiate_connection(user_id: int, api_id: int, api_hash: str, phone: str) -> None:
    existing = _pending_otp.pop(user_id, None)
    if existing is not None:
        try:
            await existing["client"].disconnect()
        except Exception:
            pass

    client = TelegramClient(StringSession(), api_id, api_hash)
    await client.connect()
    result = await client.send_code_request(phone)
    _pending_otp[user_id] = {
        "client": client,
        "phone_code_hash": result.phone_code_hash,
        "phone": phone,
        "api_id": api_id,
        "api_hash": api_hash,
    }


async def verify_otp(user_id: int, code: str, password: str | None, db: Session):
    pending = _pending_otp.get(user_id)
    if not pending:
        raise HTTPException(status_code=400, detail="No pending connection - call connect first")

    client = pending["client"]
    try:
        await client.sign_in(
            pending["phone"], code, phone_code_hash=pending["phone_code_hash"]
        )
    except SessionPasswordNeededError:
        if not password:
            raise HTTPException(
                status_code=400,
                detail="Two-step verification password required",
            )
        await client.sign_in(password=password)
    except PhoneCodeInvalidError:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    session_string = client.session.save()
    tg_me = await client.get_me()

    tg_session = db.query(TelegramSession).filter_by(user_id=user_id).first()
    if not tg_session:
        tg_session = TelegramSession(user_id=user_id)
        db.add(tg_session)

    tg_session.api_id = pending["api_id"]
    tg_session.api_hash = pending["api_hash"]
    tg_session.phone = pending["phone"]
    tg_session.session_string = session_string
    tg_session.tg_user_id = tg_me.id
    tg_session.tg_username = tg_me.username
    tg_session.tg_first_name = tg_me.first_name
    tg_session.is_active = True
    db.commit()

    _client_cache[user_id] = client
    del _pending_otp[user_id]
    return tg_me


async def disconnect(user_id: int, db: Session) -> None:
    client = _client_cache.pop(user_id, None)
    if client is not None:
        try:
            await client.disconnect()
        except Exception:
            pass

    tg_session = db.query(TelegramSession).filter_by(user_id=user_id).first()
    if tg_session:
        tg_session.is_active = False
        tg_session.session_string = None
        db.commit()


def register_stop_event(campaign_id: int) -> asyncio.Event:
    event = asyncio.Event()
    _stop_events[campaign_id] = event
    return event


def get_stop_event(campaign_id: int) -> asyncio.Event | None:
    return _stop_events.get(campaign_id)


def clear_stop_event(campaign_id: int) -> None:
    _stop_events.pop(campaign_id, None)


def request_stop(campaign_id: int) -> bool:
    event = _stop_events.get(campaign_id)
    if event is None:
        return False
    event.set()
    return True
