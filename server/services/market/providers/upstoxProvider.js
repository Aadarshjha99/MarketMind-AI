
const {
    searchInstruments,
    getInstrumentBySymbol
} = require("../../instruments/instrumentService");

const upstoxClient = require("../../upstox/upstoxClient");

// =======================================
// SEARCH STOCKS
// =======================================

const searchStocks = async (query) => {
    return searchInstruments(query);
};

// =======================================
// GET STOCK QUOTE
// =======================================

const getQuote = async (symbol) => {
    try {
        const instrument = await getInstrumentBySymbol(symbol);
        const instrumentKey = instrument.instrumentKey;

        // Fetch quote from Upstox
        const response = await upstoxClient.get(
            "/market-quote/ohlc",
            {
                params: {
                    instrument_key: instrumentKey,
                    interval: "1d"
                }
            }
        );

        const responseData = response.data?.data || {};

        // Find matching instrument data
        let stockData = Object.values(responseData).find(
            (item) =>
                item.instrument_token === instrumentKey
        );

        if (!stockData) {
            stockData = responseData[instrumentKey];
        }

        // If only one instrument was requested,
        // use the first returned result.
        if (!stockData) {
            const values = Object.values(responseData);

            if (values.length === 1) {
                stockData = values[0];
            }
        }

        if (!stockData) {
            console.error(
                "Upstox quote response:",
                JSON.stringify(response.data, null, 2)
            );

            throw new Error(
                `No market data found for ${symbol}`
            );
        }

        // Support both response formats
        const liveOHLC =
            stockData.live_ohlc ||
            stockData.ohlc;

        if (!liveOHLC) {
            throw new Error(
                `OHLC data unavailable for ${symbol}`
            );
        }

        const price = Number(stockData.last_price);

        if (!Number.isFinite(price) || price <= 0) {
            throw new Error(
                `Invalid market price received for ${symbol}`
            );
        }

        // =======================================
        // PREVIOUS CLOSING PRICE
        // =======================================

        let previousClose = Number(
            stockData.prev_ohlc?.close
        );

        // If previous OHLC is unavailable,
        // fetch the previous completed daily candle.

        if (
            !Number.isFinite(previousClose) ||
            previousClose <= 0
        ) {
            const candles = await getHistoricalData(
                symbol,
                "1d"
            );

            const liveTimestamp = Number(liveOHLC.ts);

            const referenceTime =
                Number.isFinite(liveTimestamp)
                    ? liveTimestamp
                    : Date.now();

            const previousCandles = candles
                .filter((candle) => {
                    if (!Array.isArray(candle)) {
                        return false;
                    }

                    const candleTime = new Date(
                        candle[0]
                    ).getTime();

                    const candleClose = Number(
                        candle[4]
                    );

                    return (
                        Number.isFinite(candleTime) &&
                        candleTime < referenceTime &&
                        Number.isFinite(candleClose) &&
                        candleClose > 0
                    );
                })
                .sort(
                    (a, b) =>
                        new Date(b[0]).getTime() -
                        new Date(a[0]).getTime()
                );

            if (previousCandles.length > 0) {
                previousClose = Number(
                    previousCandles[0][4]
                );
            } else {
                previousClose = Number(liveOHLC.close);
            }
        }

        if (
            !Number.isFinite(previousClose) ||
            previousClose <= 0
        ) {
            throw new Error(
                `Previous closing price unavailable for ${symbol}`
            );
        }

        // =======================================
        // PRICE CHANGE CALCULATION
        // =======================================

        const change = price - previousClose;

        const changePercent =
            (change / previousClose) * 100;

        // =======================================
        // VOLUME
        // =======================================

        let volume = Number(
            liveOHLC.volume ??
            stockData.volume ??
            0
        );

        // If quote API does not provide volume,
        // calculate it using today's 5-minute candles.

        if (!volume) {
            try {
                const intradayCandles =
                    await getHistoricalData(symbol, "5m");

                volume = intradayCandles.reduce(
                    (total, candle) => {
                        return (
                            total +
                            Number(candle[5] || 0)
                        );
                    },
                    0
                );

                console.log(
                    `Calculated intraday volume for ${symbol}:`,
                    volume
                );

            } catch (error) {
                console.error(
                    `Unable to fetch intraday volume for ${symbol}:`,
                    error.response?.data || error.message
                );

                volume = 0;
            }
        }

        // =======================================
        // NORMALIZED QUOTE
        // =======================================

        return {
            symbol: instrument.symbol,
            companyName: instrument.companyName,
            exchange: instrument.exchange,
            currency: "INR",

            price,
            change,
            changePercent,

            previousClose,

            dayHigh: Number(
                liveOHLC.high ?? price
            ),

            dayLow: Number(
                liveOHLC.low ?? price
            ),

            volume,

            timestamp: liveOHLC.ts
                ? new Date(
                    Number(liveOHLC.ts)
                ).toISOString()
                : new Date().toISOString()
        };

    } catch (error) {
        console.error(
            `Upstox getQuote error for ${symbol}:`,
            error.response?.data || error.message
        );

        throw error;
    }
};

// =======================================
// GET HISTORICAL DATA
// =======================================

const getHistoricalData = async (
    symbol,
    interval = "1d"
) => {
    const instrument = await getInstrumentBySymbol(symbol);

    const instrumentKey = instrument.instrumentKey;

    const encodedInstrumentKey =
        encodeURIComponent(instrumentKey);

    // =======================================
    // INTRADAY DATA (5 MINUTES)
    // =======================================

    if (interval === "5m") {
        const url =
            `https://api.upstox.com/v3/historical-candle/` +
            `intraday/${encodedInstrumentKey}/minutes/5`;

        const response = await upstoxClient.get(url);

        const candles = response.data?.data?.candles;

        if (!Array.isArray(candles)) {
            throw new Error(
                `Invalid intraday data response for ${symbol}`
            );
        }

        return candles;
    }

    // =======================================
    // HISTORICAL INTERVAL CONFIGURATION
    // =======================================

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
        intervalMap[interval] ||
        intervalMap["1d"];

    const toDate = new Date();
    const fromDate = new Date();

    fromDate.setMonth(
        fromDate.getMonth() -
        selectedInterval.monthsBack
    );

    // Format date as YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const url =
        `https://api.upstox.com/v3/historical-candle/` +
        `${encodedInstrumentKey}/` +
        `${selectedInterval.unit}/` +
        `${selectedInterval.value}/` +
        `${formatDate(toDate)}/` +
        `${formatDate(fromDate)}`;

    const response = await upstoxClient.get(url);

    const candles = response.data?.data?.candles;

    if (!Array.isArray(candles)) {
        throw new Error(
            `Invalid historical data response for ${symbol}`
        );
    }

    return candles;
};

// =======================================
// EXPORTS
// =======================================

module.exports = {
    searchStocks,
    getQuote,
    getHistoricalData
};
