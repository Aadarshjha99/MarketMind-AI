const mockStocks = [
    {
        symbol: "TCS",
        companyName: "Tata Consultancy Services",
        exchange: "NSE",
        country: "India",
        currency: "INR"
    },
    {
        symbol: "INFY",
        companyName: "Infosys Limited",
        exchange: "NSE",
        country: "India",
        currency: "INR"
    },
    {
        symbol: "RELIANCE",
        companyName: "Reliance Industries Limited",
        exchange: "NSE",
        country: "India",
        currency: "INR"
    },
    {
        symbol: "HDFCBANK",
        companyName: "HDFC Bank Limited",
        exchange: "NSE",
        country: "India",
        currency: "INR"
    }
];

const searchStocks = async (query) => {
    if (!query) {
        return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    return mockStocks.filter((stock) =>
        stock.symbol.toLowerCase().includes(normalizedQuery) ||
        stock.companyName.toLowerCase().includes(normalizedQuery)
    );
};

const getQuote = async (symbol) => {
    const stock = mockStocks.find(
        (stock) => stock.symbol === symbol.toUpperCase()
    );

    if (!stock) {
        throw new Error("Stock not found");
    }

    return {
        symbol: stock.symbol,
        exchange: stock.exchange,
        currency: stock.currency,
        price: 3525.50,
        change: 42.75,
        changePercent: 1.23,
        previousClose: 3482.75,
        dayHigh: 3540.00,
        dayLow: 3470.25,
        volume: 1250000,
        timestamp: new Date().toISOString()
    };
};

const getHistoricalData = async (symbol) => {
    const stock = mockStocks.find(
        (stock) => stock.symbol === symbol.toUpperCase()
    );

    if (!stock) {
        throw new Error("Stock not found");
    }

    return [
        {
            datetime: "2026-09-15",
            open: 3450,
            high: 3500,
            low: 3430,
            close: 3480,
            volume: 1100000
        },
        {
            datetime: "2026-09-16",
            open: 3480,
            high: 3520,
            low: 3460,
            close: 3505,
            volume: 1180000
        },
        {
            datetime: "2026-09-17",
            open: 3505,
            high: 3540,
            low: 3485,
            close: 3520,
            volume: 1210000
        },
        {
            datetime: "2026-09-18",
            open: 3520,
            high: 3550,
            low: 3500,
            close: 3525.5,
            volume: 1250000
        }
    ];
};

module.exports = {
    searchStocks,
    getQuote,
    getHistoricalData
};