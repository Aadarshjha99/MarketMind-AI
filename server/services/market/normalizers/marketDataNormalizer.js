const normalizeQuote = (quote) => {
    return {
        symbol: quote.symbol,
        exchange: quote.exchange,
        currency: quote.currency,
        price: Number(quote.price),
        change: Number(quote.change),
        changePercent: Number(quote.changePercent),
        previousClose: Number(quote.previousClose),
        dayHigh: Number(quote.dayHigh),
        dayLow: Number(quote.dayLow),
        volume: Number(quote.volume),
        timestamp: quote.timestamp
    };
};


const normalizeHistoricalData = (data) => {
    if (!Array.isArray(data)) {
        throw new Error(
            "Historical data must be an array of candles"
        );
    }

    return data.map((item) => {
        // Upstox V3 format:
        // [timestamp, open, high, low, close, volume, openInterest]

        if (Array.isArray(item)) {
            return {
                datetime: item[0],
                open: Number(item[1]),
                high: Number(item[2]),
                low: Number(item[3]),
                close: Number(item[4]),
                volume: Number(item[5] ?? 0),
                openInterest: Number(item[6] ?? 0)
            };
        }

        // Object-based format for other providers
        return {
            datetime: item.datetime ?? item.timestamp,
            open: Number(item.open),
            high: Number(item.high),
            low: Number(item.low),
            close: Number(item.close),
            volume: Number(item.volume ?? 0),
            openInterest: Number(item.openInterest ?? 0)
        };
    });
};


module.exports = {
    normalizeQuote,
    normalizeHistoricalData
};
