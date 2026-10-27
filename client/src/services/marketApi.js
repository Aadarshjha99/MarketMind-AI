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

export const getStockHistory = async (symbol) => {
    const response = await api.get(
        `/stocks/${encodeURIComponent(symbol)}/history`
    );

    return response.data;
};

export const getStockTechnical = async (symbol) => {
    const response = await api.get(
        `/stocks/${encodeURIComponent(symbol)}/technical`
    );

    return response.data;
};