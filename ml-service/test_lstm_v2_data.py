
import yfinance as yf

from services.lstm_data import prepare_lstm_data


print("Downloading TCS historical data...")

df = yf.download(
    "TCS.NS",
    period="max",
    interval="1d",
    auto_adjust=True,
    progress=False,
    multi_level_index=False
)

print("\nPreparing LSTM v2 dataset...")

dataset = prepare_lstm_data(
    df,
    sequence_length=60,
    train_ratio=0.80
)

print("\n========== LSTM V2 DATASET ==========")

print("Total samples:", dataset["total_samples"])
print("Training samples:", dataset["train_samples"])
print("Testing samples:", dataset["test_samples"])

print("Sequence length:", dataset["sequence_length"])

print("\nFeatures:", len(dataset["features"]))

for feature in dataset["features"]:
    print("-", feature)

print("\nX_train shape:", dataset["X_train"].shape)
print("X_test shape:", dataset["X_test"].shape)

print("\ny_train shape:", dataset["y_train"].shape)
print("y_test shape:", dataset["y_test"].shape)

print("\nMissing values in X_train:",
      dataset["X_train"].isnan().sum()
      if False else
      __import__("numpy").isnan(dataset["X_train"]).sum()
)

print("\nMissing values in X_test:",
      __import__("numpy").isnan(dataset["X_test"]).sum()
)

print("\nData preparation completed!")
