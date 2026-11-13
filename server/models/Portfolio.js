
const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
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
        },

        companyName: {
            type: String,
            trim: true,
            default: ""
        },

        quantity: {
            type: Number,
            required: true,
            min: 0
        },

        averageBuyPrice: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

// A user can have only one holding document per stock.
portfolioSchema.index(
    { userId: 1, symbol: 1 },
    { unique: true }
);

module.exports = mongoose.model("Portfolio", portfolioSchema);
