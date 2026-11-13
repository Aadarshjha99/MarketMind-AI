
import api from "./api";

// Fetch all portfolio holdings
export const getPortfolio = async () => {
    const response = await api.get("/portfolio");
    return response.data.data;
};

// Add shares to portfolio
export const addHolding = async (holdingData) => {
    const response = await api.post("/portfolio", holdingData);
    return response.data;
};

// Reduce shares from portfolio
export const reduceHolding = async (symbol, quantity) => {
    const response = await api.patch(
        `/portfolio/${encodeURIComponent(symbol)}/reduce`,
        { quantity }
    );

    return response.data;
};

// Remove stock completely from portfolio
export const removeHolding = async (symbol) => {
    const response = await api.delete(
        `/portfolio/${encodeURIComponent(symbol)}`
    );

    return response.data;
};
