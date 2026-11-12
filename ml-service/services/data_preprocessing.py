
import pandas as pd


REQUIRED_COLUMNS = [
    "datetime",
    "open",
    "high",
    "low",
    "close",
    "volume",
]


def prepare_historical_data(raw_data):
    """
    Validate and clean OHLCV candles received from Express.
    Returns candles in chronological order.
    """

    if not isinstance(raw_data, list) or not raw_data:
        raise ValueError("Historical data is empty or invalid.")

    df = pd.DataFrame(raw_data)

    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing historical data columns: {missing_columns}"
        )

    df = df[REQUIRED_COLUMNS].copy()

    # Convert timestamps and numeric columns.
    df["datetime"] = pd.to_datetime(
        df["datetime"],
        errors="coerce",
        utc=True
    )

    numeric_columns = [
        "open",
        "high",
        "low",
        "close",
        "volume",
    ]

    for column in numeric_columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )

    # Remove invalid rows.
    df = df.dropna(subset=REQUIRED_COLUMNS)

    # Remove impossible prices and negative volume.
    df = df[
        (df["open"] > 0)
        & (df["high"] > 0)
        & (df["low"] > 0)
        & (df["close"] > 0)
        & (df["volume"] >= 0)
        & (df["high"] >= df["low"])
    ]

    # Sort oldest to newest.
    df = df.sort_values("datetime")

    # Remove duplicate timestamps.
    df = df.drop_duplicates(
        subset=["datetime"],
        keep="last"
    )

    df = df.reset_index(drop=True)

    if len(df) < 70:
        raise ValueError(
            "At least 70 valid daily candles are required."
        )

    return df
