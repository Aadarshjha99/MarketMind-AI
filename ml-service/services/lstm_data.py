
import numpy as np
import pandas as pd

from sklearn.preprocessing import MinMaxScaler


# ==========================================
# FEATURE CONFIGURATION
# ==========================================

FEATURE_COLUMNS = [
    "daily_return",
    "log_return",
    "open_close_return",
    "open_gap",
    "high_low_range",
    "close_location",

    "price_to_sma20",
    "price_to_sma50",
    "ema20_to_ema50",

    "rsi14",
    "macd_pct",
    "macd_signal_pct",
    "macd_histogram_pct",

    "return_2d",
    "return_5d",
    "return_10d",

    "volatility_10d",
    "volatility_20d",

    "volume_ratio",
    "volume_change"
]


REQUIRED_COLUMNS = [
    "Open",
    "High",
    "Low",
    "Close",
    "Volume"
]


# ==========================================
# DATA CLEANING AND SEGMENTATION
# ==========================================

def clean_market_data(df):

    data = df.copy()

    missing = [
        col for col in REQUIRED_COLUMNS
        if col not in data.columns
    ]

    if missing:
        raise ValueError(f"Missing columns: {missing}")

    data = data[REQUIRED_COLUMNS].copy()

    # Ensure datetime index
    data.index = pd.to_datetime(data.index)

    # Convert OHLCV values to numeric
    data = data.apply(
        pd.to_numeric,
        errors="coerce"
    )

    # Replace infinite values
    data = data.replace(
        [np.inf, -np.inf],
        np.nan
    )

    # Sort chronologically
    data = data.sort_index()

    # Remove duplicate dates
    data = data[
        ~data.index.duplicated(keep="last")
    ]

    # Remove missing OHLCV values
    data = data.dropna(
        subset=REQUIRED_COLUMNS
    )

    # Remove invalid or non-positive prices
    data = data[
        (data["Open"] > 0) &
        (data["High"] > 0) &
        (data["Low"] > 0) &
        (data["Close"] > 0)
    ]

    # Remove zero or negative volume records
    data = data[
        data["Volume"] > 0
    ]

    # Validate OHLC candle consistency
    data = data[
        (data["High"] >= data[
            ["Open", "Close", "Low"]
        ].max(axis=1)) &
        (data["Low"] <= data[
            ["Open", "Close", "High"]
        ].min(axis=1))
    ]

    # ======================================
    # DETECT HISTORICAL DATE GAPS
    # ======================================

    date_gaps = (
        data.index.to_series().diff().dt.days
    )

    large_gaps = date_gaps[
        date_gaps > 7
    ]

    print("\n========== HISTORICAL DATE GAPS ==========")

    print(
        "Number of gaps greater than 7 days:",
        len(large_gaps)
    )

    for date, gap in large_gaps.items():

        position = data.index.get_loc(date)

        previous_date = data.index[position - 1]

        print(
            f"{previous_date.date()} -> {date.date()} "
            f"| Gap: {gap} calendar days"
        )

    # Each continuous historical period
    # receives its own segment ID.
    data["segment_id"] = (
        date_gaps > 7
    ).cumsum().astype(int)

    print("\n========== DATA CLEANING ==========")

    print("Records after cleaning:", len(data))

    print(
        "Missing OHLCV values:",
        data[REQUIRED_COLUMNS].isna().sum().sum()
    )

    print(
        "Number of historical segments:",
        data["segment_id"].nunique()
    )

    return data


# ==========================================
# FEATURE ENGINEERING FOR ONE SEGMENT
# ==========================================

def _engineer_segment(segment):

    data = segment.copy()

    # ======================================
    # PRICE RETURNS
    # ======================================

    data["daily_return"] = (
        data["Close"].pct_change()
    )

    data["log_return"] = np.log(
        data["Close"] /
        data["Close"].shift(1)
    )

    data["open_close_return"] = (
        data["Close"] / data["Open"] - 1
    )

    data["open_gap"] = (
        data["Open"] /
        data["Close"].shift(1) - 1
    )

    # ======================================
    # DAILY PRICE RANGE
    # ======================================

    data["high_low_range"] = (
        (data["High"] - data["Low"]) /
        data["Close"]
    )

    daily_range = (
        data["High"] - data["Low"]
    )

    data["close_location"] = (
        (data["Close"] - data["Low"]) /
        daily_range.replace(0, np.nan)
    )

    # ======================================
    # MOVING AVERAGES
    # ======================================

    sma20 = (
        data["Close"].rolling(20).mean()
    )

    sma50 = (
        data["Close"].rolling(50).mean()
    )

    ema20 = data["Close"].ewm(
        span=20,
        adjust=False
    ).mean()

    ema50 = data["Close"].ewm(
        span=50,
        adjust=False
    ).mean()

    data["price_to_sma20"] = (
        data["Close"] / sma20 - 1
    )

    data["price_to_sma50"] = (
        data["Close"] / sma50 - 1
    )

    data["ema20_to_ema50"] = (
        ema20 / ema50 - 1
    )

    # ======================================
    # RSI (14)
    # ======================================

    delta = data["Close"].diff()

    gains = delta.clip(lower=0)

    losses = -delta.clip(upper=0)

    avg_gain = gains.ewm(
        alpha=1 / 14,
        adjust=False,
        min_periods=14
    ).mean()

    avg_loss = losses.ewm(
        alpha=1 / 14,
        adjust=False,
        min_periods=14
    ).mean()

    rs = (
        avg_gain /
        avg_loss.replace(0, np.nan)
    )

    data["rsi14"] = (
        100 - (100 / (1 + rs))
    ) / 100

    # ======================================
    # MACD
    # ======================================

    ema12 = data["Close"].ewm(
        span=12,
        adjust=False
    ).mean()

    ema26 = data["Close"].ewm(
        span=26,
        adjust=False
    ).mean()

    macd = ema12 - ema26

    macd_signal = macd.ewm(
        span=9,
        adjust=False
    ).mean()

    data["macd_pct"] = (
        macd / data["Close"]
    )

    data["macd_signal_pct"] = (
        macd_signal / data["Close"]
    )

    data["macd_histogram_pct"] = (
        (macd - macd_signal) /
        data["Close"]
    )

    # ======================================
    # MOMENTUM
    # ======================================

    data["return_2d"] = (
        data["Close"].pct_change(2)
    )

    data["return_5d"] = (
        data["Close"].pct_change(5)
    )

    data["return_10d"] = (
        data["Close"].pct_change(10)
    )

    # ======================================
    # VOLATILITY
    # ======================================

    data["volatility_10d"] = (
        data["daily_return"].rolling(10).std()
    )

    data["volatility_20d"] = (
        data["daily_return"].rolling(20).std()
    )

    # ======================================
    # VOLUME INDICATORS
    # ======================================

    volume_average = (
        data["Volume"].rolling(20).mean()
    )

    data["volume_ratio"] = (
        data["Volume"] / volume_average
    )

    data["volume_change"] = (
        data["Volume"].pct_change()
    )

    return data


# ==========================================
# COMPLETE FEATURE ENGINEERING
# ==========================================

def create_features(df):

    data = clean_market_data(df)

    # IMPORTANT:
    # Calculate indicators separately for every
    # continuous historical segment.
    #
    # This prevents indicators from using prices
    # belonging to a previous segment.

    feature_frames = []

    for segment_id, segment in data.groupby(
        "segment_id",
        sort=False
    ):

        segment = _engineer_segment(
            segment.copy()
        )

        feature_frames.append(segment)

    if not feature_frames:
        raise ValueError(
            "No valid historical segments found."
        )

    data = pd.concat(
        feature_frames
    ).sort_index()

    return data


# ==========================================
# LSTM DATA PREPARATION
# ==========================================

def prepare_lstm_data(
    df,
    sequence_length=60,
    train_ratio=0.80
):

    if sequence_length < 1:
        raise ValueError(
            "sequence_length must be at least 1"
        )

    if not 0 < train_ratio < 1:
        raise ValueError(
            "train_ratio must be between 0 and 1"
        )

    # ======================================
    # FEATURE ENGINEERING
    # ======================================

    data = create_features(df)

    # ======================================
    # DATE GAP INFORMATION
    # ======================================

    date_gaps = (
        data.index.to_series().diff().dt.days
    )

    large_gaps = date_gaps[
        date_gaps > 7
    ]

    print("\n========== CLEANED DATA DATE GAPS ==========")

    print("Total records:", len(data))

    print(
        "Gaps greater than 7 days:",
        len(large_gaps)
    )

    for date, gap in large_gaps.items():

        position = data.index.get_loc(date)

        previous_date = data.index[position - 1]

        print(
            f"{previous_date.date()} -> {date.date()} "
            f"| Gap: {gap} calendar days"
        )

    # ======================================
    # NEXT-SESSION TARGET
    # ======================================

    # Calculate the next closing price within
    # the same historical segment only.

    next_close = data.groupby(
        "segment_id"
    )["Close"].shift(-1)

    data["target_return"] = (
        next_close / data["Close"] - 1
    )

    # Remove rows without a valid next-session target
    data = data.dropna(
        subset=["target_return"]
    )

    # ======================================
    # EXTREME RETURN INVESTIGATION
    # ======================================

    print("\n========== EXTREME RETURN INVESTIGATION ==========")

    extreme_returns = data[
        data["target_return"].abs() > 0.20
    ]

    print(
        "Extreme return count:",
        len(extreme_returns)
    )

    if not extreme_returns.empty:

        print(
            extreme_returns[
                [
                    "Open",
                    "High",
                    "Low",
                    "Close",
                    "Volume",
                    "target_return"
                ]
            ].to_string()
        )

    # ======================================
    # FINAL DATA CLEANING
    # ======================================

    data = data.replace(
        [np.inf, -np.inf],
        np.nan
    )

    data = data.dropna(
        subset=FEATURE_COLUMNS + ["target_return"]
    )

    if len(data) <= sequence_length:
        raise ValueError(
            "Insufficient historical data after feature cleaning."
        )

    # ======================================
    # VALIDATE FEATURE DATA
    # ======================================

    if not np.isfinite(
        data[FEATURE_COLUMNS].to_numpy()
    ).all():

        raise ValueError(
            "Feature data contains NaN or infinite values."
        )

    if not np.isfinite(
        data["target_return"].to_numpy()
    ).all():

        raise ValueError(
            "Target data contains NaN or infinite values."
        )

    # ======================================
    # CHRONOLOGICAL TRAIN / TEST SPLIT
    # ======================================

    split_index = int(
        len(data) * train_ratio
    )

    if split_index <= sequence_length:
        raise ValueError(
            "Insufficient training data for the selected sequence length."
        )

    if len(data) - split_index < 1:
        raise ValueError(
            "Insufficient testing data."
        )

    # ======================================
    # FEATURE SCALING
    # ======================================

    # Fit the scaler only on training-period data.
    # This prevents test data leakage.

    scaler = MinMaxScaler()

    scaler.fit(
        data[FEATURE_COLUMNS].iloc[:split_index]
    )

    scaled_features = scaler.transform(
        data[FEATURE_COLUMNS]
    )

    targets = data[
        "target_return"
    ].to_numpy(dtype=np.float32)

    segment_ids = data[
        "segment_id"
    ].to_numpy()

    # ======================================
    # SEQUENCE GENERATION
    # ======================================

    X_train, y_train = [], []

    X_test, y_test = [], []

    for end_index in range(
        sequence_length - 1,
        len(data)
    ):

        start_index = (
            end_index - sequence_length + 1
        )

        # ----------------------------------
        # Prevent sequences crossing gaps
        # ----------------------------------

        sequence_segment_ids = segment_ids[
            start_index:end_index + 1
        ]

        if not np.all(
            sequence_segment_ids == sequence_segment_ids[0]
        ):
            continue

        sequence = scaled_features[
            start_index:end_index + 1
        ]

        target = targets[end_index]

        # ----------------------------------
        # Training sequences
        # ----------------------------------

        # Exclude the final training row because
        # its next-session target belongs to
        # the testing period.

        if end_index < split_index - 1:

            X_train.append(sequence)

            y_train.append(target)

        # ----------------------------------
        # Testing sequences
        # ----------------------------------

        elif end_index >= split_index:

            X_test.append(sequence)

            y_test.append(target)

    # ======================================
    # VALIDATE GENERATED SEQUENCES
    # ======================================

    if len(X_train) == 0:

        raise ValueError(
            "No training sequences generated."
        )

    if len(X_test) == 0:

        raise ValueError(
            "No testing sequences generated."
        )

    # Convert to NumPy arrays

    X_train = np.array(
        X_train,
        dtype=np.float32
    )

    X_test = np.array(
        X_test,
        dtype=np.float32
    )

    y_train = np.array(
        y_train,
        dtype=np.float32
    )

    y_test = np.array(
        y_test,
        dtype=np.float32
    )

    # ======================================
    # FINAL DATASET DIAGNOSTICS
    # ======================================

    print("\n========== SEQUENCE GENERATION ==========")

    print("Total cleaned records:", len(data))

    print("Training samples:", len(X_train))

    print("Testing samples:", len(X_test))

    print("Sequence length:", sequence_length)

    print(
        "Number of segments:",
        data["segment_id"].nunique()
    )

    print("\n========== TARGET DISTRIBUTION ==========")

    print(
        "Training target mean:",
        np.mean(y_train)
    )

    print(
        "Training target std:",
        np.std(y_train)
    )

    print(
        "Testing target mean:",
        np.mean(y_test)
    )

    print(
        "Testing target std:",
        np.std(y_test)
    )

    print("\n========== FEATURE SHAPE ==========")

    print("X_train:", X_train.shape)

    print("X_test:", X_test.shape)

    print("y_train:", y_train.shape)

    print("y_test:", y_test.shape)

    # ======================================
    # RETURN DATA
    # ======================================

    return {
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "scaler": scaler,
        "split_index": split_index,
        "total_samples": len(data),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "sequence_length": sequence_length,
        "features": FEATURE_COLUMNS,
        "last_close": float(data["Close"].iloc[-1]),
        "last_date": str(data.index[-1])
    }
