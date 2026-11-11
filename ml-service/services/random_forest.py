
import os
import re
import joblib
import numpy as np

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

from services.feature_engineering import (
    FEATURE_COLUMNS,
    create_features,
)


MODEL_DIR = "models"


def train_and_predict(df, symbol):
    """
    Train and evaluate a Random Forest model using
    chronological validation, then predict the next close.
    """

    feature_data = create_features(df)

    # Rows used for supervised training.
    training_data = feature_data.dropna(
        subset=FEATURE_COLUMNS + ["target"]
    ).copy()

    # Latest row is used for the next-session prediction.
    latest_data = feature_data.dropna(
        subset=FEATURE_COLUMNS
    ).copy()

    if len(training_data) < 80:
        raise ValueError(
            "Not enough usable observations to train the model."
        )

    if latest_data.empty:
        raise ValueError(
            "Unable to prepare the latest prediction row."
        )

    X = training_data[FEATURE_COLUMNS]
    y = training_data["target"]

    # Chronological 80/20 split.
    split_index = int(len(training_data) * 0.8)

    if split_index < 40 or len(training_data) - split_index < 10:
        raise ValueError(
            "Not enough data for a reliable chronological evaluation."
        )

    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]

    y_train = y.iloc[:split_index]
    y_test = y.iloc[split_index:]

    evaluation_model = RandomForestRegressor(
        n_estimators=300,
        max_depth=8,
        min_samples_split=5,
        min_samples_leaf=3,
        max_features=0.8,
        random_state=42,
        n_jobs=-1
    )

    evaluation_model.fit(X_train, y_train)

    predictions = evaluation_model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)

    rmse = np.sqrt(
        mean_squared_error(y_test, predictions)
    )

    # Persistence baseline: tomorrow's close = today's close.
    baseline_predictions = X_test["close"].to_numpy()

    baseline_mae = mean_absolute_error(
        y_test,
        baseline_predictions
    )

    baseline_rmse = np.sqrt(
        mean_squared_error(
            y_test,
            baseline_predictions
        )
    )

    # Compare predicted and actual price directions.
    previous_closes = X_test["close"].to_numpy()

    actual_direction = np.sign(
        y_test.to_numpy() - previous_closes
    )

    predicted_direction = np.sign(
        predictions - previous_closes
    )

    directional_accuracy = np.mean(
        actual_direction == predicted_direction
    ) * 100

    # Retrain using all labelled observations.
    final_model = RandomForestRegressor(
        n_estimators=300,
        max_depth=8,
        min_samples_split=5,
        min_samples_leaf=3,
        max_features=0.8,
        random_state=42,
        n_jobs=-1
    )

    final_model.fit(X, y)

    latest_features = latest_data.iloc[[-1]][FEATURE_COLUMNS]

    predicted_price = float(
        final_model.predict(latest_features)[0]
    )

    latest_close = float(
        latest_data.iloc[-1]["close"]
    )

    predicted_change = predicted_price - latest_close

    predicted_change_percent = (
        predicted_change / latest_close
    ) * 100

    # Save the final model for later reuse.
    os.makedirs(MODEL_DIR, exist_ok=True)

    safe_symbol = re.sub(
        r"[^A-Za-z0-9_.-]",
        "_",
        symbol.upper()
    )

    model_path = os.path.join(
        MODEL_DIR,
        f"{safe_symbol}_random_forest.joblib"
    )

    joblib.dump(
        {
            "model": final_model,
            "features": FEATURE_COLUMNS,
            "symbol": symbol.upper()
        },
        model_path
    )

    # Top feature importance values.
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
            "predicted_next_close": round(predicted_price, 2),
            "predicted_change": round(predicted_change, 2),
            "predicted_change_percent": round(
                predicted_change_percent,
                2
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
            "mae": round(float(mae), 4),
            "rmse": round(float(rmse), 4),
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
            "test_samples": int(len(X_test)),
            "training_samples": int(len(X_train)),
            "model_beats_baseline": bool(
                mae < baseline_mae
            )
        },

        "feature_importance": feature_importance[:10],

        "model": {
            "name": "Random Forest Regressor",
            "target": "Next trading session close",
            "saved": True
        },

        "disclaimer": (
            "This is an experimental machine-learning forecast, "
            "not financial advice or a guaranteed future price."
        )
    }
