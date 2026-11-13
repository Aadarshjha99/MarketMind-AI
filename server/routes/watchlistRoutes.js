
const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist
} = require("../controllers/watchlistController");

const router = express.Router();

// All watchlist routes require authentication.
router.use(protect);

router.get("/", getWatchlist);

router.post("/", addToWatchlist);

router.delete("/:symbol", removeFromWatchlist);

module.exports = router;
