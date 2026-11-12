
const express = require("express");

const {
    searchStocks,
    getStockQuote,
    getStockHistory,
    getTechnicalIndicators,
    getStockPrediction
} = require("../controllers/stockController");

const router = express.Router();

router.get("/search", searchStocks);

router.get("/:symbol/quote", getStockQuote);

router.get("/:symbol/history", getStockHistory);

router.get("/:symbol/technical", getTechnicalIndicators);

// Generalized LSTM prediction
router.get("/:symbol/prediction", getStockPrediction);

module.exports = router;
