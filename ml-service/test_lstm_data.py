
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

print("Preparing LSTM sequences...")

result = prepare_lstm_data(df)

print("\n========== LSTM DATASET SUMMARY ==========")

print("Total records:", result["total_samples"])

print("Training samples:", result["train_samples"])

print("Testing samples:", result["test_samples"])

print("Sequence length:", result["sequence_length"])

print("Features:", result["features"])

print("\n========== ARRAY SHAPES ==========")

print("X_train:", result["X_train"].shape)

print("y_train:", result["y_train"].shape)

print("X_test:", result["X_test"].shape)

print("y_test:", result["y_test"].shape)

print("\n========== SAMPLE TARGETS ==========")

print("First 5 training targets:")
print(result["y_train"][:5])

print("\nFirst 5 testing targets:")
print(result["y_test"][:5])
