const express = require("express");

const {
    searchStocks,
    getStockQuote,
    getStockHistory
} = require("../controllers/stockController");

const router = express.Router();

router.get("/search", searchStocks);

router.get("/:symbol/quote", getStockQuote);

router.get("/:symbol/history", getStockHistory);

module.exports = router;