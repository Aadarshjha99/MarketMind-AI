
import numpy as np
import pandas as pd


FEATURE_COLUMNS = [
    "open_close_return",
    "high_low_range",
    "close_location",

    "price_to_sma20",
    "price_to_sma50",
    "ema20_to_ema50",

    "rsi14",
    "macd_pct",
    "macd_signal_pct",
    "macd_histogram_pct",

    "daily_return",
    "return_2d",
    "return_5d",
    "return_10d",

    "lag_return_1",
    "lag_return_2",
    "lag_return_3",
    "lag_return_5",

    "volatility_10d",
    "volatility_20d",

    "volume_ratio",
    "volume_change",
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
    Generate relative market features for Random Forest v2.

    Each row uses only information available at that
    trading session's close.

    Target:
        Next trading session's percentage return.
    """


    data = df.copy()

    # Ensure chronological order
    data = data.sort_index()

    # Remove duplicate dates
    data = data[~data.index.duplicated(keep="last")]

    # Ensure OHLCV values are numeric
    required_columns = [
        "open", "high", "low", "close", "volume"
    ]

    data[required_columns] = data[required_columns].apply(
        pd.to_numeric,
        errors="coerce"
    )

    # Remove missing and infinite values in raw OHLCV
    data = data.replace([np.inf, -np.inf], np.nan)
    data = data.dropna(subset=required_columns)

    # Remove invalid prices
    data = data[
        (data["open"] > 0) &
        (data["high"] > 0) &
        (data["low"] > 0) &
        (data["close"] > 0)
    ]

    # Remove zero or negative volume records
    data = data[data["volume"] > 0]

    # Validate candle consistency
    data = data[
        (data["high"] >= data[["open", "close", "low"]].max(axis=1)) &
        (data["low"] <= data[["open", "close", "high"]].min(axis=1))
    ]

    print("Records after cleaning:", len(data))
    print("Zero-volume records:", (data["volume"] <= 0).sum())

    # Extract cleaned columns
    close = data["close"]
    open_price = data["open"]
    high = data["high"]
    low = data["low"]
    volume = data["volume"]


    # ---------------------------------
    # Moving averages
    # ---------------------------------

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

    # ---------------------------------
    # Relative price features
    # ---------------------------------

    data["price_to_sma20"] = (
        close / data["sma20"]
    ) - 1

    data["price_to_sma50"] = (
        close / data["sma50"]
    ) - 1

    data["ema20_to_ema50"] = (
        data["ema20"] / data["ema50"]
    ) - 1

    # ---------------------------------
    # Candle features
    # ---------------------------------

    data["open_close_return"] = (
        close / open_price
    ) - 1

    data["high_low_range"] = (
        high - low
    ) / close

    candle_range = (high - low).replace(0, np.nan)

    data["close_location"] = (
        (close - low) / candle_range
    )

    # ---------------------------------
    # RSI
    # ---------------------------------

    data["rsi14"] = calculate_rsi(
        close,
        period=14
    )

    # ---------------------------------
    # MACD
    # ---------------------------------

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

    # Normalize MACD values by current closing price.
    data["macd_pct"] = data["macd"] / close
    data["macd_signal_pct"] = data["macd_signal"] / close

    data["macd_histogram_pct"] = (
        data["macd_histogram"] / close
    )

    # ---------------------------------
    # Returns
    # ---------------------------------

    data["daily_return"] = close.pct_change()

    data["return_2d"] = close.pct_change(2)
    data["return_5d"] = close.pct_change(5)
    data["return_10d"] = close.pct_change(10)

    # ---------------------------------
    # Lagged returns
    # ---------------------------------

    data["lag_return_1"] = data["daily_return"].shift(1)
    data["lag_return_2"] = data["daily_return"].shift(2)
    data["lag_return_3"] = data["daily_return"].shift(3)
    data["lag_return_5"] = data["daily_return"].shift(5)

    # ---------------------------------
    # Volatility
    # ---------------------------------

    data["volatility_10d"] = (
        data["daily_return"].rolling(10).std()
    )

    data["volatility_20d"] = (
        data["daily_return"].rolling(20).std()
    )

    # ---------------------------------
    # Volume features
    # ---------------------------------

    average_volume = volume.rolling(20).mean()

    data["volume_ratio"] = (
        volume / average_volume.replace(0, np.nan)
    )

    data["volume_change"] = volume.pct_change()

    # ---------------------------------
    # Prediction target
    # ---------------------------------

    # Predict the next session's percentage return.
    data["target_return"] = (
        close.shift(-1) / close
    ) - 1

    return data
