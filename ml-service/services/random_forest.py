
import os
import re
import joblib
import numpy as np

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import TimeSeriesSplit

from services.feature_engineering import (
    FEATURE_COLUMNS,
    create_features,
)


MODEL_DIR = "models"

N_SPLITS = 5
TEST_SIZE = 20


def create_model():
    """Create a Random Forest model with conservative settings."""

    return RandomForestRegressor(
        n_estimators=300,
        max_depth=6,
        min_samples_split=8,
        min_samples_leaf=5,
        max_features=0.8,
        random_state=42,
        n_jobs=-1
    )


def train_and_predict(df, symbol):
    """
    Train and evaluate Random Forest v2.

    Target:
        Next trading session percentage return.

    Validation:
        Five expanding chronological test windows.
    """

    feature_data = create_features(df)

    # Keep only rows with complete features and known targets.
    training_data = feature_data.dropna(
        subset=FEATURE_COLUMNS + ["target_return"]
    ).copy()

    # Latest row has features but no known next-session target.
    latest_data = feature_data.dropna(
        subset=FEATURE_COLUMNS
    ).copy()

    if len(training_data) < 180:
        raise ValueError(
            f"Only {len(training_data)} usable training rows. "
            "At least 180 are required for five evaluation windows."
        )

    if latest_data.empty:
        raise ValueError(
            "Unable to prepare the latest prediction row."
        )

    X = training_data[FEATURE_COLUMNS]
    y = training_data["target_return"]

    # Convert predicted returns into next-session prices.
    current_prices = training_data["close"].to_numpy()
    actual_prices = (
        training_data["close"] *
        (1 + training_data["target_return"])
    ).to_numpy()

    splitter = TimeSeriesSplit(
        n_splits=N_SPLITS,
        test_size=TEST_SIZE
    )

    all_actual_returns = []
    all_predicted_returns = []
    all_actual_prices = []
    all_predicted_prices = []
    all_baseline_prices = []

    fold_results = []

    # ---------------------------------
    # Walk-forward validation
    # ---------------------------------

    for fold_number, (train_index, test_index) in enumerate(
        splitter.split(X),
        start=1
    ):
        X_train = X.iloc[train_index]
        X_test = X.iloc[test_index]

        y_train = y.iloc[train_index]
        y_test = y.iloc[test_index]

        model = create_model()

        model.fit(X_train, y_train)

        predicted_returns = model.predict(X_test)

        test_current_prices = (
            training_data["close"]
            .iloc[test_index]
            .to_numpy()
        )

        test_actual_prices = (
            training_data["close"].iloc[test_index].to_numpy()
            * (
                1 + training_data["target_return"]
                .iloc[test_index].to_numpy()
            )
        )

        predicted_prices = (
            test_current_prices * (1 + predicted_returns)
        )

        # Baseline predicts no price change.
        baseline_prices = test_current_prices

        fold_mae = mean_absolute_error(
            test_actual_prices,
            predicted_prices
        )

        fold_baseline_mae = mean_absolute_error(
            test_actual_prices,
            baseline_prices
        )

        fold_results.append({
            "fold": fold_number,
            "training_samples": int(len(train_index)),
            "test_samples": int(len(test_index)),
            "mae": round(float(fold_mae), 4),
            "baseline_mae": round(
                float(fold_baseline_mae),
                4
            )
        })

        all_actual_returns.extend(y_test.to_numpy())
        all_predicted_returns.extend(predicted_returns)

        all_actual_prices.extend(test_actual_prices)
        all_predicted_prices.extend(predicted_prices)
        all_baseline_prices.extend(baseline_prices)

    # ---------------------------------
    # Aggregate evaluation
    # ---------------------------------

    actual_returns = np.asarray(all_actual_returns)
    predicted_returns = np.asarray(all_predicted_returns)

    actual_prices = np.asarray(all_actual_prices)
    predicted_prices = np.asarray(all_predicted_prices)
    baseline_prices = np.asarray(all_baseline_prices)

    mae = mean_absolute_error(
        actual_prices,
        predicted_prices
    )

    rmse = np.sqrt(
        mean_squared_error(
            actual_prices,
            predicted_prices
        )
    )

    baseline_mae = mean_absolute_error(
        actual_prices,
        baseline_prices
    )

    baseline_rmse = np.sqrt(
        mean_squared_error(
            actual_prices,
            baseline_prices
        )
    )

    directional_accuracy = np.mean(
        np.sign(actual_returns) == np.sign(predicted_returns)
    ) * 100

    baseline_directional_accuracy = np.mean(
        np.sign(actual_returns) == 0
    ) * 100

    return_mae = mean_absolute_error(
        actual_returns,
        predicted_returns
    )

    # ---------------------------------
    # Train final model on all labelled rows
    # ---------------------------------

    final_model = create_model()

    final_model.fit(X, y)

    latest_features = latest_data.iloc[[-1]][FEATURE_COLUMNS]

    predicted_return = float(
        final_model.predict(latest_features)[0]
    )

    latest_close = float(
        latest_data.iloc[-1]["close"]
    )

    predicted_price = (
        latest_close * (1 + predicted_return)
    )

    predicted_change = predicted_price - latest_close

    predicted_change_percent = predicted_return * 100

    # ---------------------------------
    # Save final model
    # ---------------------------------

    os.makedirs(MODEL_DIR, exist_ok=True)

    safe_symbol = re.sub(
        r"[^A-Za-z0-9_.-]",
        "_",
        symbol.upper()
    )

    model_path = os.path.join(
        MODEL_DIR,
        f"{safe_symbol}_random_forest_v2.joblib"
    )

    joblib.dump(
        {
            "model": final_model,
            "features": FEATURE_COLUMNS,
            "symbol": symbol.upper(),
            "target": "next_session_return"
        },
        model_path
    )

    # ---------------------------------
    # Feature importance
    # ---------------------------------

    feature_importance = sorted(
        [
            {
                "feature": feature,
                "importance": float(importance)
            }
            for feature, importance in zip(
                FEATURE_COLUMNS,
                final_model.feature_importances_
            )
        ],
        key=lambda item: item["importance"],
        reverse=True
    )

    return {
        "symbol": symbol.upper(),

        "prediction": {
            "latest_close": round(latest_close, 2),
            "predicted_next_close": round(
                float(predicted_price),
                2
            ),
            "predicted_change": round(
                float(predicted_change),
                2
            ),
            "predicted_change_percent": round(
                float(predicted_change_percent),
                4
            ),
            "predicted_return": round(
                predicted_return,
                6
            ),
            "direction": (
                "Bullish"
                if predicted_change > 0
                else "Bearish"
                if predicted_change < 0
                else "Neutral"
            )
        },

        "evaluation": {
            "validation_method": "Walk-forward",
            "folds": N_SPLITS,
            "test_samples": int(len(actual_prices)),
            "training_samples": int(len(X)),
            "mae": round(float(mae), 4),
            "rmse": round(float(rmse), 4),
            "return_mae": round(float(return_mae), 6),
            "directional_accuracy": round(
                float(directional_accuracy),
                2
            ),
            "baseline_mae": round(
                float(baseline_mae),
                4
            ),
            "baseline_rmse": round(
                float(baseline_rmse),
                4
            ),
            "baseline_directional_accuracy": round(
                float(baseline_directional_accuracy),
                2
            ),
            "model_beats_baseline": bool(
                mae < baseline_mae
            )
        },

        "fold_results": fold_results,

        "feature_importance": feature_importance[:10],

        "model": {
            "name": "Random Forest Regressor",
            "version": "v2",
            "target": "Next trading session percentage return",
            "saved": True
        },

        "disclaimer": (
            "This is an experimental machine-learning forecast, "
            "not financial advice or a guaranteed future price."
        )
    }
