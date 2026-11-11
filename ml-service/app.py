
import os
import requests

from flask import Flask, jsonify
from dotenv import load_dotenv

from services.data_preprocessing import prepare_historical_data
from services.random_forest import train_and_predict


load_dotenv()

app = Flask(__name__)

EXPRESS_API_URL = os.getenv(
    "EXPRESS_API_URL",
    "http://localhost:5000/api/v1"
)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "success": True,
        "message": "MarketMind AI ML service is running"
    }), 200


@app.route("/api/predict/<symbol>", methods=["GET"])
def predict_stock(symbol):
    try:
        symbol = symbol.strip().upper()

        if not symbol or len(symbol) > 30:
            return jsonify({
                "success": False,
                "message": "Invalid stock symbol."
            }), 400

        # Fetch historical data through Express.
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

        # Preprocess market data.
        df = prepare_historical_data(historical_data)

        # Train, evaluate and predict.
        result = train_and_predict(df, symbol)

        result["data_info"] = {
            "total_candles": int(len(df)),
            "first_date": df.iloc[0]["datetime"].isoformat(),
            "latest_date": df.iloc[-1]["datetime"].isoformat()
        }

        return jsonify({
            "success": True,
            "message": "Stock prediction generated successfully",
            "data": result
        }), 200

    except requests.exceptions.RequestException as error:
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


if __name__ == "__main__":
    port = int(os.getenv("ML_PORT", 8000))

    app.run(
        host="127.0.0.1",
        port=port,
        debug=False
    )
