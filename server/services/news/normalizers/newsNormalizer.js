const normalizeNews = (articles, symbol) => {
    return articles
        .map((article) => {
            const rawPublishedAt =
                article.publishedAt ||
                article.published_time ||
                article.publishedAtUtc ||
                article.published_at;

            const publishedAt = new Date(rawPublishedAt);

            // Ignore articles with an invalid publication date
            if (Number.isNaN(publishedAt.getTime())) {
                console.warn(
                    `Skipping news article with invalid date: ${article.title || article.heading}`
                );

                return null;
            }

            return {
                symbol: symbol.toUpperCase(),

                title:
                    article.title ||
                    article.heading ||
                    "Untitled article",

                description:
                    article.description ||
                    article.summary ||
                    "",

                source:
                    article.source ||
                    article.source_name ||
                    "Unknown",

                author: article.author || null,

                url:
                    article.url ||
                    article.article_link,

                publishedAt
            };
        })
        .filter(Boolean);
};

module.exports = {
    normalizeNews
};