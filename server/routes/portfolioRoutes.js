
const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
    getPortfolio,
    addHolding,
    reduceHolding,
    removeHolding
} = require("../controllers/portfolioController");

const router = express.Router();

// All portfolio routes require authentication
router.use(protect);

// Get all holdings
router.get("/", getPortfolio);

// Add shares
router.post("/", addHolding);

// Reduce shares
router.patch("/:symbol/reduce", reduceHolding);

// Remove a stock completely
router.delete("/:symbol", removeHolding);

module.exports = router;
