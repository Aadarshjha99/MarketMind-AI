
const normalizeNews = (articles = [], symbol) => {
    return articles
        .map((article) => {
            const rawDate =
                article.published_time ??
                article.publishedAt ??
                article.published_at ??
                article.publishedAtUtc;

            let publishedAt;

            if (typeof rawDate === "number") {
                publishedAt = new Date(
                    rawDate < 1e12 ? rawDate * 1000 : rawDate
                );
            } else if (rawDate) {
                publishedAt = new Date(rawDate);
            }

            const url = article.article_link || article.url || null;

            if (!url) {
                console.warn(
                    `Skipping article without URL: ${
                        article.heading || article.title || "Untitled"
                    }`
                );
                return null;
            }

            if (!publishedAt || Number.isNaN(publishedAt.getTime())) {
                console.warn(
                    `Skipping article with invalid date: ${
                        article.heading || article.title || "Untitled"
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

                image:
                    article.image_url ||
                    article.image ||
                    null,

                source:
                    article.source ||
                    article.publisher ||
                    "Upstox",

                author: article.author || null,

                url,
                publishedAt,

                sentiment: "neutral"
            };
        })
        .filter(Boolean);
};

module.exports = { normalizeNews };
