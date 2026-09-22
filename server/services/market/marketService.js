const mockProvider = require("./providers/mockProvider");
const upstoxProvider = require("./providers/upstoxProvider");

const {
    normalizeQuote,
    normalizeHistoricalData
} = require("./normalizers/marketDataNormalizer");

const providers = {
    mock: mockProvider,
    upstox: upstoxProvider
};

const activeProviderName =
    process.env.MARKET_DATA_PROVIDER || "mock";

const activeProvider = providers[activeProviderName];

if (!activeProvider) {
    throw new Error(
        `Unsupported market data provider: ${activeProviderName}`
    );
}

const searchStocks = async (query) => {
    return activeProvider.searchStocks(query);
};

const getQuote = async (symbol) => {
    const quote = await activeProvider.getQuote(symbol);

    return normalizeQuote(quote);
};

const getHistoricalData = async (symbol, interval) => {
    const data = await activeProvider.getHistoricalData(
        symbol,
        interval
    );

    return normalizeHistoricalData(data);
};

module.exports = {
    searchStocks,
    getQuote,
    getHistoricalData
};