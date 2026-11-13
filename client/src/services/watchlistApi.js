
import api from "./api";

// Fetch the logged-in user's watchlist
export const getWatchlist = async () => {
    const response = await api.get("/watchlist");
    return response.data.data;
};

// Add a stock to the watchlist
export const addToWatchlist = async (symbol) => {
    const response = await api.post("/watchlist", { symbol });
    return response.data.data;
};

// Remove a stock from the watchlist
export const removeFromWatchlist = async (symbol) => {
    const response = await api.delete(
        `/watchlist/${encodeURIComponent(symbol)}`
    );

    return response.data;
};
