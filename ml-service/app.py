import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import requests
import tensorflow as tf

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from services.lstm_data import (
    create_features,
    FEATURE_COLUMNS
)

from services.sentiment_analyzer import analyze_articles



load_dotenv()

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:5173"]
        },
        r"/health": {
            "origins": ["http://localhost:5173"]
        }
    }
)

EXPRESS_API_URL = os.getenv(
    "EXPRESS_API_URL",
    "http://localhost:5000/api/v1"
)

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "models" / "TCS_lstm_v2.keras"
SCALER_PATH = BASE_DIR / "models" / "TCS_lstm_v2_scaler.pkl"

# Generalized LSTM model (separate from original TCS model)
GENERALIZED_MODEL_PATH = (
    BASE_DIR / "models" / "generalized_lstm.keras"
)

GENERALIZED_SCALER_PATH = (
    BASE_DIR / "models" / "generalized_scaler.pkl"
)

GENERALIZED_STOCKS = {
    "TCS": "TCS.NS",
    "INFY": "INFY.NS",
    "RELIANCE": "RELIANCE.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "ICICIBANK": "ICICIBANK.NS"
}

GENERALIZED_SEQUENCE_LENGTH = 60

# This order MUST match the training order.
GENERALIZED_STOCK_ORDER = list(GENERALIZED_STOCKS.keys())

_generalized_model = None
_generalized_scaler = None

SEQUENCE_LENGTH = 60

# Load the trained model and scaler only once.
_model = None
_scaler = None


def load_trained_model():
    global _model, _scaler

    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Trained model not found: {MODEL_PATH}"
            )

        if not SCALER_PATH.exists():
            raise FileNotFoundError(
                f"Scaler not found: {SCALER_PATH}"
            )

        _model = tf.keras.models.load_model(MODEL_PATH)
        _scaler = joblib.load(SCALER_PATH)

        app.logger.info("LSTM model and scaler loaded successfully.")

    return _model, _scaler

def load_generalized_model():
    global _generalized_model, _generalized_scaler

    if _generalized_model is None:
        if not GENERALIZED_MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Generalized model not found: {GENERALIZED_MODEL_PATH}"
            )

        if not GENERALIZED_SCALER_PATH.exists():
            raise FileNotFoundError(
                f"Generalized scaler not found: {GENERALIZED_SCALER_PATH}"
            )

        _generalized_model = tf.keras.models.load_model(
            GENERALIZED_MODEL_PATH
        )

        _generalized_scaler = joblib.load(
            GENERALIZED_SCALER_PATH
        )

        app.logger.info(
            "Generalized LSTM model and scaler loaded successfully."
        )

    return _generalized_model, _generalized_scaler


def prepare_live_dataframe(historical_data):
    if not isinstance(historical_data, list) or not historical_data:
        raise ValueError("Historical market data is empty or invalid.")

    df = pd.DataFrame(historical_data)

    # Support the lowercase fields returned by Express.
    column_mapping = {
        "open": "Open",
        "high": "High",
        "low": "Low",
        "close": "Close",
        "volume": "Volume"
    }

    df = df.rename(columns=column_mapping)

    if "datetime" not in df.columns:
        raise ValueError("Historical data does not contain datetime.")

    df["datetime"] = pd.to_datetime(
        df["datetime"],
        errors="coerce"
    )

    df = df.dropna(subset=["datetime"])
    df = df.set_index("datetime")

    return df


def predict_next_day(symbol, historical_data):
    model, scaler = load_trained_model()

    df = prepare_live_dataframe(historical_data)

    # Use exactly the same feature engineering as training.
    featured_df = create_features(df)

    featured_df = featured_df.replace(
        [np.inf, -np.inf],
        np.nan
    )

    featured_df = featured_df.dropna(
        subset=FEATURE_COLUMNS
    )

    if len(featured_df) < SEQUENCE_LENGTH:
        raise ValueError(
            "Not enough valid historical data for prediction."
        )

    # Select the most recent 60 rows.
    latest_rows = featured_df.tail(SEQUENCE_LENGTH)

    # Prevent sequences from crossing historical data gaps.
    if latest_rows["segment_id"].nunique() != 1:
        raise ValueError(
            "Latest historical sequence contains a date gap."
        )

    latest_features = latest_rows[
        FEATURE_COLUMNS
    ].to_numpy(dtype=np.float32)

    if not np.isfinite(latest_features).all():
        raise ValueError("Invalid values found in prediction features.")

    # Apply the scaler fitted during model training.
    scaled_features = scaler.transform(latest_features)

    X_input = np.expand_dims(
        scaled_features.astype(np.float32),
        axis=0
    )

    # Predict next-session percentage return.
    predicted_return = float(
        model.predict(X_input, verbose=0)[0][0]
    )

    current_price = float(latest_rows["Close"].iloc[-1])

    predicted_price = current_price * (1 + predicted_return)

    if predicted_return > 0:
        direction = "UP"
    elif predicted_return < 0:
        direction = "DOWN"
    else:
        direction = "NEUTRAL"

    return {
        "symbol": symbol,
        "current_price": round(current_price, 2),
        "predicted_price": round(predicted_price, 2),
        "predicted_return": round(predicted_return * 100, 4),
        "direction": direction,
        "prediction_horizon": "Next trading session",
        "model": "LSTM v2",
        "model_symbol": "TCS.NS",
        "last_data_date": str(latest_rows.index[-1].date()),
        "sequence_length": SEQUENCE_LENGTH,
        "feature_count": len(FEATURE_COLUMNS),
        "data_info": {
            "total_candles": int(len(df)),
            "valid_feature_rows": int(len(featured_df))
        },
        "disclaimer": (
            "Experimental machine learning estimate. "
            "Not financial advice or a guaranteed price."
        )
    }

def predict_generalized_next_day(symbol, historical_data):
    model, scaler = load_generalized_model()

    if symbol not in GENERALIZED_STOCKS:
        raise ValueError(
            f"Unsupported stock symbol: {symbol}"
        )

    df = prepare_live_dataframe(historical_data)

    # Generate the same market features used during training.
    featured_df = create_features(df)

    featured_df = featured_df.replace(
        [np.inf, -np.inf],
        np.nan
    )

    featured_df = featured_df.dropna(
        subset=FEATURE_COLUMNS
    )

    if len(featured_df) < GENERALIZED_SEQUENCE_LENGTH:
        raise ValueError(
            "Not enough historical data for generalized prediction."
        )

    latest_rows = featured_df.tail(
        GENERALIZED_SEQUENCE_LENGTH
    )

    # Prevent sequences from crossing historical gaps.
    if latest_rows["segment_id"].nunique() != 1:
        raise ValueError(
            "Latest historical sequence contains a date gap."
        )

    market_features = latest_rows[
        FEATURE_COLUMNS
    ].to_numpy(dtype=np.float32)

    if not np.isfinite(market_features).all():
        raise ValueError(
            "Invalid values found in prediction features."
        )

    # Apply the shared scaler fitted during training.
    scaled_features = scaler.transform(
        market_features
    ).astype(np.float32)

    # Create stock identity using the exact training order.
    stock_identity = np.zeros(
        len(GENERALIZED_STOCK_ORDER),
        dtype=np.float32
    )

    stock_index = GENERALIZED_STOCK_ORDER.index(symbol)
    stock_identity[stock_index] = 1.0

    stock_identity_features = np.tile(
        stock_identity,
        (GENERALIZED_SEQUENCE_LENGTH, 1)
    )

    # Combine market features and stock identity.
    combined_features = np.concatenate(
        [scaled_features, stock_identity_features],
        axis=1
    )

    X_input = np.expand_dims(
        combined_features,
        axis=0
    )

    # Check that input matches the trained model.
    expected_features = model.input_shape[-1]

    if X_input.shape[-1] != expected_features:
        raise ValueError(
            f"Model expects {expected_features} features, "
            f"but received {X_input.shape[-1]}."
        )

    predicted_return = float(
        model.predict(X_input, verbose=0)[0][0]
    )

    current_price = float(
        latest_rows["Close"].iloc[-1]
    )

    predicted_price = current_price * (
        1 + predicted_return
    )

    if predicted_return > 0:
        direction = "UP"
    elif predicted_return < 0:
        direction = "DOWN"
    else:
        direction = "NEUTRAL"

    return {
        "symbol": symbol,
        "current_price": round(current_price, 2),
        "predicted_price": round(predicted_price, 2),
        "predicted_return": round(
            predicted_return * 100, 4
        ),
        "direction": direction,
        "prediction_horizon": "Next trading session",
        "model": "Generalized LSTM",
        "model_type": "Multi-stock LSTM",
        "supported_stocks": GENERALIZED_STOCK_ORDER,
        "last_data_date": str(
            latest_rows.index[-1].date()
        ),
        "sequence_length": GENERALIZED_SEQUENCE_LENGTH,
        "feature_count": int(X_input.shape[-1]),
        "data_info": {
            "total_candles": int(len(df)),
            "valid_feature_rows": int(len(featured_df))
        },
        "disclaimer": (
            "Experimental machine learning estimate. "
            "Not financial advice or a guaranteed price."
        )
    }

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "success": True,
        "message": "MarketMind AI ML service is running"
    }), 200


@app.route("/api/sentiment/analyze", methods=["POST"])
def analyze_news_sentiment():
    try:
        payload = request.get_json(silent=True) or {}

        articles = payload.get("articles")

        if not isinstance(articles, list) or not articles:
            return jsonify({
                "success": False,
                "message": "A non-empty articles list is required."
            }), 400

        if len(articles) > 50:
            return jsonify({
                "success": False,
                "message": "Maximum 50 articles allowed per request."
            }), 400

        results = analyze_articles(articles)

        return jsonify({
            "success": True,
            "message": "News sentiment analyzed successfully.",
            "data": results
        }), 200

    except ValueError as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    except Exception:
        app.logger.exception("Sentiment analysis failed")

        return jsonify({
            "success": False,
            "message": "Unable to analyze news sentiment."
        }), 500


@app.route("/api/predict/<symbol>", methods=["GET"])
def predict_stock(symbol):
    try:
        symbol = symbol.strip().upper()
        if symbol.endswith(".NS"):
            symbol = symbol[:-3]
        if not symbol or len(symbol) > 30:
            return jsonify({
                "success": False,
                "message": "Invalid stock symbol."
            }), 400

        # This model was trained only on TCS.NS.
        if symbol not in ("TCS", "TCS.NS"):
            return jsonify({
                "success": False,
                "message": (
                    "The current LSTM model is trained for TCS.NS only. "
                    "Train a separate model before predicting this symbol."
                )
            }), 400

        express_url = (
            f"{EXPRESS_API_URL}/stocks/{symbol}/history"
        )

        response = requests.get(
            express_url,
            params={"interval": "1d"},
            timeout=30
        )

        response.raise_for_status()

        payload = response.json()

        if not payload.get("success"):
            return jsonify({
                "success": False,
                "message": "Express API could not provide historical data."
            }), 502

        historical_data = payload.get("data")

        result = predict_next_day(
            symbol,
            historical_data
        )

        return jsonify({
            "success": True,
            "message": "LSTM prediction generated successfully.",
            "data": result
        }), 200

    except requests.exceptions.RequestException:
        app.logger.exception("Express API request failed")

        return jsonify({
            "success": False,
            "message": "Unable to retrieve historical data from Express API."
        }), 502

    except ValueError as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    except Exception:
        app.logger.exception("Prediction failed")

        return jsonify({
            "success": False,
            "message": "Unable to generate stock prediction."
        }), 500

@app.route("/api/predict/generalized/<symbol>", methods=["GET"])
def predict_generalized_stock(symbol):
    try:
        symbol = symbol.strip().upper()
        if symbol.endswith(".NS"):
            symbol = symbol[:-3]

        if symbol not in GENERALIZED_STOCKS:
            return jsonify({
                "success": False,
                "message": (
                    "Unsupported stock. Supported stocks: "
                    + ", ".join(GENERALIZED_STOCK_ORDER)
                )
            }), 400

        express_url = (
            f"{EXPRESS_API_URL}/stocks/{symbol}/history"
        )

        response = requests.get(
            express_url,
            params={"interval": "1d"},
            timeout=30
        )

        response.raise_for_status()

        payload = response.json()

        if not payload.get("success"):
            return jsonify({
                "success": False,
                "message": (
                    "Express API could not provide historical data."
                )
            }), 502

        historical_data = payload.get("data")

        result = predict_generalized_next_day(
            symbol,
            historical_data
        )

        return jsonify({
            "success": True,
            "message": (
                "Generalized LSTM prediction generated successfully."
            ),
            "data": result
        }), 200

    except requests.exceptions.RequestException:
        app.logger.exception(
            "Express API request failed for generalized prediction."
        )

        return jsonify({
            "success": False,
            "message": (
                "Unable to retrieve historical data from Express API."
            )
        }), 502

    except ValueError as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    except Exception:
        app.logger.exception(
            "Generalized prediction failed."
        )

        return jsonify({
            "success": False,
            "message": "Unable to generate generalized prediction."
        }), 500

if __name__ == "__main__":
    port = int(os.getenv("ML_PORT", 8000))

    app.run(
        host="127.0.0.1",
        port=port,
        debug=False
    )
