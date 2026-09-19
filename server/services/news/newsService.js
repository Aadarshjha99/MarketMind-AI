const News = require("../../models/News");

const mockNewsProvider = require("./providers/mockNewsProvider");
const upstoxNewsProvider = require("./providers/upstoxNewsProvider");

const { getInstrumentKey } = require("./providers/upstoxInstrumentMap");
const { normalizeNews } = require("./normalizers/newsNormalizer");

const providers = {
    mock: mockNewsProvider,
    upstox: upstoxNewsProvider
};

const activeProviderName = process.env.NEWS_DATA_PROVIDER || "mock";

const activeProvider = providers[activeProviderName];

if (!activeProvider) {
    throw new Error(
        `Unsupported news data provider: ${activeProviderName}`
    );
}

const getStockNews = async (symbol) => {
    const normalizedSymbol = symbol.toUpperCase();

    let articles;

    if (activeProviderName === "upstox") {
        const instrumentKey = getInstrumentKey(normalizedSymbol);

        if (!instrumentKey) {
            throw new Error(
                `Instrument key not found for ${normalizedSymbol}`
            );
        }

        articles = await activeProvider.getNews(instrumentKey);
    } else {
        articles = await activeProvider.getNews(normalizedSymbol);
    }

    const normalizedArticles = normalizeNews(
        articles,
        normalizedSymbol
    );

    const savedArticles = [];

    for (const article of normalizedArticles) {
        const savedArticle = await News.findOneAndUpdate(
            {
                symbol: article.symbol,
                url: article.url
            },
            article,
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