
const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        symbol: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        }
    },
    {
        timestamps: true
    }
);

// A user can save a particular stock only once.
watchlistSchema.index(
    { userId: 1, symbol: 1 },
    { unique: true }
);

module.exports = mongoose.model("Watchlist", watchlistSchema);
