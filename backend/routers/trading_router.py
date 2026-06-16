from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from ..database import get_db, SessionLocal
from .. import crud, auth
from ..data_fetcher import get_markets, MARKETS, TIMEFRAME_LABELS
from ..bot_engine import BotSession
import json

router = APIRouter()


@router.get("/markets")
def list_markets():
    return get_markets()


@router.post("/analyze")
def analyze(
    data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    market = data.get("market")
    pair = data.get("pair")
    timeframe = data.get("timeframe", "1h")

    if not market or not pair:
        raise HTTPException(400, "market and pair are required")

    # Check daily limit
    user_sub = crud.get_user_subscription(db, current_user.id)
    plan = None
    if user_sub:
        plan = crud.get_subscription(db, user_sub.subscription_id)

    max_daily = plan.max_analyses_per_day if plan else 5
    if max_daily != -1:  # -1 = unlimited
        count_today = crud.get_trade_history_count_today(db, current_user.id)
        if count_today >= max_daily:
            raise HTTPException(
                429,
                f"Daily analysis limit ({max_daily}) reached. Upgrade your plan for more.",
            )

    try:
        from ..analyzer import analyze_pair
        result = analyze_pair(market, pair, timeframe)
        # Save to history
        crud.create_trade_history(db, {
            "user_id": current_user.id,
            "pair": result["pair"],
            "market": market,
            "timeframe": result["timeframe"],
            "direction": result["direction"],
            "confidence": result["confidence"],
            "entry_price": result["entry_price"],
            "stop_loss": result["stop_loss"],
            "take_profit_1": result["take_profit_1"],
            "take_profit_2": result["take_profit_2"],
            "take_profit_3": result["take_profit_3"],
            "atr": result["atr"],
            "signals_json": json.dumps(result["signals"]),
        })
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")


@router.get("/history")
def trade_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    trades = crud.get_user_trade_history(db, current_user.id, skip=skip, limit=limit)
    return trades


@router.websocket("/bot")
async def bot_websocket(websocket: WebSocket, token: str = Query(...)):
    await websocket.accept()
    db = SessionLocal()
    try:
        payload = auth.decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.send_text(json.dumps({"type": "error", "message": "Invalid token"}))
            await websocket.close()
            return
        user = crud.get_user(db, int(user_id))
        if not user:
            await websocket.send_text(json.dumps({"type": "error", "message": "User not found"}))
            await websocket.close()
            return
        session = BotSession(websocket, user, db)
        await session.run()
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        except Exception:
            pass
    finally:
        db.close()
