const upstoxClient = require("../../upstox/upstoxClient");

const getNews = async (instrumentKey) => {
    const response = await upstoxClient.get("/news", {
        params: {
            category: "instrument_keys",
            instrument_keys: instrumentKey,
            page_number: 1,
            page_size: 20
        }
    });

    return response.data.data?.[instrumentKey] || [];
};

module.exports = {
    getNews
};