
import os
import json
import joblib
import numpy as np

from pathlib import Path

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error
)

from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint
)

from services.generalized_lstm_data import (
    prepare_generalized_lstm_data
)

from services.lstm_model import build_lstm_model


# ==========================================
# CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

MODEL_PATH = MODEL_DIR / "generalized_lstm.keras"
SCALER_PATH = MODEL_DIR / "generalized_scaler.pkl"
METRICS_PATH = DATA_DIR / "generalized_lstm_metrics.json"

EPOCHS = 80
BATCH_SIZE = 32
VALIDATION_RATIO = 0.15


# ==========================================
# METRICS
# ==========================================

def calculate_metrics(actual, predicted):

    mae = float(
        mean_absolute_error(actual, predicted)
    )

    rmse = float(
        np.sqrt(
            mean_squared_error(actual, predicted)
        )
    )

    directional_accuracy = float(
        np.mean(
            np.sign(actual) == np.sign(predicted)
        ) * 100
    )

    baseline_predictions = np.zeros_like(actual)

    baseline_mae = float(
        mean_absolute_error(
            actual,
            baseline_predictions
        )
    )

    baseline_rmse = float(
        np.sqrt(
            mean_squared_error(
                actual,
                baseline_predictions
            )
        )
    )

    return {
        "mae": mae,
        "rmse": rmse,
        "directional_accuracy_percent": directional_accuracy,
        "zero_return_baseline_mae": baseline_mae,
        "zero_return_baseline_rmse": baseline_rmse,
        "beats_zero_return_baseline_by_mae": bool(
            mae < baseline_mae
        )
    }


# ==========================================
# TRAINING
# ==========================================

def main():

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    DATA_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    print("\nPreparing generalized dataset...")

    ds = prepare_generalized_lstm_data()

    X_train_all = ds["X_train"]
    y_train_all = ds["y_train"]

    X_test = ds["X_test"]
    y_test = ds["y_test"]

    train_dates = np.asarray(
        ds["train_dates"],
        dtype="datetime64[ns]"
    )

    # --------------------------------------
    # CHRONOLOGICAL VALIDATION SPLIT
    # --------------------------------------

    unique_dates = np.unique(train_dates)

    validation_index = int(
        len(unique_dates) * (1 - VALIDATION_RATIO)
    )

    validation_index = min(
        max(validation_index, 1),
        len(unique_dates) - 1
    )

    validation_start = unique_dates[
        validation_index
    ]

    train_mask = train_dates < validation_start
    validation_mask = train_dates >= validation_start

    X_train = X_train_all[train_mask]
    y_train = y_train_all[train_mask]

    X_validation = X_train_all[validation_mask]
    y_validation = y_train_all[validation_mask]

    print("\n========== DATA SPLIT ==========")

    print("Training samples:", len(X_train))
    print("Validation samples:", len(X_validation))
    print("Testing samples:", len(X_test))

    print("Validation begins:", str(validation_start))

    if len(X_train) == 0 or len(X_validation) == 0:
        raise ValueError(
            "Training or validation dataset is empty."
        )

    # --------------------------------------
    # BUILD MODEL
    # --------------------------------------

    print("\nBuilding generalized LSTM...")

    model = build_lstm_model(
        sequence_length=X_train.shape[1],
        n_features=X_train.shape[2]
    )

    print(model.summary())

    # --------------------------------------
    # CALLBACKS
    # --------------------------------------

    callbacks = [

        EarlyStopping(
            monitor="val_loss",
            patience=10,
            restore_best_weights=True
        ),

        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=5,
            min_lr=0.00001
        ),

        ModelCheckpoint(
            filepath=str(MODEL_PATH),
            monitor="val_loss",
            save_best_only=True
        )
    ]

    # --------------------------------------
    # TRAIN
    # --------------------------------------

    print("\n========== TRAINING ==========")

    history = model.fit(
        X_train,
        y_train,

        validation_data=(
            X_validation,
            y_validation
        ),

        epochs=EPOCHS,
        batch_size=BATCH_SIZE,

        # Sequences are independent samples.
        # Shuffling mixes stocks between batches.
        shuffle=True,

        callbacks=callbacks,
        verbose=1
    )

    # Save the best restored weights.
    model.save(MODEL_PATH)

    # --------------------------------------
    # EVALUATE ON UNSEEN TEST DATA
    # --------------------------------------

    print("\n========== TEST EVALUATION ==========")

    predictions = model.predict(
        X_test,
        verbose=0
    ).reshape(-1)

    overall_metrics = calculate_metrics(
        y_test,
        predictions
    )

    print("\nOverall test metrics:")

    for name, value in overall_metrics.items():
        print(f"{name}: {value}")

    # --------------------------------------
    # PER-STOCK EVALUATION
    # --------------------------------------

    test_symbols = np.asarray(
        ds["test_symbols"]
    )

    per_stock_metrics = {}

    print("\n========== PER-STOCK RESULTS ==========")

    for symbol in ds["stock_symbols"]:

        mask = test_symbols == symbol

        actual = y_test[mask]
        predicted = predictions[mask]

        if len(actual) == 0:
            continue

        metrics = calculate_metrics(
            actual,
            predicted
        )

        per_stock_metrics[symbol] = {
            "testing_samples": int(len(actual)),
            **metrics
        }

        print(f"\n{symbol}")

        for name, value in metrics.items():
            print(f"{name}: {value}")

    # --------------------------------------
    # SAVE SCALER
    # --------------------------------------

    joblib.dump(
        ds["scaler"],
        SCALER_PATH
    )

    # --------------------------------------
    # SAVE METRICS
    # --------------------------------------

    metrics = {
        "model": "Generalized LSTM",
        "model_name": "generalized_lstm",

        "stocks": ds["stock_symbols"],

        "sequence_length": ds["sequence_length"],

        "features": ds["input_features"],

        "stock_to_index": ds["stock_to_index"],

        "split_date": ds["split_date"],
        "validation_start_date": str(
            validation_start
        ),

        "training_samples": int(len(X_train)),
        "validation_samples": int(len(X_validation)),
        "testing_samples": int(len(X_test)),

        "epochs_completed": len(
            history.history["loss"]
        ),

        "overall_test_metrics": overall_metrics,

        "per_stock_test_metrics": per_stock_metrics,

        "model_path": str(MODEL_PATH),
        "scaler_path": str(SCALER_PATH)
    }

    with open(
        METRICS_PATH,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            metrics,
            file,
            indent=4
        )

    print("\n========================================")
    print("GENERALIZED LSTM TRAINING COMPLETED")
    print("========================================")

    print("Model:", MODEL_PATH)
    print("Scaler:", SCALER_PATH)
    print("Metrics:", METRICS_PATH)


if __name__ == "__main__":
    main()
