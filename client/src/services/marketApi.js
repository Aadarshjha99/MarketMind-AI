import api from "./api";

export const searchStocks = async (query) => {
    const response = await api.get(
        `/stocks/search?q=${encodeURIComponent(query)}`
    );

    return response.data;
};

export const getStockQuote = async (symbol) => {
    const response = await api.get(
        `/stocks/${encodeURIComponent(symbol)}/quote`
    );

    return response.data;
};

export const getStockHistory = async (symbol, interval = "1d") => {
    const response = await api.get(
        `/stocks/${encodeURIComponent(symbol)}/history`,
        {
            params: { interval }
        }
    );

    return response.data;
};

export const getStockTechnical = async (symbol) => {
    const response = await api.get(
        `/stocks/${encodeURIComponent(symbol)}/technical`
    );

    return response.data;
};

export const getStockPrediction = async (symbol) => {
    const normalizedSymbol = symbol
        .trim()
        .toUpperCase()
        .replace(/\.NS$/, "");

    const response = await api.get(
        `/stocks/${encodeURIComponent(normalizedSymbol)}/prediction`
    );

    if (!response.data.success) {
        throw new Error(
            response.data.message || "Unable to generate stock prediction."
        );
    }

    return response.data.data;
};

export const getStockNews = async (symbol) => {
    const response = await api.get(
        `/news/${encodeURIComponent(symbol)}`
    );

    return response.data;
};
