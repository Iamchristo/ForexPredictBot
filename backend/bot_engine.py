import json
import asyncio
import logging
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from .data_fetcher import MARKETS, TIMEFRAME_LABELS, get_markets
from .analyzer import analyze_pair
import os

logger = logging.getLogger(__name__)

TIMEFRAMES = list(TIMEFRAME_LABELS.keys())


class BotSession:
    def __init__(self, websocket: WebSocket, user, db: Session):
        self.ws = websocket
        self.user = user
        self.db = db
        self.state = "GREETING"
        self.selected_market = None
        self.selected_pair = None
        self.selected_timeframe = None

    async def send(self, data: dict):
        await self.ws.send_text(json.dumps(data))

    async def send_message(self, text: str):
        await self.send({"type": "bot_message", "text": text, "avatar": "bot"})

    async def send_options(self, options: list):
        await self.send({"type": "options", "options": options})

    async def send_typing(self):
        await self.send({"type": "typing"})

    async def run(self):
        await self.greet()
        try:
            while True:
                data = await self.ws.receive_text()
                msg = json.loads(data)
                await self.handle_message(msg)
        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.error(f"Bot session error: {e}")
            try:
                await self.send({"type": "error", "message": str(e)})
            except Exception:
                pass

    async def greet(self):
        name = self.user.name.split()[0] if self.user.name else "Trader"
        await self.send_message(f"Hello {name}! 👋 I'm your ForexPredictBot AI assistant.")
        await asyncio.sleep(0.3)
        await self.send_message("I use 10+ technical indicators to analyze markets and generate precise trading signals.")
        await asyncio.sleep(0.3)
        await self.ask_market()

    async def ask_market(self):
        self.state = "SELECT_MARKET"
        await self.send_message("Which market would you like to analyze today?")
        markets = get_markets()
        options = [
            {
                "label": data["name"],
                "value": market_id,
                "icon": MARKETS[market_id]["icon"],
                "description": data["description"],
            }
            for market_id, data in markets.items()
        ]
        await self.send_options(options)

    async def ask_pair(self):
        self.state = "SELECT_PAIR"
        market_info = MARKETS[self.selected_market]
        await self.send_message(f"Great choice! Select a {market_info['name']} pair:")
        pairs = list(market_info["pairs"].keys())
        options = [
            {"label": p, "value": p, "icon": MARKETS[self.selected_market]["icon"]}
            for p in pairs
        ]
        await self.send_options(options)

    async def ask_timeframe(self):
        self.state = "SELECT_TIMEFRAME"
        await self.send_message(f"Perfect! Now select your preferred timeframe for **{self.selected_pair}**:")
        options = [
            {"label": TIMEFRAME_LABELS[tf], "value": tf, "icon": "⏱️"}
            for tf in TIMEFRAMES
        ]
        await self.send_options(options)

    async def run_analysis(self):
        self.state = "ANALYZING"
        await self.send({"type": "analysis_start"})
        await self.send_message(
            f"🔍 Analyzing **{self.selected_pair}** on "
            f"{TIMEFRAME_LABELS.get(self.selected_timeframe, self.selected_timeframe)} timeframe..."
        )
        await asyncio.sleep(0.5)
        await self.send_message(
            "Computing 10+ technical indicators: EMA, RSI, MACD, Bollinger Bands, "
            "Stochastic, ADX, ATR, OBV and more..."
        )

        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, analyze_pair, self.selected_market, self.selected_pair, self.selected_timeframe
            )

            # Save to trade history
            try:
                from . import crud
                import json as json_mod
                crud.create_trade_history(self.db, {
                    "user_id": self.user.id,
                    "pair": result["pair"],
                    "market": self.selected_market,
                    "timeframe": result["timeframe"],
                    "direction": result["direction"],
                    "confidence": result["confidence"],
                    "entry_price": result["entry_price"],
                    "stop_loss": result["stop_loss"],
                    "take_profit_1": result["take_profit_1"],
                    "take_profit_2": result["take_profit_2"],
                    "take_profit_3": result["take_profit_3"],
                    "atr": result["atr"],
                    "signals_json": json_mod.dumps(result["signals"]),
                })
            except Exception as e:
                logger.warning(f"Could not save trade history: {e}")

            self.state = "RESULTS"
            await self.send({"type": "analysis_complete", "data": result})
            await asyncio.sleep(0.3)
            await self.send_message(
                f"✅ Analysis complete! **{result['direction']}** signal with "
                f"**{result['confidence']:.0f}%** confidence."
            )
            await asyncio.sleep(0.3)
            await self.send_message(
                "Do you have any questions about this analysis? "
                "You can ask me anything about the signals or market conditions."
            )
            self.state = "FOLLOWUP"
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            await self.send({"type": "error", "message": f"Analysis failed: {str(e)}"})
            await self.send_message(
                "❌ Sorry, I couldn't fetch market data. The market may be closed or unavailable. "
                "Would you like to try a different pair?"
            )
            self.state = "SELECT_PAIR"
            await self.ask_pair()

    async def handle_followup(self, text: str):
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_key and anthropic_key != "your_anthropic_api_key_here":
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=anthropic_key)
                context = (
                    f"You are a professional forex trading assistant. The user has just received a "
                    f"{self.selected_pair} analysis on {self.selected_timeframe} timeframe."
                )
                response = client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=300,
                    messages=[{"role": "user", "content": f"{context}\n\nUser question: {text}"}],
                )
                reply = response.content[0].text
                await self.send_message(reply)
            except Exception as e:
                logger.error(f"Anthropic error: {e}")
                await self._template_followup(text)
        else:
            await self._template_followup(text)

        await asyncio.sleep(0.5)
        await self.send_message("Would you like to analyze another pair? Type 'new' to start over.")

    async def _template_followup(self, text: str):
        text_lower = text.lower()
        if any(w in text_lower for w in ["stop loss", "sl", "risk"]):
            await self.send_message(
                "The stop loss is calculated at 1.5x ATR from the entry price, giving your trade "
                "room to breathe while limiting downside risk."
            )
        elif any(w in text_lower for w in ["take profit", "tp", "target"]):
            await self.send_message(
                "Take profit levels are set at 1.5R, 2.5R, and 4R risk multiples. "
                "Consider taking partial profits at TP1 and letting the rest run."
            )
        elif any(w in text_lower for w in ["confidence", "sure", "accurate"]):
            await self.send_message(
                "Confidence is based on the agreement of 10+ technical indicators. "
                "Higher confidence means more indicators align. No signal is 100% accurate - "
                "always use proper risk management."
            )
        elif any(w in text_lower for w in ["rsi"]):
            await self.send_message(
                "RSI (Relative Strength Index) measures momentum. "
                "Below 30 = oversold (potential buy), above 70 = overbought (potential sell)."
            )
        elif any(w in text_lower for w in ["macd"]):
            await self.send_message(
                "MACD shows trend direction and momentum. "
                "A bullish crossover (MACD above signal line) suggests upward momentum."
            )
        else:
            await self.send_message(
                "I analyze technical indicators to predict market direction. For best results, "
                "always combine technical analysis with fundamental analysis and proper risk management. "
                "Never risk more than 1-2% of your account per trade."
            )

    async def handle_message(self, msg: dict):
        msg_type = msg.get("type")

        if msg_type == "select":
            value = msg.get("value")
            if self.state == "SELECT_MARKET":
                if value in MARKETS:
                    self.selected_market = value
                    await self.send_message(f"Selected: **{MARKETS[value]['name']}** {MARKETS[value]['icon']}")
                    await self.ask_pair()
                else:
                    await self.send_message("Please select a valid market.")

            elif self.state == "SELECT_PAIR":
                if self.selected_market and value in MARKETS[self.selected_market]["pairs"]:
                    self.selected_pair = value
                    await self.send_message(f"Selected pair: **{value}**")
                    await self.ask_timeframe()
                else:
                    await self.send_message("Please select a valid pair.")

            elif self.state == "SELECT_TIMEFRAME":
                if value in TIMEFRAME_LABELS:
                    self.selected_timeframe = value
                    await self.send_message(f"Selected timeframe: **{TIMEFRAME_LABELS[value]}**")
                    await self.run_analysis()
                else:
                    await self.send_message("Please select a valid timeframe.")

        elif msg_type == "message":
            text = msg.get("text", "").strip()
            if not text:
                return

            if text.lower() in ["new", "restart", "start over", "new analysis"]:
                await self.send_message("Starting a new analysis! 🔄")
                await self.ask_market()
                return

            if self.state == "FOLLOWUP":
                await self.handle_followup(text)
            elif self.state in ("GREETING", "SELECT_MARKET"):
                await self.send_message("Please select a market from the options above to get started.")
            elif self.state == "SELECT_PAIR":
                await self.send_message("Please select a pair from the options above.")
            elif self.state == "SELECT_TIMEFRAME":
                await self.send_message("Please select a timeframe from the options above.")
            else:
                await self.send_message("I'm processing your analysis. Please wait...")
