
import numpy as np
import pandas as pd
import yfinance as yf

from sklearn.preprocessing import MinMaxScaler

from services.lstm_data import (
    create_features,
    FEATURE_COLUMNS
)


# ==========================================
# CONFIGURATION
# ==========================================

STOCK_SYMBOLS = {
    "TCS": "TCS.NS",
    "INFY": "INFY.NS",
    "RELIANCE": "RELIANCE.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "ICICIBANK": "ICICIBANK.NS"
}

SEQUENCE_LENGTH = 60
TRAIN_RATIO = 0.80

STOCK_ID_COLUMNS = [
    f"stock_{symbol.lower()}"
    for symbol in STOCK_SYMBOLS
]

INPUT_FEATURE_COLUMNS = (
    FEATURE_COLUMNS + STOCK_ID_COLUMNS
)


# ==========================================
# DOWNLOAD HISTORICAL DATA
# ==========================================

def download_stock_data(symbol, period="max"):
    """
    Download daily historical OHLCV data
    from Yahoo Finance.
    """

    print(f"\nDownloading {symbol}...")

    df = yf.download(
        symbol,
        period=period,
        interval="1d",
        auto_adjust=True,
        progress=False,
        multi_level_index=False
    )

    if df is None or df.empty:
        raise ValueError(
            f"No historical data returned for {symbol}"
        )

    # Handle possible MultiIndex columns.
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    required_columns = [
        "Open",
        "High",
        "Low",
        "Close",
        "Volume"
    ]

    missing = [
        col for col in required_columns
        if col not in df.columns
    ]

    if missing:
        raise ValueError(
            f"{symbol}: Missing columns {missing}"
        )

    df = df[required_columns].copy()

    # Normalize timestamps.
    df.index = pd.to_datetime(df.index)

    if df.index.tz is not None:
        df.index = df.index.tz_localize(None)

    df.index = df.index.normalize()

    df = df.sort_index()

    print(
        f"{symbol}: Downloaded {len(df)} historical rows."
    )

    return df


# ==========================================
# PREPARE ONE STOCK
# ==========================================

def prepare_one_stock(symbol, yahoo_symbol):
    """
    Generate features and next-session targets
    independently for one stock.
    """

    raw_data = download_stock_data(yahoo_symbol)

    # Reuse existing feature engineering.
    data = create_features(raw_data)

    # Calculate next session's close within
    # the same continuous historical segment.
    next_close = data.groupby(
        "segment_id"
    )["Close"].shift(-1)

    next_date = pd.Series(
        data.index,
        index=data.index
    ).groupby(
        data["segment_id"]
    ).shift(-1)

    data["target_return"] = (
        next_close / data["Close"] - 1
    )

    data["target_date"] = next_date

    # Remove invalid values.
    data = data.replace(
        [np.inf, -np.inf],
        np.nan
    )

    data = data.dropna(
        subset=FEATURE_COLUMNS + [
            "target_return",
            "target_date"
        ]
    )

    if len(data) <= SEQUENCE_LENGTH:
        raise ValueError(
            f"{symbol}: Insufficient valid data "
            "for sequence generation."
        )

    if not np.isfinite(
        data[FEATURE_COLUMNS].to_numpy()
    ).all():
        raise ValueError(
            f"{symbol}: Invalid feature values found."
        )

    if not np.isfinite(
        data["target_return"].to_numpy()
    ).all():
        raise ValueError(
            f"{symbol}: Invalid target values found."
        )

    print(
        f"{symbol}: {len(data)} valid feature rows."
    )

    return data


# ==========================================
# GENERATE SEQUENCES FOR ONE STOCK
# ==========================================

def generate_stock_sequences(
    data,
    scaled_features,
    symbol,
    stock_to_index,
    split_date,
    sequence_length
):
    """
    Generate training and testing sequences
    independently for one stock.

    Sequences cannot cross historical segments
    or stock boundaries.
    """

    X_train, y_train = [], []
    X_test, y_test = [], []

    train_dates, test_dates = [], []

    train_symbols, test_symbols = [], []

    segment_ids = data[
        "segment_id"
    ].to_numpy()

    targets = data[
        "target_return"
    ].to_numpy(dtype=np.float32)

    target_dates = pd.to_datetime(
        data["target_date"]
    ).to_numpy()

    # Create one-hot stock identity.
    stock_id = np.zeros(
        len(STOCK_SYMBOLS),
        dtype=np.float32
    )

    stock_id[
        stock_to_index[symbol]
    ] = 1.0

    for end_index in range(
        sequence_length - 1,
        len(data)
    ):

        start_index = (
            end_index - sequence_length + 1
        )

        # Ensure sequence belongs to one
        # continuous historical segment.
        sequence_segments = segment_ids[
            start_index:end_index + 1
        ]

        if not np.all(
            sequence_segments == sequence_segments[0]
        ):
            continue

        # Get scaled market features.
        sequence = scaled_features[
            start_index:end_index + 1
        ]

        # Repeat stock identity at every timestep.
        stock_identity = np.tile(
            stock_id,
            (sequence_length, 1)
        )

        # Combine market features and stock identity.
        sequence = np.concatenate(
            [sequence, stock_identity],
            axis=1
        )

        target = targets[end_index]

        target_date = pd.Timestamp(
            target_dates[end_index]
        )

        # Split based on the next session date.
        if target_date < split_date:

            X_train.append(sequence)
            y_train.append(target)

            train_dates.append(target_date)
            train_symbols.append(symbol)

        else:

            X_test.append(sequence)
            y_test.append(target)

            test_dates.append(target_date)
            test_symbols.append(symbol)

    return {
        "X_train": X_train,
        "y_train": y_train,

        "X_test": X_test,
        "y_test": y_test,

        "train_dates": train_dates,
        "test_dates": test_dates,

        "train_symbols": train_symbols,
        "test_symbols": test_symbols
    }


# ==========================================
# COMPLETE GENERALIZED DATA PREPARATION
# ==========================================

def prepare_generalized_lstm_data(
    sequence_length=SEQUENCE_LENGTH,
    train_ratio=TRAIN_RATIO
):
    """
    Prepare a combined multi-stock dataset
    for one generalized LSTM model.

    Returns:
        X_train, X_test
        y_train, y_test
        shared scaler
        feature metadata
        stock identity mapping
        train/test dates
        train/test stock symbols
        sample statistics
    """

    if sequence_length < 1:
        raise ValueError(
            "Sequence length must be positive."
        )

    if not 0 < train_ratio < 1:
        raise ValueError(
            "Train ratio must be between 0 and 1."
        )

    print("\n========================================")
    print("GENERALIZED LSTM DATA PREPARATION")
    print("========================================")

    # --------------------------------------
    # STEP 1: Prepare each stock separately
    # --------------------------------------

    stock_data = {}

    for symbol, yahoo_symbol in STOCK_SYMBOLS.items():

        stock_data[symbol] = prepare_one_stock(
            symbol,
            yahoo_symbol
        )

    # --------------------------------------
    # STEP 2: Establish common date split
    # --------------------------------------

    all_target_dates = pd.DatetimeIndex(
        sorted(
            set(
                date
                for data in stock_data.values()
                for date in pd.to_datetime(
                    data["target_date"]
                )
            )
        )
    )

    if len(all_target_dates) < 2:
        raise ValueError(
            "Insufficient historical dates."
        )

    split_index = int(
        len(all_target_dates) * train_ratio
    )

    split_index = min(
        max(split_index, 1),
        len(all_target_dates) - 1
    )

    split_date = pd.Timestamp(
        all_target_dates[split_index]
    )

    print("\n========== GLOBAL DATE SPLIT ==========")

    print(
        "Training targets before:",
        split_date.date()
    )

    print(
        "Testing targets from:",
        split_date.date()
    )

    # --------------------------------------
    # STEP 3: Fit shared scaler
    # --------------------------------------

    training_features = []

    for symbol, data in stock_data.items():

        training_rows = data.loc[
            data.index < split_date,
            FEATURE_COLUMNS
        ]

        if training_rows.empty:
            raise ValueError(
                f"{symbol}: No training features available."
            )

        training_features.append(
            training_rows
        )

    combined_training_features = pd.concat(
        training_features,
        ignore_index=True
    )

    scaler = MinMaxScaler()

    scaler.fit(
        combined_training_features
    )

    print(
        "\nShared scaler fitted successfully."
    )

    # --------------------------------------
    # STEP 4: Generate sequences per stock
    # --------------------------------------

    stock_to_index = {
        symbol: index
        for index, symbol in enumerate(STOCK_SYMBOLS)
    }

    all_X_train, all_y_train = [], []
    all_X_test, all_y_test = [], []

    all_train_dates, all_test_dates = [], []

    all_train_symbols, all_test_symbols = [], []

    stock_statistics = {}

    for symbol, data in stock_data.items():

        scaled_features = scaler.transform(
            data[FEATURE_COLUMNS]
        ).astype(np.float32)

        result = generate_stock_sequences(
            data=data,
            scaled_features=scaled_features,
            symbol=symbol,
            stock_to_index=stock_to_index,
            split_date=split_date,
            sequence_length=sequence_length
        )

        if not result["X_train"]:
            raise ValueError(
                f"{symbol}: No training sequences generated."
            )

        if not result["X_test"]:
            raise ValueError(
                f"{symbol}: No testing sequences generated."
            )

        all_X_train.extend(
            result["X_train"]
        )

        all_y_train.extend(
            result["y_train"]
        )

        all_X_test.extend(
            result["X_test"]
        )

        all_y_test.extend(
            result["y_test"]
        )

        all_train_dates.extend(
            result["train_dates"]
        )

        all_test_dates.extend(
            result["test_dates"]
        )

        all_train_symbols.extend(
            result["train_symbols"]
        )

        all_test_symbols.extend(
            result["test_symbols"]
        )

        stock_statistics[symbol] = {
            "feature_rows": len(data),
            "training_samples": len(result["X_train"]),
            "testing_samples": len(result["X_test"])
        }

        print(
            f"\n{symbol}: "
            f"Train={len(result['X_train'])}, "
            f"Test={len(result['X_test'])}"
        )

    # --------------------------------------
    # STEP 5: Convert into NumPy arrays
    # --------------------------------------

    X_train = np.asarray(
        all_X_train,
        dtype=np.float32
    )

    y_train = np.asarray(
        all_y_train,
        dtype=np.float32
    )

    X_test = np.asarray(
        all_X_test,
        dtype=np.float32
    )

    y_test = np.asarray(
        all_y_test,
        dtype=np.float32
    )

    # --------------------------------------
    # STEP 6: Final validation
    # --------------------------------------

    if not np.isfinite(X_train).all():
        raise ValueError(
            "Training sequences contain invalid values."
        )

    if not np.isfinite(X_test).all():
        raise ValueError(
            "Testing sequences contain invalid values."
        )

    if not np.isfinite(y_train).all():
        raise ValueError(
            "Training targets contain invalid values."
        )

    if not np.isfinite(y_test).all():
        raise ValueError(
            "Testing targets contain invalid values."
        )

    if len(X_train) == 0 or len(X_test) == 0:
        raise ValueError(
            "Training or testing dataset is empty."
        )

    # --------------------------------------
    # STEP 7: Diagnostics
    # --------------------------------------

    print("\n========================================")
    print("GENERALIZED DATASET SUMMARY")
    print("========================================")

    print(
        "Stocks:",
        list(STOCK_SYMBOLS.keys())
    )

    print(
        "Sequence length:",
        sequence_length
    )

    print(
        "Base feature count:",
        len(FEATURE_COLUMNS)
    )

    print(
        "Stock identity features:",
        len(STOCK_ID_COLUMNS)
    )

    print(
        "Total input features:",
        len(INPUT_FEATURE_COLUMNS)
    )

    print("X_train:", X_train.shape)
    print("X_test:", X_test.shape)

    print("y_train:", y_train.shape)
    print("y_test:", y_test.shape)

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

    print("\nPer-stock sample counts:")

    for symbol, stats in stock_statistics.items():
        print(symbol, stats)

    # --------------------------------------
    # STEP 8: RETURN COMPLETE DATASET
    # --------------------------------------

    return {
        "X_train": X_train,
        "X_test": X_test,

        "y_train": y_train,
        "y_test": y_test,

        "scaler": scaler,

        "sequence_length": sequence_length,

        "features": FEATURE_COLUMNS,
        "stock_id_columns": STOCK_ID_COLUMNS,
        "input_features": INPUT_FEATURE_COLUMNS,

        "stock_symbols": list(STOCK_SYMBOLS.keys()),
        "stock_to_index": stock_to_index,

        "split_date": str(
            split_date.date()
        ),

        "training_samples": len(X_train),
        "testing_samples": len(X_test),

        "total_samples": (
            len(X_train) + len(X_test)
        ),

        "stock_statistics": stock_statistics,

        "train_dates": all_train_dates,
        "test_dates": all_test_dates,

        "train_symbols": all_train_symbols,
        "test_symbols": all_test_symbols
    }
