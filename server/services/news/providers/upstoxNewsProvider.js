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

    const articles = response.data.data?.[instrumentKey] || [];

    return articles;
};

module.exports = {
    getNews
};
