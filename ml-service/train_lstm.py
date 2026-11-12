
import os
import json
import joblib
import numpy as np
import yfinance as yf
import tensorflow as tf

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error
)

from services.lstm_data import prepare_lstm_data
from services.lstm_model import train_lstm_model


# Configuration
SYMBOL = "TCS.NS"
MODEL_NAME = "TCS_lstm_v1"

MODEL_DIR = "models"
DATA_DIR = "data"

MODEL_PATH = os.path.join(
    MODEL_DIR,
    f"{MODEL_NAME}.keras"
)

SCALER_PATH = os.path.join(
    MODEL_DIR,
    f"{MODEL_NAME}_scaler.pkl"
)

METRICS_PATH = os.path.join(
    DATA_DIR,
    f"{MODEL_NAME}_metrics.json"
)


os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)


# 1. Download historical data
print("\nDownloading historical stock data...")

df = yf.download(
    SYMBOL,
    period="max",
    interval="1d",
    auto_adjust=True,
    progress=False,
    multi_level_index=False
)

if df.empty:
    raise ValueError("No historical data received")


print("Total historical records:", len(df))


# 2. Prepare sequences
print("\nPreparing LSTM training sequences...")

dataset = prepare_lstm_data(
    df,
    sequence_length=60,
    train_ratio=0.80
)

X_train = dataset["X_train"]
X_test = dataset["X_test"]

y_train = dataset["y_train"]
y_test = dataset["y_test"]

print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))


# 3. Train the model
print("\nStarting LSTM training...")

model, history = train_lstm_model(
    X_train,
    y_train,
    MODEL_PATH
)


# 4. Evaluate on unseen test data
print("\nEvaluating model...")

predictions = model.predict(
    X_test,
    verbose=0
).flatten()


# ==========================================
# ACTUAL VS PREDICTED RETURNS VISUALIZATION
# ==========================================

import matplotlib.pyplot as plt
import numpy as np

# Convert decimal returns into percentages
actual_returns = y_test * 100
predicted_returns = predictions * 100

# Plot actual and predicted returns
plt.figure(figsize=(14, 6))

plt.plot(
    actual_returns,
    label="Actual Returns",
    alpha=0.7,
    linewidth=1
)

plt.plot(
    predicted_returns,
    label="LSTM Predicted Returns",
    alpha=0.8,
    linewidth=1
)

plt.axhline(
    y=0,
    linestyle="--",
    linewidth=1,
    label="Zero Return"
)

plt.title("TCS: Actual vs LSTM Predicted Daily Returns")
plt.xlabel("Test Sample")
plt.ylabel("Daily Return (%)")
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()

plt.savefig("data/TCS_lstm_v1_predictions.png")
plt.show()


# Actual vs Predicted Scatter Plot
plt.figure(figsize=(7, 7))

plt.scatter(
    actual_returns,
    predicted_returns,
    alpha=0.4
)

# Perfect prediction reference line
min_value = min(actual_returns.min(), predicted_returns.min())
max_value = max(actual_returns.max(), predicted_returns.max())

plt.plot(
    [min_value, max_value],
    [min_value, max_value],
    linestyle="--",
    label="Perfect Prediction"
)

plt.title("Actual vs Predicted Returns")
plt.xlabel("Actual Returns (%)")
plt.ylabel("Predicted Returns (%)")
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()

plt.savefig("data/TCS_lstm_v1_scatter.png")
plt.show()


mae = mean_absolute_error(
    y_test,
    predictions
)

rmse = np.sqrt(
    mean_squared_error(
        y_test,
        predictions
    )
)

directional_accuracy = np.mean(
    np.sign(y_test) == np.sign(predictions)
) * 100


# Zero-return persistence baseline
baseline_predictions = np.zeros_like(y_test)

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

baseline_directional_accuracy = np.mean(
    y_test == 0
) * 100


# 5. Save scaler
joblib.dump(
    dataset["scaler"],
    SCALER_PATH
)


# 6. Save evaluation results
metrics = {
    "symbol": SYMBOL,
    "model": "LSTM",
    "version": "v1",
    "total_records": dataset["total_samples"],
    "training_samples": len(X_train),
    "testing_samples": len(X_test),
    "sequence_length": 60,
    "features": dataset["features"],
    "epochs_completed": len(history.history["loss"]),
    "mae": float(mae),
    "rmse": float(rmse),
    "directional_accuracy": float(
        directional_accuracy
    ),
    "baseline_mae": float(baseline_mae),
    "baseline_rmse": float(baseline_rmse),
    "model_beats_baseline": bool(
        mae < baseline_mae
    )
}

with open(METRICS_PATH, "w") as file:
    json.dump(metrics, file, indent=4)


# 7. Display results
print("\n========== LSTM TRAINING RESULTS ==========")

print("Model:", MODEL_NAME)

print("Epochs completed:", metrics["epochs_completed"])

print("\nLSTM Performance:")
print("MAE:", round(mae, 6))
print("RMSE:", round(rmse, 6))
print(
    "Directional Accuracy:",
    round(directional_accuracy, 2),
    "%"
)

print("\nBaseline Performance:")
print("MAE:", round(baseline_mae, 6))
print("RMSE:", round(baseline_rmse, 6))

print(
    "\nBeats baseline:",
    metrics["model_beats_baseline"]
)

print("\nSaved model:", MODEL_PATH)
print("Saved scaler:", SCALER_PATH)
print("Saved metrics:", METRICS_PATH)

print("\nTraining completed successfully!")

import matplotlib.pyplot as plt

# Plot training and validation loss
plt.figure(figsize=(10, 5))
plt.plot(history.history["loss"], label="Training Loss")
plt.plot(history.history["val_loss"], label="Validation Loss")
plt.title("LSTM Training vs Validation Loss")
plt.xlabel("Epoch")
plt.ylabel("Mean Squared Error")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig("data/TCS_lstm_v1_loss.png")
plt.show()

# Plot training and validation MAE
plt.figure(figsize=(10, 5))
plt.plot(history.history["mae"], label="Training MAE")
plt.plot(history.history["val_mae"], label="Validation MAE")
plt.title("LSTM Training vs Validation MAE")
plt.xlabel("Epoch")
plt.ylabel("Mean Absolute Error")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig("data/TCS_lstm_v1_mae.png")
plt.show()


# ==========================================
# PREDICTION DISTRIBUTION DIAGNOSTICS
# ==========================================

print("\n========== PREDICTION DIAGNOSTICS ==========")

print("\nActual Returns:")
print("Mean:", np.mean(y_test))
print("Std:", np.std(y_test))
print("Min:", np.min(y_test))
print("Max:", np.max(y_test))

print("\nPredicted Returns:")
print("Mean:", np.mean(predictions))
print("Std:", np.std(predictions))
print("Min:", np.min(predictions))
print("Max:", np.max(predictions))

correlation = np.corrcoef(y_test, predictions)[0, 1]

print("\nActual vs Predicted Correlation:")
print(correlation)
