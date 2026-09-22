require("dotenv").config();

const upstoxClient = require("./upstoxClient");

const testUpstoxConnection = async () => {
    try {
        const response = await upstoxClient.get(
            "/v2/market-quote/ohlc",
            {
                params: {
                    instrument_key: "NSE_EQ|INE467B01029",
                    interval: "1d"
                }
            }
        );

        console.log("Upstox connection successful!");
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error(
            "Upstox connection failed:",
            error.response?.data || error.message
        );
    }
};

testUpstoxConnection();