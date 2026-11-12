
from services.lstm_model import build_lstm_model

model = build_lstm_model(
    sequence_length=60,
    n_features=5
)

print("\n========== LSTM MODEL SUMMARY ==========")

model.summary()

print("\n========== MODEL CONFIGURATION ==========")

print("Input shape:", model.input_shape)
print("Output shape:", model.output_shape)
print("Total parameters:", model.count_params())
