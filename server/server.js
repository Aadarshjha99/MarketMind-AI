const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "MarketMind AI server is running",
        environment: process.env.NODE_ENV
    });
});

// Root route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to MarketMind AI API"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`MarketMind AI server running on port ${PORT}`);
});