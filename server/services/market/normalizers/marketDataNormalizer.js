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
    return data.map((item) => ({
        datetime: item.datetime,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
        volume: Number(item.volume)
    }));
};

module.exports = {
    normalizeQuote,
    normalizeHistoricalData
};