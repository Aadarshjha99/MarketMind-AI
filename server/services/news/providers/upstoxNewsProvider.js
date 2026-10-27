// const upstoxClient = require("../../upstox/upstoxClient");

// const getNews = async (instrumentKey) => {
//     const response = await upstoxClient.get("/news", {
//         params: {
//             category: "instrument_keys",
//             instrument_keys: instrumentKey,
//             page_number: 1,
//             page_size: 20
//         }
//     });

//     return response.data.data?.[instrumentKey] || [];
// };

// module.exports = {
//     getNews
// };

const upstoxClient = require("../../upstox/upstoxClient");

const getNews = async (instrumentKey) => {
    const response = await upstoxClient.get("/news", {
        params: {
            category: "instrument_keys",
            instrument_keys: instrumentKey,
            page_number: 1,
            page_size: 100
        }
    });

    console.log("News API metadata:", response.data.metadata);
    console.log("News API status:", response.data.status);

    console.log("News data keys:", Object.keys(response.data.data || {}));
    console.log("Complete news data:", JSON.stringify(response.data.data, null, 2));

    const articles = response.data.data?.[instrumentKey] || [];

    console.log("\n--- Upstox News Debug ---");
    console.log("Instrument:", instrumentKey);
    console.log("Articles returned:", articles.length);

    articles.forEach((article) => {
        console.log({
            heading: article.heading,
            publishedTime: article.published_time,
            publishedDate: article.published_time
                ? new Date(article.published_time).toISOString()
                : null
        });
    });

    return articles;
};

module.exports = {
    getNews
};