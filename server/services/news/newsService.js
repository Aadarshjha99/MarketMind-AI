const mockNewsProvider = require("./providers/mockNewsProvider");
const News = require("../../models/News");

const {
    normalizeNews
} = require("./normalizers/newsNormalizer");

const providers = {
    mock: mockNewsProvider
};

const activeProviderName =
    process.env.NEWS_DATA_PROVIDER || "mock";

const activeProvider =
    providers[activeProviderName];

if (!activeProvider) {
    throw new Error(
        `Unsupported news provider: ${activeProviderName}`
    );
}

const getNews = async (symbol) => {
    const normalizedSymbol = symbol.toUpperCase();

    const articles =
        await activeProvider.getNews(normalizedSymbol);

    const normalizedArticles =
        normalizeNews(
            articles,
            normalizedSymbol
        );

    const savedArticles = [];

    for (const article of normalizedArticles) {
        const savedArticle =
            await News.findOneAndUpdate(
                {
                    symbol: article.symbol,
                    url: article.url
                },
                {
                    $set: article
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
    getNews
};