
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
        console.log("RAW UPSTOX QUOTE:", JSON.stringify(stockData, null, 2));
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

    // Upstox may not return prev_ohlc.
    // Fetch daily candles to identify the previous
    // completed trading session.

    if (
        !Number.isFinite(previousClose) ||
        previousClose <= 0
    ) {
        const dailyCandles = await getHistoricalData(
            symbol,
            "1d"
        );

        const validDailyCandles = dailyCandles
            .filter((candle) => {
                const close = Number(candle[4]);

                return (
                    Array.isArray(candle) &&
                    Number.isFinite(close) &&
                    close > 0
                );
            })
            .sort(
                (a, b) =>
                    new Date(b[0]).getTime() -
                    new Date(a[0]).getTime()
            );

        if (validDailyCandles.length < 2) {
            throw new Error(
                `Insufficient daily candles to calculate previous close for ${symbol}`
            );
        }

        // Most recent completed session.
        const latestCompletedClose = Number(
            validDailyCandles[0][4]
        );

        // Previous trading session.
        const previousSessionClose = Number(
            validDailyCandles[1][4]
        );

        // Outside market hours, last_price can equal
        // the latest completed session's closing price.
        // Compare against the previous session close.
        previousClose = previousSessionClose;

        console.log("Daily candle reference:", {
            latestCompletedClose,
            previousSessionClose
        });
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
        // First, try today's intraday candles.
        const intradayUrl =
            `https://api.upstox.com/v3/historical-candle/` +
            `intraday/${encodedInstrumentKey}/minutes/5`;

        const intradayResponse = await upstoxClient.get(intradayUrl);

        const intradayCandles =
            intradayResponse.data?.data?.candles;

        if (!Array.isArray(intradayCandles)) {
            throw new Error(
                `Invalid intraday data response for ${symbol}`
            );
        }

        // If today's candles exist, use them.
        if (intradayCandles.length > 0) {
            return intradayCandles;
        }

        // Otherwise, fetch historical 5-minute candles.
        // This handles pre-market hours, weekends and holidays.
        const toDate = new Date();
        const fromDate = new Date();

        fromDate.setDate(fromDate.getDate() - 7);

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

        const historicalUrl =
            `https://api.upstox.com/v3/historical-candle/` +
            `${encodedInstrumentKey}/minutes/5/` +
            `${formatDate(toDate)}/` +
            `${formatDate(fromDate)}`;

        const historicalResponse =
            await upstoxClient.get(historicalUrl);

        const historicalCandles =
            historicalResponse.data?.data?.candles;

        if (!Array.isArray(historicalCandles)) {
            throw new Error(
                `Invalid historical intraday response for ${symbol}`
            );
        }

        console.log(
            `Using historical 5-minute candles for ${symbol}:`,
            historicalCandles.length
        );

        return historicalCandles;
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
