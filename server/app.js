const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const stockRoutes = require("./routes/stockRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/stocks", stockRoutes);

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

module.exports = app;