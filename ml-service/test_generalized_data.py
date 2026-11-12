
from services.generalized_lstm_data import (
    prepare_generalized_lstm_data
)

print("Starting generalized LSTM dataset test...")

dataset = prepare_generalized_lstm_data()

print("\n========== TEST RESULTS ==========")

print("Training shape:", dataset["X_train"].shape)
print("Testing shape:", dataset["X_test"].shape)

print("Training labels:", dataset["y_train"].shape)
print("Testing labels:", dataset["y_test"].shape)

print("Stocks:", dataset["stock_symbols"])

print("Input features:", len(dataset["input_features"]))

print("Split date:", dataset["split_date"])

print("\nDataset preparation completed successfully!")
