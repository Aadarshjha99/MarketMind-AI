
const Watchlist = require("../models/Watchlist");

// GET /api/v1/watchlist
const getWatchlist = async (req, res) => {
    try {
        const watchlist = await Watchlist.find({
            userId: req.user.userId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: watchlist.length,
            data: watchlist
        });

    } catch (error) {
        console.error("Get watchlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch watchlist"
        });
    }
};


// POST /api/v1/watchlist
const addToWatchlist = async (req, res) => {
    try {
        const { symbol } = req.body;

        if (!symbol || typeof symbol !== "string" || !symbol.trim()) {
            return res.status(400).json({
                success: false,
                message: "Stock symbol is required"
            });
        }

        const normalizedSymbol = symbol.trim().toUpperCase();

        if (normalizedSymbol.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Invalid stock symbol"
            });
        }

        const existingStock = await Watchlist.findOne({
            userId: req.user.userId,
            symbol: normalizedSymbol
        });

        if (existingStock) {
            return res.status(409).json({
                success: false,
                message: "Stock already exists in your watchlist"
            });
        }

        const watchlistItem = await Watchlist.create({
            userId: req.user.userId,
            symbol: normalizedSymbol
        });

        return res.status(201).json({
            success: true,
            message: "Stock added to watchlist",
            data: watchlistItem
        });

    } catch (error) {
        console.error("Add to watchlist error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Stock already exists in your watchlist"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to add stock to watchlist"
        });
    }
};


// DELETE /api/v1/watchlist/:symbol
const removeFromWatchlist = async (req, res) => {
    try {
        const symbol = req.params.symbol.trim().toUpperCase();

        const deletedItem = await Watchlist.findOneAndDelete({
            userId: req.user.userId,
            symbol
        });

        if (!deletedItem) {
            return res.status(404).json({
                success: false,
                message: "Stock not found in your watchlist"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Stock removed from watchlist"
        });

    } catch (error) {
        console.error("Remove from watchlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove stock from watchlist"
        });
    }
};


module.exports = {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist
};
