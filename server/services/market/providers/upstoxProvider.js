const upstoxClient = require("../../upstox/upstoxClient");

const instrumentMap = {
    TCS: "NSE_EQ|INE467B01029",
    INFY: "NSE_EQ|INE009A01021",
    RELIANCE: "NSE_EQ|INE002A01018",
    HDFCBANK: "NSE_EQ|INE040A01034"
};

const getInstrumentKey = (symbol) => {
    const key = instrumentMap[symbol.toUpperCase()];

    if (!key) {
        throw new Error(`Unsupported stock symbol: ${symbol}`);
    }

    return key;
};

const getQuote = async (symbol) => {
    const instrumentKey = getInstrumentKey(symbol);

    const response = await upstoxClient.get(
        "/market-quote/ohlc",
        {
            params: {
                instrument_key: instrumentKey,
                interval: "1d"
            }
        }
    );

    const dataKey = `${instrumentKey.split("|")[0]}:${symbol.toUpperCase()}`;

    const stockData = response.data.data[dataKey];

    if (!stockData) {
        throw new Error(`No market data found for ${symbol}`);
    }

    return {
        symbol: symbol.toUpperCase(),
        exchange: "NSE",
        currency: "INR",
        price: stockData.last_price,
        change: stockData.last_price - stockData.ohlc.close,
        changePercent:
            ((stockData.last_price - stockData.ohlc.close) /
                stockData.ohlc.close) *
            100,
        previousClose: stockData.ohlc.close,
        dayHigh: stockData.ohlc.high,
        dayLow: stockData.ohlc.low,
        volume: 0,
        timestamp: new Date().toISOString()
    };
};

module.exports = {
    getQuote
};