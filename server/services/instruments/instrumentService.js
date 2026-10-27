
const upstoxClient = require("../upstox/upstoxClient");

const instrumentCache = new Map();

const searchInstruments = async (query) => {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
        return [];
    }

    const response = await upstoxClient.get("/instruments/search", {
        params: {
            query: normalizedQuery,
            exchanges: "NSE",
            segments: "EQ",
            page_number: 1,
            records: 30
        }
    });

    const instruments = response.data.data || [];

    return instruments
        .filter(
            (instrument) =>
                instrument.segment === "NSE_EQ" &&
                instrument.instrument_type === "EQ"
        )
        .map((instrument) => ({
            symbol: instrument.trading_symbol,
            companyName: instrument.name,
            exchange: instrument.exchange,
            isin: instrument.isin,
            instrumentKey: instrument.instrument_key
        }));
};

const getInstrumentBySymbol = async (symbol) => {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!normalizedSymbol) {
        throw new Error("Stock symbol is required");
    }

    if (instrumentCache.has(normalizedSymbol)) {
        return instrumentCache.get(normalizedSymbol);
    }

    const instruments = await searchInstruments(normalizedSymbol);

    const instrument = instruments.find(
        (item) => item.symbol.toUpperCase() === normalizedSymbol
    );

    if (!instrument) {
        throw new Error(
            `NSE equity not found for symbol: ${normalizedSymbol}`
        );
    }

    instrumentCache.set(normalizedSymbol, instrument);

    return instrument;
};

module.exports = {
    searchInstruments,
    getInstrumentBySymbol
};