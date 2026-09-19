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

    const data = [];

    let price = 3200;

    const startDate = new Date("2026-06-12");

    for (let i = 0; i < 100; i++) {
        const date = new Date(startDate);

        date.setDate(
            startDate.getDate() + i
        );

        // Deterministic movement for testing
        const movement =
            Math.sin(i / 5) * 20 +
            (i % 7 - 3) * 4;

        const open = price;

        const close =
            price + movement;

        const high =
            Math.max(open, close) + 12;

        const low =
            Math.min(open, close) - 12;

        const volume =
            900000 + (i * 1375);

        data.push({
            datetime: date
                .toISOString()
                .split("T")[0],

            open: Number(open.toFixed(2)),
            high: Number(high.toFixed(2)),
            low: Number(low.toFixed(2)),
            close: Number(close.toFixed(2)),
            volume
        });

        price = close;
    }

    return data;
};

module.exports = {
    searchStocks,
    getQuote,
    getHistoricalData
};