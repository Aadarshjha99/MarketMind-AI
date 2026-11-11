
import numpy as np
import pandas as pd


FEATURE_COLUMNS = [
    "open",
    "high",
    "low",
    "close",
    "volume",
    "sma20",
    "sma50",
    "ema20",
    "ema50",
    "rsi14",
    "macd",
    "macd_signal",
    "macd_histogram",
    "daily_return",
    "return_5d",
    "return_10d",
    "volatility_10d",
    "volume_ratio",
    "price_range",
]


def calculate_rsi(series, period=14):
    delta = series.diff()

    gains = delta.clip(lower=0)
    losses = -delta.clip(upper=0)

    avg_gain = gains.ewm(
        alpha=1 / period,
        min_periods=period,
        adjust=False
    ).mean()

    avg_loss = losses.ewm(
        alpha=1 / period,
        min_periods=period,
        adjust=False
    ).mean()

    rs = avg_gain / avg_loss

    rsi = 100 - (100 / (1 + rs))

    # Handle completely flat price movements.
    rsi = rsi.mask(
        (avg_gain == 0) & (avg_loss == 0),
        50
    )

    rsi = rsi.mask(
        (avg_loss == 0) & (avg_gain > 0),
        100
    )

    return rsi


def create_features(df):
    """
    Calculate technical and statistical features.

    Each row contains information available at the close
    of that trading session.
    """

    data = df.copy()

    close = data["close"]

    # Moving averages
    data["sma20"] = close.rolling(20).mean()
    data["sma50"] = close.rolling(50).mean()

    data["ema20"] = close.ewm(
        span=20,
        adjust=False
    ).mean()

    data["ema50"] = close.ewm(
        span=50,
        adjust=False
    ).mean()

    # RSI
    data["rsi14"] = calculate_rsi(close, 14)

    # MACD
    ema12 = close.ewm(
        span=12,
        adjust=False
    ).mean()

    ema26 = close.ewm(
        span=26,
        adjust=False
    ).mean()

    data["macd"] = ema12 - ema26

    data["macd_signal"] = data["macd"].ewm(
        span=9,
        adjust=False
    ).mean()

    data["macd_histogram"] = (
        data["macd"] - data["macd_signal"]
    )

    # Returns
    data["daily_return"] = close.pct_change()

    data["return_5d"] = close.pct_change(5)
    data["return_10d"] = close.pct_change(10)

    # Volatility
    data["volatility_10d"] = (
        data["daily_return"].rolling(10).std()
    )

    # Volume ratio
    average_volume = data["volume"].rolling(20).mean()

    data["volume_ratio"] = (
        data["volume"] / average_volume.replace(0, np.nan)
    )

    # Daily price range relative to closing price
    data["price_range"] = (
        data["high"] - data["low"]
    ) / data["close"]

    # Next trading session's closing price.
    data["target"] = data["close"].shift(-1)

    return data
