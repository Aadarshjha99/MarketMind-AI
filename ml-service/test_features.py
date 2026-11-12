
from services.data_preprocessing import prepare_historical_data
from services.feature_engineering import (
    create_features,
    FEATURE_COLUMNS
)

import requests


response = requests.get(
    "http://localhost:5000/api/v1/stocks/TCS/history",
    params={"interval": "1d"},
    timeout=30
)

response.raise_for_status()

payload = response.json()

df = prepare_historical_data(payload["data"])

features = create_features(df)

training_data = features.dropna(
    subset=FEATURE_COLUMNS + ["target_return"]
)

print("\nTotal candles:", len(df))

print("Available features:", len(FEATURE_COLUMNS))

print("Usable training rows:", len(training_data))

print("\nLatest features:")

print(features[FEATURE_COLUMNS].tail(1).T)

print("\nLatest target return:")

print(features["target_return"].iloc[-2])
