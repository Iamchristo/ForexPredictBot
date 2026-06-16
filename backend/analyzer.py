"""
Technical Analyzer - computes indicators using pure pandas/numpy.
No external 'ta' library required.
"""
import pandas as pd
import numpy as np
import logging
from .data_fetcher import fetch_ohlcv, get_symbol_for_pair

logger = logging.getLogger(__name__)


# ─── Indicator helpers (pure pandas/numpy) ────────────────────────────────────

def _ema(series: pd.Series, window: int) -> pd.Series:
    return series.ewm(span=window, adjust=False).mean()


def _rsi(series: pd.Series, window: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0).rolling(window).mean()
    loss = (-delta.clip(upper=0)).rolling(window).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def _macd(series: pd.Series, fast=12, slow=26, signal=9):
    ema_fast = _ema(series, fast)
    ema_slow = _ema(series, slow)
    macd_line = ema_fast - ema_slow
    signal_line = _ema(macd_line, signal)
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def _bollinger(series: pd.Series, window=20, num_std=2):
    mid = series.rolling(window).mean()
    std = series.rolling(window).std()
    upper = mid + num_std * std
    lower = mid - num_std * std
    return upper, mid, lower


def _stochastic(high: pd.Series, low: pd.Series, close: pd.Series, k_window=14, d_window=3):
    lowest_low = low.rolling(k_window).min()
    highest_high = high.rolling(k_window).max()
    denom = (highest_high - lowest_low).replace(0, np.nan)
    k = 100 * (close - lowest_low) / denom
    d = k.rolling(d_window).mean()
    return k, d


def _adx(high: pd.Series, low: pd.Series, close: pd.Series, window=14):
    tr1 = high - low
    tr2 = (high - close.shift()).abs()
    tr3 = (low - close.shift()).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.ewm(span=window, adjust=False).mean()

    up_move = high.diff()
    down_move = -low.diff()
    dm_pos = up_move.where((up_move > down_move) & (up_move > 0), 0.0)
    dm_neg = down_move.where((down_move > up_move) & (down_move > 0), 0.0)

    di_pos = 100 * dm_pos.ewm(span=window, adjust=False).mean() / atr.replace(0, np.nan)
    di_neg = 100 * dm_neg.ewm(span=window, adjust=False).mean() / atr.replace(0, np.nan)
    dx = 100 * (di_pos - di_neg).abs() / (di_pos + di_neg).replace(0, np.nan)
    adx_val = dx.ewm(span=window, adjust=False).mean()
    return adx_val, di_pos, di_neg


def _atr(high: pd.Series, low: pd.Series, close: pd.Series, window=14) -> pd.Series:
    tr1 = high - low
    tr2 = (high - close.shift()).abs()
    tr3 = (low - close.shift()).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.ewm(span=window, adjust=False).mean()


def _obv(close: pd.Series, volume: pd.Series) -> pd.Series:
    direction = np.sign(close.diff()).fillna(0)
    return (direction * volume).cumsum()


# ─── TechnicalAnalyzer ────────────────────────────────────────────────────────

class TechnicalAnalyzer:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self._compute_indicators()

    def _compute_indicators(self):
        c = self.df['close']
        h = self.df['high']
        lo = self.df['low']
        v = self.df['volume']

        # EMA
        self.df['ema9'] = _ema(c, 9)
        self.df['ema20'] = _ema(c, 20)
        self.df['ema50'] = _ema(c, 50)
        self.df['ema200'] = _ema(c, 200)

        # RSI
        self.df['rsi'] = _rsi(c, 14)

        # MACD
        self.df['macd'], self.df['macd_signal'], self.df['macd_hist'] = _macd(c)

        # Bollinger Bands
        self.df['bb_upper'], self.df['bb_mid'], self.df['bb_lower'] = _bollinger(c)

        # Stochastic
        self.df['stoch_k'], self.df['stoch_d'] = _stochastic(h, lo, c)

        # ADX
        self.df['adx'], self.df['adx_pos'], self.df['adx_neg'] = _adx(h, lo, c)

        # ATR
        self.df['atr'] = _atr(h, lo, c)

        # OBV
        self.df['obv'] = _obv(c, v)
        self.df['obv_ema'] = _ema(self.df['obv'], 20)

    def _last(self, col: str) -> float:
        val = self.df[col].iloc[-1]
        return float(val) if not (pd.isna(val) or np.isinf(val)) else 0.0

    def _prev(self, col: str) -> float:
        if len(self.df) < 2:
            return self._last(col)
        val = self.df[col].iloc[-2]
        return float(val) if not (pd.isna(val) or np.isinf(val)) else self._last(col)

    def generate_signals(self) -> list:
        signals = []

        close = self._last('close')
        ema9 = self._last('ema9')
        ema20 = self._last('ema20')
        ema50 = self._last('ema50')
        ema200 = self._last('ema200')

        prev_ema9 = self._prev('ema9')
        prev_ema20 = self._prev('ema20')
        prev_ema50 = self._prev('ema50')

        # EMA 9/20 cross
        if ema9 > ema20:
            crossed = prev_ema9 <= prev_ema20
            signals.append({
                "indicator": "EMA 9/20",
                "signal": "BUY",
                "score": 1.5 if crossed else 1.0,
                "detail": f"EMA9 ({ema9:.5f}) above EMA20 ({ema20:.5f})" + (" - Fresh crossover!" if crossed else "")
            })
        else:
            crossed = prev_ema9 >= prev_ema20
            signals.append({
                "indicator": "EMA 9/20",
                "signal": "SELL",
                "score": -1.5 if crossed else -1.0,
                "detail": f"EMA9 ({ema9:.5f}) below EMA20 ({ema20:.5f})" + (" - Fresh crossover!" if crossed else "")
            })

        # EMA 20/50 cross
        if ema20 > ema50:
            crossed = prev_ema20 <= prev_ema50
            signals.append({
                "indicator": "EMA 20/50",
                "signal": "BUY",
                "score": 1.5 if crossed else 1.0,
                "detail": f"EMA20 ({ema20:.5f}) above EMA50 ({ema50:.5f})"
            })
        else:
            crossed = prev_ema20 >= prev_ema50
            signals.append({
                "indicator": "EMA 20/50",
                "signal": "SELL",
                "score": -1.5 if crossed else -1.0,
                "detail": f"EMA20 ({ema20:.5f}) below EMA50 ({ema50:.5f})"
            })

        # Price vs EMA 200
        if ema200 > 0:
            if close > ema200:
                signals.append({"indicator": "EMA 200", "signal": "BUY", "score": 1.0,
                                 "detail": f"Price ({close:.5f}) above EMA200 ({ema200:.5f}) - Bullish trend"})
            else:
                signals.append({"indicator": "EMA 200", "signal": "SELL", "score": -1.0,
                                 "detail": f"Price ({close:.5f}) below EMA200 ({ema200:.5f}) - Bearish trend"})

        # RSI
        rsi = self._last('rsi')
        if rsi < 30:
            signals.append({"indicator": "RSI", "signal": "BUY", "score": 1.5,
                             "detail": f"RSI ({rsi:.1f}) oversold - potential reversal up"})
        elif rsi > 70:
            signals.append({"indicator": "RSI", "signal": "SELL", "score": -1.5,
                             "detail": f"RSI ({rsi:.1f}) overbought - potential reversal down"})
        elif rsi < 45:
            signals.append({"indicator": "RSI", "signal": "BUY", "score": 0.5,
                             "detail": f"RSI ({rsi:.1f}) slightly bullish territory"})
        elif rsi > 55:
            signals.append({"indicator": "RSI", "signal": "SELL", "score": -0.5,
                             "detail": f"RSI ({rsi:.1f}) slightly bearish territory"})
        else:
            signals.append({"indicator": "RSI", "signal": "NEUTRAL", "score": 0.0,
                             "detail": f"RSI ({rsi:.1f}) in neutral zone"})

        # MACD
        macd = self._last('macd')
        macd_sig = self._last('macd_signal')
        macd_hist = self._last('macd_hist')
        prev_hist = self._prev('macd_hist')
        fresh_cross = (macd_hist > 0 and prev_hist <= 0) or (macd_hist < 0 and prev_hist >= 0)
        if macd > macd_sig:
            score = 2.0 if fresh_cross else 1.5
            signals.append({"indicator": "MACD", "signal": "BUY", "score": score,
                             "detail": f"MACD ({macd:.5f}) above signal ({macd_sig:.5f})" + (" - Fresh bullish cross!" if fresh_cross else "")})
        else:
            score = -2.0 if fresh_cross else -1.5
            signals.append({"indicator": "MACD", "signal": "SELL", "score": score,
                             "detail": f"MACD ({macd:.5f}) below signal ({macd_sig:.5f})" + (" - Fresh bearish cross!" if fresh_cross else "")})

        # Bollinger Bands
        bb_upper = self._last('bb_upper')
        bb_lower = self._last('bb_lower')
        bb_range = bb_upper - bb_lower
        if bb_range > 0:
            bb_pos = (close - bb_lower) / bb_range
            if bb_pos < 0.2:
                signals.append({"indicator": "Bollinger Bands", "signal": "BUY", "score": 1.0,
                                 "detail": "Price near lower band - potential bounce"})
            elif bb_pos > 0.8:
                signals.append({"indicator": "Bollinger Bands", "signal": "SELL", "score": -1.0,
                                 "detail": "Price near upper band - potential reversal"})
            else:
                signals.append({"indicator": "Bollinger Bands", "signal": "NEUTRAL", "score": 0.0,
                                 "detail": "Price in middle of Bollinger Bands"})

        # Stochastic
        stoch_k = self._last('stoch_k')
        stoch_d = self._last('stoch_d')
        if stoch_k < 20 and stoch_k > stoch_d:
            signals.append({"indicator": "Stochastic", "signal": "BUY", "score": 1.5,
                             "detail": f"Stoch K({stoch_k:.1f}) oversold with K>D - bullish momentum"})
        elif stoch_k > 80 and stoch_k < stoch_d:
            signals.append({"indicator": "Stochastic", "signal": "SELL", "score": -1.5,
                             "detail": f"Stoch K({stoch_k:.1f}) overbought with K<D - bearish momentum"})
        elif stoch_k < 20:
            signals.append({"indicator": "Stochastic", "signal": "BUY", "score": 1.0,
                             "detail": f"Stoch K({stoch_k:.1f}) in oversold zone"})
        elif stoch_k > 80:
            signals.append({"indicator": "Stochastic", "signal": "SELL", "score": -1.0,
                             "detail": f"Stoch K({stoch_k:.1f}) in overbought zone"})
        else:
            signals.append({"indicator": "Stochastic", "signal": "NEUTRAL", "score": 0.0,
                             "detail": f"Stoch K({stoch_k:.1f}) neutral"})

        # ADX
        adx = self._last('adx')
        adx_pos = self._last('adx_pos')
        adx_neg = self._last('adx_neg')
        if adx > 25:
            if adx_pos > adx_neg:
                signals.append({"indicator": "ADX", "signal": "BUY", "score": 1.0,
                                 "detail": f"ADX({adx:.1f}) strong trend, +DI({adx_pos:.1f}) > -DI({adx_neg:.1f})"})
            else:
                signals.append({"indicator": "ADX", "signal": "SELL", "score": -1.0,
                                 "detail": f"ADX({adx:.1f}) strong trend, -DI({adx_neg:.1f}) > +DI({adx_pos:.1f})"})
        else:
            signals.append({"indicator": "ADX", "signal": "NEUTRAL", "score": 0.0,
                             "detail": f"ADX({adx:.1f}) weak trend - ranging market"})

        # OBV
        obv = self._last('obv')
        obv_ema = self._last('obv_ema')
        if obv > obv_ema:
            signals.append({"indicator": "OBV", "signal": "BUY", "score": 0.5,
                             "detail": "OBV above its EMA - buying pressure dominant"})
        else:
            signals.append({"indicator": "OBV", "signal": "SELL", "score": -0.5,
                             "detail": "OBV below its EMA - selling pressure dominant"})

        # Candlestick patterns
        signals.extend(self._detect_candlestick_patterns())

        return signals

    def _detect_candlestick_patterns(self) -> list:
        if len(self.df) < 3:
            return []

        c0 = self.df.iloc[-1]
        c1 = self.df.iloc[-2]

        o0 = float(c0['open']); h0 = float(c0['high']); lo0 = float(c0['low']); cl0 = float(c0['close'])
        o1 = float(c1['open']); h1 = float(c1['high']); lo1 = float(c1['low']); cl1 = float(c1['close'])

        body0 = abs(cl0 - o0)
        range0 = h0 - lo0 if h0 > lo0 else 0.0001

        signals = []

        # Bullish engulfing
        if cl1 < o1 and cl0 > o0 and cl0 > o1 and o0 < cl1:
            signals.append({"indicator": "Candlestick", "signal": "BUY", "score": 1.5,
                             "detail": "Bullish Engulfing pattern detected"})
        # Bearish engulfing
        elif cl1 > o1 and cl0 < o0 and cl0 < o1 and o0 > cl1:
            signals.append({"indicator": "Candlestick", "signal": "SELL", "score": -1.5,
                             "detail": "Bearish Engulfing pattern detected"})
        # Hammer (small body at top, long lower shadow)
        elif body0 > 0 and (min(o0, cl0) - lo0) > 2 * body0 and (h0 - max(o0, cl0)) < body0 * 0.5:
            signals.append({"indicator": "Candlestick", "signal": "BUY", "score": 1.0,
                             "detail": "Hammer pattern - potential bullish reversal"})
        # Shooting star (small body at bottom, long upper shadow)
        elif body0 > 0 and (h0 - max(o0, cl0)) > 2 * body0 and (min(o0, cl0) - lo0) < body0 * 0.5:
            signals.append({"indicator": "Candlestick", "signal": "SELL", "score": -1.0,
                             "detail": "Shooting Star - potential bearish reversal"})
        # Doji
        elif body0 < range0 * 0.1:
            signals.append({"indicator": "Candlestick", "signal": "NEUTRAL", "score": 0.0,
                             "detail": "Doji - market indecision, watch for breakout"})

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

        close = self._last('close')
        atr = self._last('atr')
        if atr == 0 or np.isnan(atr):
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

        # ATR-based levels: SL = 1.5*ATR, TP1 = 1.5R, TP2 = 2.5R, TP3 = 4R
        sl_distance = 1.5 * atr
        entry = close

        if direction == "BUY":
            sl = entry - sl_distance
            tp1 = entry + sl_distance * 1.5
            tp2 = entry + sl_distance * 2.5
            tp3 = entry + sl_distance * 4.0
        elif direction == "SELL":
            sl = entry + sl_distance
            tp1 = entry - sl_distance * 1.5
            tp2 = entry - sl_distance * 2.5
            tp3 = entry - sl_distance * 4.0
        else:
            sl = entry - sl_distance
            tp1 = entry + sl_distance * 1.5
            tp2 = entry + sl_distance * 2.5
            tp3 = entry + sl_distance * 4.0

        risk = abs(entry - sl)
        reward = abs(tp1 - entry)
        rr_ratio = reward / risk if risk > 0 else 1.5

        support, resistance = self.get_support_resistance()

        # Chart data (last 100 candles)
        chart_data = []
        for idx, row in self.df.tail(100).iterrows():
            try:
                ts = int(pd.Timestamp(idx).timestamp())
            except Exception:
                continue
            chart_data.append({
                "time": ts,
                "open": round(float(row['open']), 6),
                "high": round(float(row['high']), 6),
                "low": round(float(row['low']), 6),
                "close": round(float(row['close']), 6),
            })

        # Summary
        if direction == "BUY":
            summary = (f"Bullish signal with {confidence:.0f}% confidence. "
                       f"{len(buy_signals)} buy indicators vs {len(sell_signals)} sell. "
                       f"Entry at {entry:.5f}, SL at {sl:.5f}, TP1 at {tp1:.5f}.")
        elif direction == "SELL":
            summary = (f"Bearish signal with {confidence:.0f}% confidence. "
                       f"{len(sell_signals)} sell indicators vs {len(buy_signals)} buy. "
                       f"Entry at {entry:.5f}, SL at {sl:.5f}, TP1 at {tp1:.5f}.")
        else:
            summary = (f"Market indecision. {len(buy_signals)} buy vs {len(sell_signals)} sell signals "
                       f"(confidence {confidence:.0f}%). Wait for a clearer setup before entering.")

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
