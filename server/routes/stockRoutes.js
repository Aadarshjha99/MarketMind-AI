const express = require("express");

const {
    searchStocks,
    getStockQuote,
    getStockHistory,
    getTechnicalIndicators
} = require("../controllers/stockController");

const router = express.Router();

router.get("/search", searchStocks);

router.get("/:symbol/quote", getStockQuote);

router.get("/:symbol/history", getStockHistory);

router.get(
    "/:symbol/technical",
    getTechnicalIndicators
);

module.exports = router;