const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
    {
        symbol: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            index: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        source: {
            type: String,
            required: true,
            trim: true
        },

        author: {
            type: String,
            default: null
        },

        url: {
            type: String,
            required: true
        },

        publishedAt: {
            type: Date,
            required: true,
            index: true
        },

        sentiment: {
            type: String,
            enum: ["positive", "neutral", "negative"],
            default: "neutral"
        },

        sentimentScore: {
            type: Number,
            default: null
        },

        relevanceScore: {
            type: Number,
            default: null
        },

        impact: {
            type: String,
            enum: ["low", "medium", "high"],
            default: null
        },

        summary: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

newsSchema.index({
    symbol: 1,
    publishedAt: -1
});

newsSchema.index(
    {
        symbol: 1,
        url: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model("News", newsSchema);