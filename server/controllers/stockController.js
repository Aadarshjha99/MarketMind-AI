const marketService = require("../services/market/marketService");
const technicalService = require("../services/technical/technicalService");
const axios = require("axios");

const searchStocks = async (req, res) => {
    try {
        const { q } = req.query;

        console.log("Stock search query:", q);

        if (!q) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const data = await marketService.searchStocks(q);

        res.status(200).json({
            success: true,
            message: "Stocks fetched successfully",
            data
        });

    } catch (error) {
        console.error(
            "Stock search error:",
            error.response?.data || error.message
        );

        res.status(502).json({
            success: false,
            message: "Unable to fetch stock data"
        });
    }
};

const getStockQuote = async (req, res) => {
    try {
        const { symbol } = req.params;

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: "Stock symbol is required"
            });
        }

        const data = await marketService.getQuote(
            symbol.toUpperCase()
        );

        res.status(200).json({
            success: true,
            message: "Stock quote fetched successfully",
            data
        });

    } catch (error) {
        console.error(
            "Stock quote error:",
            error.response?.data || error.message
        );

        res.status(502).json({
            success: false,
            message: "Unable to fetch stock quote"
        });
    }
};

const getStockHistory = async (req, res) => {
    try {
        const { symbol } = req.params;
        const { interval = "1d" } = req.query;

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: "Stock symbol is required"
            });
        }

        const data = await marketService.getHistoricalData(
            symbol.toUpperCase(),
            interval
        );

        res.status(200).json({
            success: true,
            message: "Historical data fetched successfully",
            data
        });

    } catch (error) {
        console.error(
            "Historical data error:",
            error.response?.data || error.message
        );

        res.status(502).json({
            success: false,
            message: "Unable to fetch historical stock data"
        });
    }
};

const getTechnicalIndicators = async (req, res) => {
    try {
        const { symbol } = req.params;

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: "Stock symbol is required"
            });
        }

        const historicalData =
            await marketService.getHistoricalData(
                symbol.toUpperCase()
            );

        const indicators =
            technicalService.calculateIndicators(
                historicalData
            );

        res.status(200).json({
            success: true,
            message: "Technical indicators calculated successfully",
            data: {
                symbol: symbol.toUpperCase(),
                indicators
            }
        });

    } catch (error) {
        console.error(
            "Technical analysis error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to calculate technical indicators"
        });
    }
};


const getStockPrediction = async (req, res) => {
    try {
        const symbol = req.params.symbol
            .trim()
            .toUpperCase()
            .replace(/\.NS$/, "");

        const ML_API_URL =
            process.env.ML_API_URL || "http://127.0.0.1:8000";

        const response = await axios.get(
            `${ML_API_URL}/api/predict/generalized/${symbol}`,
            {
                timeout: 120000
            }
        );

        return res.status(200).json(response.data);

    } catch (error) {
        console.error(
            "Stock prediction error:",
            error.response?.data || error.message
        );

        return res.status(error.response?.status || 502).json({
            success: false,
            message:
                error.response?.data?.message ||
                "Unable to generate stock prediction"
        });
    }
};


module.exports = {
    searchStocks,
    getStockQuote,
    getStockHistory,
    getTechnicalIndicators,
    getStockPrediction
};