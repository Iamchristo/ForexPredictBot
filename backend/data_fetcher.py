import yfinance as yf
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

MARKETS = {
    "forex": {
        "name": "Forex",
        "icon": "💱",
        "description": "Major, Minor & Exotic Pairs",
        "pairs": {
            "EUR/USD": "EURUSD=X",
            "GBP/USD": "GBPUSD=X",
            "USD/JPY": "USDJPY=X",
            "USD/CHF": "USDCHF=X",
            "AUD/USD": "AUDUSD=X",
            "USD/CAD": "USDCAD=X",
            "NZD/USD": "NZDUSD=X",
            "EUR/GBP": "EURGBP=X",
            "EUR/JPY": "EURJPY=X",
            "GBP/JPY": "GBPJPY=X",
            "EUR/AUD": "EURAUD=X",
            "GBP/AUD": "GBPAUD=X",
            "AUD/JPY": "AUDJPY=X",
            "EUR/CAD": "EURCAD=X",
            "USD/MXN": "USDMXN=X",
        }
    },
    "crypto": {
        "name": "Crypto",
        "icon": "₿",
        "description": "Top Cryptocurrencies",
        "pairs": {
            "BTC/USD": "BTC-USD",
            "ETH/USD": "ETH-USD",
            "BNB/USD": "BNB-USD",
            "XRP/USD": "XRP-USD",
            "ADA/USD": "ADA-USD",
            "SOL/USD": "SOL-USD",
            "DOGE/USD": "DOGE-USD",
            "MATIC/USD": "MATIC-USD",
            "AVAX/USD": "AVAX-USD",
            "DOT/USD": "DOT-USD",
            "LTC/USD": "LTC-USD",
            "LINK/USD": "LINK-USD",
            "UNI/USD": "UNI7083-USD",
            "ATOM/USD": "ATOM-USD",
        }
    },
    "commodities": {
        "name": "Commodities",
        "icon": "🏅",
        "description": "Metals, Energy & Agriculture",
        "pairs": {
            "Gold (XAU/USD)": "GC=F",
            "Silver (XAG/USD)": "SI=F",
            "Crude Oil (WTI)": "CL=F",
            "Brent Crude": "BZ=F",
            "Natural Gas": "NG=F",
            "Copper": "HG=F",
            "Platinum": "PL=F",
            "Palladium": "PA=F",
            "Corn": "ZC=F",
            "Wheat": "ZW=F",
        }
    },
    "indices": {
        "name": "Indices",
        "icon": "📊",
        "description": "Global Stock Indices",
        "pairs": {
            "S&P 500": "^GSPC",
            "NASDAQ 100": "^NDX",
            "Dow Jones": "^DJI",
            "FTSE 100": "^FTSE",
            "DAX 40": "^GDAXI",
            "Nikkei 225": "^N225",
            "Hang Seng": "^HSI",
            "CAC 40": "^FCHI",
            "ASX 200": "^AXJO",
            "Russell 2000": "^RUT",
        }
    }
}

# yfinance supports: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
TIMEFRAME_CONFIG = {
    "1m":  {"interval": "1m",  "period": "1d",   "resample": None},
    "2m":  {"interval": "2m",  "period": "5d",   "resample": None},
    "3m":  {"interval": "1m",  "period": "2d",   "resample": "3min"},
    "4m":  {"interval": "2m",  "period": "5d",   "resample": "4min"},
    "5m":  {"interval": "5m",  "period": "5d",   "resample": None},
    "15m": {"interval": "15m", "period": "7d",   "resample": None},
    "30m": {"interval": "30m", "period": "30d",  "resample": None},
    "1h":  {"interval": "1h",  "period": "60d",  "resample": None},
    "4h":  {"interval": "1h",  "period": "60d",  "resample": "4h"},
    "1d":  {"interval": "1d",  "period": "1y",   "resample": None},
}

TIMEFRAME_LABELS = {
    "1m": "1 Minute",
    "2m": "2 Minutes",
    "3m": "3 Minutes",
    "4m": "4 Minutes",
    "5m": "5 Minutes",
    "15m": "15 Minutes",
    "30m": "30 Minutes",
    "1h": "1 Hour",
    "4h": "4 Hours",
    "1d": "1 Day",
}


def fetch_ohlcv(symbol: str, timeframe: str) -> pd.DataFrame:
    config = TIMEFRAME_CONFIG.get(timeframe, TIMEFRAME_CONFIG["5m"])

    ticker = yf.Ticker(symbol)
    df = ticker.history(
        period=config["period"],
        interval=config["interval"],
        auto_adjust=True,
        prepost=False,
    )

    if df.empty:
        raise ValueError(f"No market data available for {symbol}. Market may be closed.")

    if config.get("resample"):
        df = df.resample(config["resample"]).agg({
            "Open": "first",
            "High": "max",
            "Low": "min",
            "Close": "last",
            "Volume": "sum",
        }).dropna()

    df.columns = [c.lower() for c in df.columns]
    df = df[["open", "high", "low", "close", "volume"]].copy()
    df.dropna(inplace=True)

    if len(df) < 30:
        raise ValueError(f"Insufficient data ({len(df)} candles). Try a longer timeframe.")

    return df


def get_symbol_for_pair(market: str, pair: str) -> str:
    if market in MARKETS and pair in MARKETS[market]["pairs"]:
        return MARKETS[market]["pairs"][pair]
    raise ValueError(f"Unknown pair '{pair}' in market '{market}'")


def get_markets() -> dict:
    return {
        market_id: {
            "name": data["name"],
            "icon": data["icon"],
            "description": data["description"],
            "pairs": list(data["pairs"].keys()),
        }
        for market_id, data in MARKETS.items()
    }


def get_current_price(symbol: str) -> float:
    ticker = yf.Ticker(symbol)
    info = ticker.fast_info
    return float(info.last_price or 0)
