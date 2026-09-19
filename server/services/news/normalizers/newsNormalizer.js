const normalizeNews = (articles, symbol) => {
    return articles.map((article) => ({
        symbol: symbol.toUpperCase(),

        title: article.title,

        description: article.description || "",

        source: article.source || "Unknown",

        author: article.author || null,

        url: article.url,

        publishedAt: article.publishedAt
    }));
};

module.exports = {
    normalizeNews
};