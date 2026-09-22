const normalizeNews = (articles, symbol) => {
    return articles
        .map((article) => {
            let publishedAt;

            if (typeof article.published_time === "number") {
                publishedAt = new Date(article.published_time);
            } else {
                publishedAt = new Date(
                    article.publishedAt ||
                    article.published_at ||
                    article.publishedAtUtc
                );
            }

            if (Number.isNaN(publishedAt.getTime())) {
                console.warn(
                    `Skipping article with invalid date: ${
                        article.heading || article.title
                    }`
                );

                return null;
            }

            return {
                symbol: symbol.toUpperCase(),

                title:
                    article.heading ||
                    article.title ||
                    "Untitled article",

                description:
                    article.summary ||
                    article.description ||
                    "",

                source:
                    article.source ||
                    "Upstox",

                author: article.author || null,

                url:
                    article.article_link ||
                    article.url,

                publishedAt
            };
        })
        .filter(Boolean);
};

module.exports = {
    normalizeNews
};