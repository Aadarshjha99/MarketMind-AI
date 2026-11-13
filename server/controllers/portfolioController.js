
const Portfolio = require("../models/Portfolio");

// @desc    Get user's portfolio
// @route   GET /api/v1/portfolio
// @access  Private
const getPortfolio = async (req, res) => {
    try {
        const holdings = await Portfolio.find({
            userId: req.user.userId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: holdings.length,
            data: holdings
        });
    } catch (error) {
        console.error("Get portfolio error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch portfolio"
        });
    }
};


// @desc    Add shares to portfolio
// @route   POST /api/v1/portfolio
// @access  Private
const addHolding = async (req, res) => {
    try {
        const { symbol, companyName, quantity, buyPrice } = req.body;

        // Validate required fields
        if (
            !symbol ||
            typeof symbol !== "string" ||
            !Number.isFinite(quantity) ||
            !Number.isFinite(buyPrice) ||
            quantity <= 0 ||
            buyPrice <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid symbol, quantity and buy price"
            });
        }

        const normalizedSymbol = symbol.trim().toUpperCase();

        if (!normalizedSymbol || normalizedSymbol.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Invalid stock symbol"
            });
        }

        let holding = await Portfolio.findOne({
            userId: req.user.userId,
            symbol: normalizedSymbol
        });

        if (holding) {
            // Calculate weighted average purchase price
            const oldInvestment =
                holding.quantity * holding.averageBuyPrice;

            const newInvestment = quantity * buyPrice;

            const updatedQuantity = holding.quantity + quantity;

            holding.averageBuyPrice =
                (oldInvestment + newInvestment) / updatedQuantity;

            holding.quantity = updatedQuantity;

            if (companyName?.trim()) {
                holding.companyName = companyName.trim();
            }

            await holding.save();
        } else {
            holding = await Portfolio.create({
                userId: req.user.userId,
                symbol: normalizedSymbol,
                companyName: companyName?.trim() || "",
                quantity,
                averageBuyPrice: buyPrice
            });
        }

        res.status(201).json({
            success: true,
            message: "Stock added to portfolio successfully",
            data: holding
        });
    } catch (error) {
        console.error("Add holding error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to add stock to portfolio"
        });
    }
};


// @desc    Reduce shares from portfolio
// @route   PATCH /api/v1/portfolio/:symbol/reduce
// @access  Private
const reduceHolding = async (req, res) => {
    try {
        const symbol = req.params.symbol.trim().toUpperCase();
        const { quantity } = req.body;

        if (!Number.isFinite(quantity) || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid quantity"
            });
        }

        const holding = await Portfolio.findOne({
            userId: req.user.userId,
            symbol
        });

        if (!holding) {
            return res.status(404).json({
                success: false,
                message: "Stock not found in your portfolio"
            });
        }

        if (quantity > holding.quantity) {
            return res.status(400).json({
                success: false,
                message: "You cannot reduce more shares than you currently hold"
            });
        }

        holding.quantity -= quantity;

        // Remove the holding when no shares remain
        if (holding.quantity === 0) {
            await holding.deleteOne();

            return res.status(200).json({
                success: true,
                message: "All shares removed from portfolio"
            });
        }

        await holding.save();

        res.status(200).json({
            success: true,
            message: "Portfolio quantity updated successfully",
            data: holding
        });
    } catch (error) {
        console.error("Reduce holding error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update portfolio"
        });
    }
};


// @desc    Remove a stock completely
// @route   DELETE /api/v1/portfolio/:symbol
// @access  Private
const removeHolding = async (req, res) => {
    try {
        const symbol = req.params.symbol.trim().toUpperCase();

        const holding = await Portfolio.findOneAndDelete({
            userId: req.user.userId,
            symbol
        });

        if (!holding) {
            return res.status(404).json({
                success: false,
                message: "Stock not found in your portfolio"
            });
        }

        res.status(200).json({
            success: true,
            message: "Stock removed from portfolio successfully"
        });
    } catch (error) {
        console.error("Remove holding error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to remove stock from portfolio"
        });
    }
};


module.exports = {
    getPortfolio,
    addHolding,
    reduceHolding,
    removeHolding
};
