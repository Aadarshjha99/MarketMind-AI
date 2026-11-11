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

    const dataKey =
        `${instrumentKey.split("|")[0]}:${instrument.symbol}`;

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
            stockData.ohlc.close
                ? ((stockData.last_price - stockData.ohlc.close) /
                    stockData.ohlc.close) * 100
                : 0,
        previousClose: stockData.ohlc.close,
        dayHigh: stockData.ohlc.high,
        dayLow: stockData.ohlc.low,
        volume: stockData.volume || 0,
        timestamp: new Date().toISOString()
    };
};


// ---------------------------------------
// Historical Market Data
// ---------------------------------------


const getHistoricalData = async (
    symbol,
    interval = "1d"
) => {
    const instrument = await getInstrumentBySymbol(symbol);
    const instrumentKey = instrument.instrumentKey;

    const encodedInstrumentKey =
        encodeURIComponent(instrumentKey);

    // Special handling for today's intraday data.
    if (interval === "5m") {
        const url =
            `https://api.upstox.com/v3/historical-candle/` +
            `intraday/${encodedInstrumentKey}/minutes/5`;

        const response = await upstoxClient.get(url, {
            headers: {
                Accept: "application/json"
            }
        });

        const candles = response.data?.data?.candles;

        if (!Array.isArray(candles)) {
            throw new Error(
                `Invalid intraday data response for ${symbol}`
            );
        }

        return candles;
    }

    // Historical data for other chart periods.
    const intervalMap = {
        "1d": {
            unit: "days",
            value: "1",
            monthsBack: 12
        },
        "1w": {
            unit: "weeks",
            value: "1",
            monthsBack: 24
        },
        "1M": {
            unit: "months",
            value: "1",
            monthsBack: 60
        }
    };

    const selectedInterval =
        intervalMap[interval] || intervalMap["1d"];

    const toDate = new Date();
    const fromDate = new Date();

    fromDate.setMonth(
        fromDate.getMonth() -
        selectedInterval.monthsBack
    );

    const formatDate = (date) => {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    };

    const url =
        `https://api.upstox.com/v3/historical-candle/` +
        `${encodedInstrumentKey}/` +
        `${selectedInterval.unit}/` +
        `${selectedInterval.value}/` +
        `${formatDate(toDate)}/` +
        `${formatDate(fromDate)}`;

    const response = await upstoxClient.get(url, {
        headers: {
            Accept: "application/json"
        }
    });

    const candles = response.data?.data?.candles;

    if (!Array.isArray(candles)) {
        throw new Error(
            `Invalid historical data response for ${symbol}`
        );
    }

    return candles;
};


module.exports = {
    searchStocks,
    getQuote,
    getHistoricalData
};
