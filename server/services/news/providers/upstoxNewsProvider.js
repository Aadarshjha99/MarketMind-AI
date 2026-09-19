const axios = require("axios");

const UPSTOX_NEWS_URL = "https://api.upstox.com/v2/news";

const getNews = async (instrumentKey) => {
    if (!process.env.UPSTOX_ANALYTICS_TOKEN) {
        throw new Error("UPSTOX_ANALYTICS_TOKEN is not configured");
    }

    const response = await axios.get(UPSTOX_NEWS_URL, {
        params: {
            category: "instrument_keys",
            instrument_keys: instrumentKey,
            page_number: 1,
            page_size: 20
        },
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${process.env.UPSTOX_ANALYTICS_TOKEN}`
        }
    });

    return response.data.data?.[instrumentKey] || [];
};

module.exports = {
    getNews
};