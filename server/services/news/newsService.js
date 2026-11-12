
const News = require("../../models/News");

const mockNewsProvider = require("./providers/mockNewsProvider");
const upstoxNewsProvider = require("./providers/upstoxNewsProvider");

const {
    getInstrumentBySymbol
} = require("../instruments/instrumentService");

const { normalizeNews } = require("./normalizers/newsNormalizer");

const providers = {
    mock: mockNewsProvider,
    upstox: upstoxNewsProvider
};

const activeProviderName = process.env.NEWS_DATA_PROVIDER || "mock";
const activeProvider = providers[activeProviderName];

const ML_API_URL = (
    process.env.ML_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

if (!activeProvider) {
    throw new Error(`Unsupported news data provider: ${activeProviderName}`);
}

// Send articles to Flask and receive FinBERT sentiment predictions.
const analyzeNewsSentiment = async (articles) => {
    try {
        if (!articles.length) {
            return new Map();
        }

        console.log("ML API URL:", `${ML_API_URL}/api/sentiment/analyze`);
        console.log("Articles being sent:", articles.length);
        const response = await fetch(
            `${ML_API_URL}/api/sentiment/analyze`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    articles: articles.map((article) => ({
                        url: article.url,
                        title: article.title,
                        description: article.description
                    }))
                }),
                signal: AbortSignal.timeout(60000)
            }
        );

        if (!response.ok) {
            throw new Error(`ML service returned HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
            throw new Error("Invalid sentiment response from ML service");
        }

        // Match predictions to articles using their URLs.
        return new Map(
            result.data
                .filter((item) => item.url)
                .map((item) => [item.url, item])
        );

    } catch (error) {
        //console.error("FinBERT sentiment analysis unavailable:", error.message);
        console.error("FinBERT connection error:", error);
        // Continue serving news even if the ML service is unavailable.
        return new Map();
    }
};

const getStockNews = async (symbol) => {
    const normalizedSymbol = symbol.toUpperCase();

    let articles;

    if (activeProviderName === "upstox") {
        const instrument = await getInstrumentBySymbol(normalizedSymbol);

        articles = await activeProvider.getNews(
            instrument.instrumentKey
        );
    } else {
        articles = await activeProvider.getNews(normalizedSymbol);
    }

    const normalizedArticles = normalizeNews(
        articles,
        normalizedSymbol
    );

    // Analyze all fetched articles in one batch.
    const sentimentResults = await analyzeNewsSentiment(
        normalizedArticles
    );

    const savedArticles = [];

    for (const article of normalizedArticles) {
        const sentimentResult = sentimentResults.get(article.url);

        const updateFields = {
            ...article
        };

        // Only update sentiment when FinBERT returns a valid prediction.
        // This prevents an ML service failure from overwriting old sentiment.
        if (
            sentimentResult &&
            ["positive", "negative", "neutral"].includes(
                sentimentResult.sentiment
            )
        ) {
            updateFields.sentiment = sentimentResult.sentiment;
            updateFields.sentimentScore =
                sentimentResult.sentimentScore;
        }

        const savedArticle = await News.findOneAndUpdate(
            {
                symbol: article.symbol,
                url: article.url
            },
            {
                $set: updateFields
            },
            {
                returnDocument: "after",
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        savedArticles.push(savedArticle);
    }

    return savedArticles;
};

module.exports = {
    getStockNews
};
