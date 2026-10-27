const {
    searchInstruments,
    getInstrumentBySymbol
} = require("../../instruments/instrumentService");

const upstoxClient = require("../../upstox/upstoxClient");

const searchStocks = async (query) => {
    return searchInstruments(query);
};

const getQuote = async (symbol) => {
    const instrument = await getInstrumentBySymbol(symbol);
    const instrumentKey = instrument.instrumentKey;

    const response = await upstoxClient.get(
        "/market-quote/ohlc",
        {
            params: {
                instrument_key: instrumentKey,
                interval: "1d"
            }
        }
    );

    const dataKey = `${instrumentKey.split("|")[0]}:${instrument.symbol}`;

    const stockData = response.data.data[dataKey];

    if (!stockData) {
        throw new Error(`No market data found for ${symbol}`);
    }

    return {
        symbol: instrument.symbol,
        companyName: instrument.companyName,
        exchange: instrument.exchange,
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
    searchStocks,
    getQuote
};