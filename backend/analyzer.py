import pandas as pd
import numpy as np
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.trend import MACD, EMAIndicator, ADXIndicator
from ta.volatility import BollingerBands, AverageTrueRange
from ta.volume import OnBalanceVolumeIndicator
import logging
from .data_fetcher import fetch_ohlcv, get_symbol_for_pair

logger = logging.getLogger(__name__)


class TechnicalAnalyzer:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self._compute_indicators()

    def _compute_indicators(self):
        close = self.df['close']
        high = self.df['high']
        low = self.df['low']
        volume = self.df['volume']

        # EMA
        self.df['ema9'] = EMAIndicator(close, window=9).ema_indicator()
        self.df['ema20'] = EMAIndicator(close, window=20).ema_indicator()
        self.df['ema50'] = EMAIndicator(close, window=50).ema_indicator()
        self.df['ema200'] = EMAIndicator(close, window=200).ema_indicator()

        # RSI
        self.df['rsi'] = RSIIndicator(close, window=14).rsi()

        # MACD
        macd = MACD(close, window_slow=26, window_fast=12, window_sign=9)
        self.df['macd'] = macd.macd()
        self.df['macd_signal'] = macd.macd_signal()
        self.df['macd_hist'] = macd.macd_diff()

        # Bollinger Bands
        bb = BollingerBands(close, window=20, window_dev=2)
        self.df['bb_upper'] = bb.bollinger_hband()
        self.df['bb_lower'] = bb.bollinger_lband()
        self.df['bb_mid'] = bb.bollinger_mavg()

        # Stochastic
        stoch = StochasticOscillator(high, low, close, window=14, smooth_window=3)
        self.df['stoch_k'] = stoch.stoch()
        self.df['stoch_d'] = stoch.stoch_signal()

        # ADX
        adx = ADXIndicator(high, low, close, window=14)
        self.df['adx'] = adx.adx()
        self.df['adx_pos'] = adx.adx_pos()
        self.df['adx_neg'] = adx.adx_neg()

        # ATR
        self.df['atr'] = AverageTrueRange(high, low, close, window=14).average_true_range()

        # OBV
        self.df['obv'] = OnBalanceVolumeIndicator(close, volume).on_balance_volume()
        self.df['obv_ema'] = EMAIndicator(self.df['obv'], window=20).ema_indicator()

    def _get_last(self, col):
        return float(self.df[col].iloc[-1]) if not pd.isna(self.df[col].iloc[-1]) else 0.0

    def generate_signals(self) -> list:
        signals = []
        last = self.df.iloc[-1]
        prev = self.df.iloc[-2] if len(self.df) > 1 else last

        close = self._get_last('close')

        # EMA 9/20 cross
        ema9 = self._get_last('ema9')
        ema20 = self._get_last('ema20')
        prev_ema9 = float(prev['ema9']) if not pd.isna(prev['ema9']) else ema9
        prev_ema20 = float(prev['ema20']) if not pd.isna(prev['ema20']) else ema20
        if ema9 > ema20:
            crossed = prev_ema9 <= prev_ema20
            signals.append({
                "indicator": "EMA 9/20",
                "signal": "BUY",
                "score": 1.5 if crossed else 1.0,
                "detail": f"EMA9 ({ema9:.5f}) above EMA20 ({ema20:.5f})" + (" - Fresh crossover!" if crossed else ""),
            })
        else:
            crossed = prev_ema9 >= prev_ema20
            signals.append({
                "indicator": "EMA 9/20",
                "signal": "SELL",
                "score": -1.5 if crossed else -1.0,
                "detail": f"EMA9 ({ema9:.5f}) below EMA20 ({ema20:.5f})" + (" - Fresh crossover!" if crossed else ""),
            })

        # EMA 20/50 cross
        ema50 = self._get_last('ema50')
        prev_ema50 = float(prev['ema50']) if not pd.isna(prev['ema50']) else ema50
        if ema20 > ema50:
            crossed = prev_ema20 <= prev_ema50
            signals.append({
                "indicator": "EMA 20/50",
                "signal": "BUY",
                "score": 1.5 if crossed else 1.0,
                "detail": f"EMA20 ({ema20:.5f}) above EMA50 ({ema50:.5f})",
            })
        else:
            crossed = prev_ema20 >= prev_ema50
            signals.append({
                "indicator": "EMA 20/50",
                "signal": "SELL",
                "score": -1.5 if crossed else -1.0,
                "detail": f"EMA20 ({ema20:.5f}) below EMA50 ({ema50:.5f})",
            })

        # Price vs EMA200
        ema200 = self._get_last('ema200')
        if ema200 > 0:
            if close > ema200:
                signals.append({
                    "indicator": "EMA 200",
                    "signal": "BUY",
                    "score": 1.0,
                    "detail": f"Price ({close:.5f}) above EMA200 ({ema200:.5f}) - Bullish trend",
                })
            else:
                signals.append({
                    "indicator": "EMA 200",
                    "signal": "SELL",
                    "score": -1.0,
                    "detail": f"Price ({close:.5f}) below EMA200 ({ema200:.5f}) - Bearish trend",
                })

        # RSI
        rsi = self._get_last('rsi')
        if rsi < 30:
            signals.append({"indicator": "RSI", "signal": "BUY", "score": 1.5, "detail": f"RSI ({rsi:.1f}) oversold - potential reversal up"})
        elif rsi > 70:
            signals.append({"indicator": "RSI", "signal": "SELL", "score": -1.5, "detail": f"RSI ({rsi:.1f}) overbought - potential reversal down"})
        elif rsi < 45:
            signals.append({"indicator": "RSI", "signal": "BUY", "score": 0.5, "detail": f"RSI ({rsi:.1f}) slightly bullish territory"})
        elif rsi > 55:
            signals.append({"indicator": "RSI", "signal": "SELL", "score": -0.5, "detail": f"RSI ({rsi:.1f}) slightly bearish territory"})
        else:
            signals.append({"indicator": "RSI", "signal": "NEUTRAL", "score": 0.0, "detail": f"RSI ({rsi:.1f}) in neutral zone"})

        # MACD
        macd = self._get_last('macd')
        macd_signal = self._get_last('macd_signal')
        macd_hist = self._get_last('macd_hist')
        prev_macd_hist = float(prev['macd_hist']) if not pd.isna(prev.get('macd_hist', float('nan'))) else macd_hist
        fresh_cross = (macd_hist > 0 and prev_macd_hist <= 0) or (macd_hist < 0 and prev_macd_hist >= 0)
        if macd > macd_signal:
            score = 2.0 if fresh_cross else 1.5
            signals.append({
                "indicator": "MACD",
                "signal": "BUY",
                "score": score,
                "detail": f"MACD ({macd:.5f}) above signal ({macd_signal:.5f})" + (" - Fresh bullish cross!" if fresh_cross else ""),
            })
        else:
            score = -2.0 if fresh_cross else -1.5
            signals.append({
                "indicator": "MACD",
                "signal": "SELL",
                "score": score,
                "detail": f"MACD ({macd:.5f}) below signal ({macd_signal:.5f})" + (" - Fresh bearish cross!" if fresh_cross else ""),
            })

        # Bollinger Bands
        bb_upper = self._get_last('bb_upper')
        bb_lower = self._get_last('bb_lower')
        bb_mid = self._get_last('bb_mid')
        bb_range = bb_upper - bb_lower
        if bb_range > 0:
            bb_pos = (close - bb_lower) / bb_range
            if bb_pos < 0.2:
                signals.append({"indicator": "Bollinger Bands", "signal": "BUY", "score": 1.0, "detail": "Price near lower band - potential bounce"})
            elif bb_pos > 0.8:
                signals.append({"indicator": "Bollinger Bands", "signal": "SELL", "score": -1.0, "detail": "Price near upper band - potential reversal"})
            else:
                signals.append({"indicator": "Bollinger Bands", "signal": "NEUTRAL", "score": 0.0, "detail": "Price in middle of Bollinger Bands"})

        # Stochastic
        stoch_k = self._get_last('stoch_k')
        stoch_d = self._get_last('stoch_d')
        if stoch_k < 20 and stoch_k > stoch_d:
            signals.append({"indicator": "Stochastic", "signal": "BUY", "score": 1.5, "detail": f"Stoch K({stoch_k:.1f}) oversold with K>D - bullish"})
        elif stoch_k > 80 and stoch_k < stoch_d:
            signals.append({"indicator": "Stochastic", "signal": "SELL", "score": -1.5, "detail": f"Stoch K({stoch_k:.1f}) overbought with K<D - bearish"})
        elif stoch_k < 20:
            signals.append({"indicator": "Stochastic", "signal": "BUY", "score": 1.0, "detail": f"Stoch K({stoch_k:.1f}) in oversold zone"})
        elif stoch_k > 80:
            signals.append({"indicator": "Stochastic", "signal": "SELL", "score": -1.0, "detail": f"Stoch K({stoch_k:.1f}) in overbought zone"})
        else:
            signals.append({"indicator": "Stochastic", "signal": "NEUTRAL", "score": 0.0, "detail": f"Stoch K({stoch_k:.1f}) neutral"})

        # ADX
        adx = self._get_last('adx')
        adx_pos = self._get_last('adx_pos')
        adx_neg = self._get_last('adx_neg')
        if adx > 25:
            if adx_pos > adx_neg:
                signals.append({"indicator": "ADX", "signal": "BUY", "score": 1.0, "detail": f"ADX({adx:.1f}) strong trend, +DI({adx_pos:.1f}) > -DI({adx_neg:.1f})"})
            else:
                signals.append({"indicator": "ADX", "signal": "SELL", "score": -1.0, "detail": f"ADX({adx:.1f}) strong trend, -DI({adx_neg:.1f}) > +DI({adx_pos:.1f})"})
        else:
            signals.append({"indicator": "ADX", "signal": "NEUTRAL", "score": 0.0, "detail": f"ADX({adx:.1f}) weak trend - ranging market"})

        # OBV
        obv = self._get_last('obv')
        obv_ema = self._get_last('obv_ema')
        if obv > obv_ema:
            signals.append({"indicator": "OBV", "signal": "BUY", "score": 0.5, "detail": "OBV above its EMA - buying pressure"})
        else:
            signals.append({"indicator": "OBV", "signal": "SELL", "score": -0.5, "detail": "OBV below its EMA - selling pressure"})

        # Candlestick patterns
        candle_signals = self._detect_candlestick_patterns()
        signals.extend(candle_signals)

        return signals

    def _detect_candlestick_patterns(self) -> list:
        signals = []
        if len(self.df) < 3:
            return signals

        c0 = self.df.iloc[-1]   # current
        c1 = self.df.iloc[-2]   # prev
        c2 = self.df.iloc[-3] if len(self.df) >= 3 else c1  # 2 bars ago

        o0, h0, lo0, cl0 = float(c0['open']), float(c0['high']), float(c0['low']), float(c0['close'])
        o1, h1, lo1, cl1 = float(c1['open']), float(c1['high']), float(c1['low']), float(c1['close'])
        o2, h2, lo2, cl2 = float(c2['open']), float(c2['high']), float(c2['low']), float(c2['close'])

        body0 = abs(cl0 - o0)
        body1 = abs(cl1 - o1)
        range0 = h0 - lo0 if h0 > lo0 else 0.0001

        # Bullish engulfing
        if cl1 < o1 and cl0 > o0 and cl0 > o1 and o0 < cl1:
            signals.append({"indicator": "Candlestick", "signal": "BUY", "score": 1.5, "detail": "Bullish Engulfing pattern detected"})
        # Bearish engulfing
        elif cl1 > o1 and cl0 < o0 and cl0 < o1 and o0 > cl1:
            signals.append({"indicator": "Candlestick", "signal": "SELL", "score": -1.5, "detail": "Bearish Engulfing pattern detected"})
        # Hammer (bullish)
        elif (lo0 < min(o0, cl0) - 2 * body0 and (h0 - max(o0, cl0)) < body0 * 0.5 and body0 > 0):
            signals.append({"indicator": "Candlestick", "signal": "BUY", "score": 1.0, "detail": "Hammer pattern - potential bullish reversal"})
        # Shooting star (bearish)
        elif (h0 > max(o0, cl0) + 2 * body0 and (min(o0, cl0) - lo0) < body0 * 0.5 and body0 > 0):
            signals.append({"indicator": "Candlestick", "signal": "SELL", "score": -1.0, "detail": "Shooting Star - potential bearish reversal"})
        # Doji
        elif body0 < range0 * 0.1:
            signals.append({"indicator": "Candlestick", "signal": "NEUTRAL", "score": 0.0, "detail": "Doji - market indecision"})

        return signals

    def get_support_resistance(self) -> tuple:
        recent = self.df.tail(50)
        support = float(recent['low'].min())
        resistance = float(recent['high'].max())
        return support, resistance

    def generate_prediction(self, pair: str, timeframe: str) -> dict:
        signals = self.generate_signals()

        buy_signals = [s for s in signals if s['signal'] == 'BUY']
        sell_signals = [s for s in signals if s['signal'] == 'SELL']
        neutral_signals = [s for s in signals if s['signal'] == 'NEUTRAL']

        buy_score = sum(abs(s['score']) for s in buy_signals)
        sell_score = sum(abs(s['score']) for s in sell_signals)
        total_score = buy_score + sell_score

        close = self._get_last('close')
        atr = self._get_last('atr')
        if atr == 0:
            atr = close * 0.001

        if total_score == 0:
            direction = "WAIT"
            confidence = 50.0
        elif buy_score > sell_score:
            direction = "BUY"
            confidence = min(95.0, (buy_score / total_score) * 100)
        else:
            direction = "SELL"
            confidence = min(95.0, (sell_score / total_score) * 100)

        # Confidence must be > 55 to call BUY/SELL
        if confidence < 55:
            direction = "WAIT"

        if confidence >= 80:
            confidence_label = "VERY HIGH"
        elif confidence >= 65:
            confidence_label = "HIGH"
        elif confidence >= 55:
            confidence_label = "MODERATE"
        else:
            confidence_label = "LOW"

        # Entry/SL/TP using ATR
        entry = close
        if direction == "BUY":
            sl = entry - 1.5 * atr
            tp1 = entry + 1.5 * atr * 1.5
            tp2 = entry + 1.5 * atr * 2.5
            tp3 = entry + 1.5 * atr * 4.0
        elif direction == "SELL":
            sl = entry + 1.5 * atr
            tp1 = entry - 1.5 * atr * 1.5
            tp2 = entry - 1.5 * atr * 2.5
            tp3 = entry - 1.5 * atr * 4.0
        else:
            sl = entry - 1.5 * atr
            tp1 = entry + 1.5 * atr
            tp2 = entry + 2.5 * atr
            tp3 = entry + 4.0 * atr

        risk = abs(entry - sl)
        reward = abs(tp1 - entry)
        rr_ratio = reward / risk if risk > 0 else 1.5

        support, resistance = self.get_support_resistance()

        # Chart data (last 100 candles)
        chart_rows = self.df.tail(100)
        chart_data = []
        for idx, row in chart_rows.iterrows():
            ts = int(idx.timestamp()) if hasattr(idx, 'timestamp') else int(pd.Timestamp(idx).timestamp())
            chart_data.append({
                "time": ts,
                "open": round(float(row['open']), 6),
                "high": round(float(row['high']), 6),
                "low": round(float(row['low']), 6),
                "close": round(float(row['close']), 6),
            })

        # Analysis summary
        if direction == "BUY":
            summary = (
                f"Bullish signal with {confidence:.0f}% confidence. "
                f"{len(buy_signals)} buy indicators vs {len(sell_signals)} sell indicators. "
                f"Entry at {entry:.5f}, targeting {tp1:.5f} with stop at {sl:.5f}."
            )
        elif direction == "SELL":
            summary = (
                f"Bearish signal with {confidence:.0f}% confidence. "
                f"{len(sell_signals)} sell indicators vs {len(buy_signals)} buy indicators. "
                f"Entry at {entry:.5f}, targeting {tp1:.5f} with stop at {sl:.5f}."
            )
        else:
            summary = (
                f"Market is ranging. Insufficient directional consensus "
                f"({len(buy_signals)} buy vs {len(sell_signals)} sell signals). "
                "Wait for a clearer setup."
            )

        return {
            "pair": pair,
            "timeframe": timeframe,
            "direction": direction,
            "confidence": round(confidence, 1),
            "confidence_label": confidence_label,
            "entry_price": round(entry, 6),
            "stop_loss": round(sl, 6),
            "take_profit_1": round(tp1, 6),
            "take_profit_2": round(tp2, 6),
            "take_profit_3": round(tp3, 6),
            "current_price": round(close, 6),
            "atr": round(atr, 6),
            "rr_ratio": round(rr_ratio, 2),
            "support": round(support, 6),
            "resistance": round(resistance, 6),
            "signal_counts": {
                "buy": len(buy_signals),
                "sell": len(sell_signals),
                "neutral": len(neutral_signals),
                "total": len(signals),
            },
            "signals": signals,
            "chart_data": chart_data,
            "analysis_summary": summary,
        }


def analyze_pair(market: str, pair: str, timeframe: str) -> dict:
    symbol = get_symbol_for_pair(market, pair)
    df = fetch_ohlcv(symbol, timeframe)
    analyzer = TechnicalAnalyzer(df)
    return analyzer.generate_prediction(pair, timeframe)
