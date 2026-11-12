import os
import json
import joblib
import numpy as np
import yfinance as yf
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.metrics import mean_absolute_error, mean_squared_error
from services.lstm_data import prepare_lstm_data
from services.lstm_model import train_lstm_model

SYMBOL = os.getenv("TRAIN_SYMBOL", "TCS.NS")
MODEL_NAME = os.getenv("MODEL_NAME", "TCS_lstm_v2")
SEQUENCE_LENGTH = 60
TRAIN_RATIO = 0.80
EPOCHS = 80

MODEL_DIR, DATA_DIR = "models", "data"
MODEL_PATH = os.path.join(MODEL_DIR, f"{MODEL_NAME}.keras")
SCALER_PATH = os.path.join(MODEL_DIR, f"{MODEL_NAME}_scaler.pkl")
METRICS_PATH = os.path.join(DATA_DIR, f"{MODEL_NAME}_metrics.json")


def main():
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)

    print(f"Downloading {SYMBOL} historical daily data...")
    df = yf.download(
        SYMBOL, period="max", interval="1d", auto_adjust=True,
        progress=False, multi_level_index=False,
    )
    if df is None or df.empty:
        raise RuntimeError(f"No historical data returned for {SYMBOL}.")
    if hasattr(df.columns, "nlevels") and df.columns.nlevels > 1:
        df.columns = df.columns.get_level_values(0)
    print("Downloaded rows:", len(df))

    print("Preparing features and sequences...")
    ds = prepare_lstm_data(df, SEQUENCE_LENGTH, TRAIN_RATIO)
    X_train, X_test = ds["X_train"], ds["X_test"]
    y_train, y_test = ds["y_train"], ds["y_test"]
    print("Train:", X_train.shape, "Test:", X_test.shape)

    print("Training LSTM...")
    model, history = train_lstm_model(
        X_train, y_train, MODEL_PATH, epochs=EPOCHS
    )

    print("Evaluating holdout test data...")
    predictions = model.predict(X_test, verbose=0).reshape(-1)
    mae = float(mean_absolute_error(y_test, predictions))
    rmse = float(np.sqrt(mean_squared_error(y_test, predictions)))
    directional_accuracy = float(
        np.mean(np.sign(y_test) == np.sign(predictions)) * 100
    )

    zero = np.zeros_like(y_test)
    baseline_mae = float(mean_absolute_error(y_test, zero))
    baseline_rmse = float(np.sqrt(mean_squared_error(y_test, zero)))

    joblib.dump(ds["scaler"], SCALER_PATH)

    metrics = {
        "symbol": SYMBOL,
        "model": "LSTM",
        "model_name": MODEL_NAME,
        "target": "next_trading_day_return",
        "target_unit": "decimal_return",
        "sequence_length": SEQUENCE_LENGTH,
        "features": ds["features"],
        "total_samples": int(ds["total_samples"]),
        "training_samples": int(len(X_train)),
        "testing_samples": int(len(X_test)),
        "epochs_completed": int(len(history.history["loss"])),
        "mae": mae,
        "rmse": rmse,
        "directional_accuracy_percent": directional_accuracy,
        "zero_return_baseline_mae": baseline_mae,
        "zero_return_baseline_rmse": baseline_rmse,
        "beats_zero_return_baseline_by_mae": bool(mae < baseline_mae),
        "last_data_date": ds["last_date"],
    }
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=4)

    # Save plots without opening interactive windows.
    plt.figure(figsize=(9, 4))
    plt.plot(history.history["loss"], label="Training loss")
    plt.plot(history.history["val_loss"], label="Validation loss")
    plt.title("LSTM Training / Validation Loss")
    plt.xlabel("Epoch")
    plt.ylabel("MSE")
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(DATA_DIR, f"{MODEL_NAME}_loss.png"))
    plt.close()

    plt.figure(figsize=(12, 4))
    plt.plot(y_test * 100, label="Actual return", linewidth=1)
    plt.plot(predictions * 100, label="Predicted return", linewidth=1)
    plt.axhline(0, linestyle="--", linewidth=1)
    plt.title("Actual vs Predicted Next-Day Returns")
    plt.xlabel("Test sample")
    plt.ylabel("Return (%)")
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(DATA_DIR, f"{MODEL_NAME}_predictions.png"))
    plt.close()

    print("\n========== LSTM RESULTS ==========")
    print(f"MAE: {mae:.6f}")
    print(f"RMSE: {rmse:.6f}")
    print(f"Directional accuracy: {directional_accuracy:.2f}%")
    print("\nZero-return baseline:")
    print(f"MAE: {baseline_mae:.6f}")
    print(f"RMSE: {baseline_rmse:.6f}")
    print("Beats baseline:", metrics["beats_zero_return_baseline_by_mae"])
    print("\nSaved model:", MODEL_PATH)
    print("Saved scaler:", SCALER_PATH)
    print("Saved metrics:", METRICS_PATH)


if __name__ == "__main__":
    main()
