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

const getNiftyNews = async () => {
    const instrumentKey = "NSE_INDEX|Nifty 50";

    const response = await upstoxClient.get("/news", {
        params: {
            category: "instrument_keys",
            instrument_keys: instrumentKey,
            page_number: 1,
            page_size: 20
        }
    });

    console.log(
        "Nifty News Response:",
        JSON.stringify(response.data, null, 2)
    );

    return response.data.data?.[instrumentKey] || [];
};

module.exports = {
    getNews,
    getNiftyNews
};
