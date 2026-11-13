
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Search,
    Star,
    Trash2,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Plus,
    ExternalLink
} from "lucide-react";

import {
    searchStocks,
    getStockQuote
} from "../services/marketApi";

import {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist
} from "../services/watchlistApi";

import "./Watchlist.css";

function Watchlist() {
    const navigate = useNavigate();

    const [watchlist, setWatchlist] = useState([]);
    const [quotes, setQuotes] = useState({});

    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [addingSymbol, setAddingSymbol] = useState("");
    const [removingSymbol, setRemovingSymbol] = useState("");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Fetch saved stocks and their latest quotes.
    const loadWatchlist = useCallback(async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const items = await getWatchlist();

            setWatchlist(items);

            if (items.length === 0) {
                setQuotes({});
                return;
            }

            const quoteResults = await Promise.all(
                items.map(async (item) => {
                    try {
                        const response = await getStockQuote(item.symbol);

                        return {
                            symbol: item.symbol,
                            quote: response.data
                        };
                    } catch (err) {
                        console.error(
                            `Quote failed for ${item.symbol}:`,
                            err
                        );

                        return {
                            symbol: item.symbol,
                            quote: null
                        };
                    }
                })
            );

            const quoteMap = {};

            quoteResults.forEach(({ symbol, quote }) => {
                quoteMap[symbol] = quote;
            });

            setQuotes(quoteMap);

        } catch (err) {
            console.error("Watchlist loading error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load your watchlist."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadWatchlist();
    }, [loadWatchlist]);

    // Search stocks with a debounce.
    useEffect(() => {
        let active = true;

        if (!search.trim()) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearchLoading(true);

                const response = await searchStocks(search.trim());

                if (active) {
                    setSearchResults(response.data || []);
                }
            } catch (err) {
                console.error("Stock search failed:", err);

                if (active) {
                    setSearchResults([]);
                }
            } finally {
                if (active) {
                    setSearchLoading(false);
                }
            }
        }, 400);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [search]);

    // Add stock.
    const handleAddStock = async (stock) => {
        const symbol = stock.symbol;

        try {
            setAddingSymbol(symbol);
            setError("");
            setMessage("");

            await addToWatchlist(symbol);

            setSearch("");
            setSearchResults([]);

            setMessage(`${symbol} added to your watchlist.`);

            await loadWatchlist(true);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to add this stock."
            );
        } finally {
            setAddingSymbol("");
        }
    };

    // Remove stock.
    const handleRemoveStock = async (symbol) => {
        try {
            setRemovingSymbol(symbol);
            setError("");
            setMessage("");

            await removeFromWatchlist(symbol);

            setWatchlist((prev) =>
                prev.filter((item) => item.symbol !== symbol)
            );

            setQuotes((prev) => {
                const updated = { ...prev };
                delete updated[symbol];
                return updated;
            });

            setMessage(`${symbol} removed from your watchlist.`);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to remove this stock."
            );
        } finally {
            setRemovingSymbol("");
        }
    };

    const formatPrice = (value) => {
        if (value === undefined || value === null) {
            return "--";
        }

        return `₹${Number(value).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatNumber = (value) => {
        if (value === undefined || value === null) {
            return "--";
        }

        return Number(value).toLocaleString("en-IN");
    };

    const totalStocks = watchlist.length;

    const positiveStocks = watchlist.filter(
        (item) => (quotes[item.symbol]?.change ?? 0) > 0
    ).length;

    const negativeStocks = watchlist.filter(
        (item) => (quotes[item.symbol]?.change ?? 0) < 0
    ).length;

    const isAlreadyAdded = (symbol) =>
        watchlist.some((item) => item.symbol === symbol);

    return (
        <div className="watchlist-page">

            {/* Header */}
            <section className="watchlist-header">

                <div>
                    <p className="watchlist-eyebrow">
                        PERSONAL WORKSPACE
                    </p>

                    <h2>My Watchlist</h2>

                    <p>
                        Keep track of the stocks that matter to you.
                    </p>
                </div>

                <button
                    className="watchlist-refresh-button"
                    onClick={() => loadWatchlist(true)}
                    disabled={refreshing || loading}
                >
                    <RefreshCw
                        size={15}
                        className={refreshing ? "refresh-spinning" : ""}
                    />
                    Refresh
                </button>

            </section>

            {/* Overview Cards */}
            <section className="watchlist-overview">

                <div className="watchlist-stat-card">
                    <div className="watchlist-stat-icon blue">
                        <Star size={19} />
                    </div>

                    <div>
                        <span>Total Stocks</span>
                        <strong>{totalStocks}</strong>
                    </div>
                </div>

                <div className="watchlist-stat-card">
                    <div className="watchlist-stat-icon green">
                        <TrendingUp size={19} />
                    </div>

                    <div>
                        <span>Advancing</span>
                        <strong>{positiveStocks}</strong>
                    </div>
                </div>

                <div className="watchlist-stat-card">
                    <div className="watchlist-stat-icon red">
                        <TrendingDown size={19} />
                    </div>

                    <div>
                        <span>Declining</span>
                        <strong>{negativeStocks}</strong>
                    </div>
                </div>

            </section>

            {/* Search */}
            <section className="watchlist-search-section">

                <div className="watchlist-section-heading">
                    <div>
                        <h3>Add stocks</h3>
                        <p>Search and add stocks to your personal watchlist.</p>
                    </div>
                </div>

                <div className="watchlist-search-wrapper">

                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search stocks or companies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="watchlist-clear-search"
                        >
                            Clear
                        </button>
                    )}

                </div>

                {search.trim() && (
                    <div className="watchlist-search-results">

                        {searchLoading && (
                            <div className="watchlist-search-message">
                                Searching stocks...
                            </div>
                        )}

                        {!searchLoading && searchResults.length === 0 && (
                            <div className="watchlist-search-message">
                                No stocks found.
                            </div>
                        )}

                        {!searchLoading && searchResults.map((stock) => {
                            const added = isAlreadyAdded(stock.symbol);

                            return (
                                <div
                                    className="watchlist-search-result"
                                    key={stock.instrumentKey || stock.symbol}
                                >
                                    <div className="watchlist-result-info">
                                        <strong>{stock.symbol}</strong>
                                        <span>{stock.companyName}</span>
                                        <small>{stock.exchange}</small>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={added || addingSymbol === stock.symbol}
                                        onClick={() => handleAddStock(stock)}
                                        className={added
                                            ? "watchlist-added-button"
                                            : "watchlist-add-button"
                                        }
                                    >
                                        {added ? (
                                            "Added"
                                        ) : addingSymbol === stock.symbol ? (
                                            "Adding..."
                                        ) : (
                                            <>
                                                <Plus size={15} />
                                                Add
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}

                    </div>
                )}

            </section>

            {/* Feedback */}
            {error && (
                <div className="watchlist-alert error">
                    {error}
                </div>
            )}

            {message && (
                <div className="watchlist-alert success">
                    {message}
                </div>
            )}

            {/* Watchlist Table */}
            <section className="watchlist-table-card">

                <div className="watchlist-table-header">
                    <div>
                        <span>YOUR SAVED STOCKS</span>
                        <h3>Tracked Stocks</h3>
                    </div>

                    <span className="watchlist-count">
                        {totalStocks} stocks
                    </span>
                </div>

                {loading ? (
                    <div className="watchlist-state">
                        <RefreshCw size={23} className="refresh-spinning" />
                        <p>Loading your watchlist...</p>
                    </div>
                ) : error && watchlist.length === 0 ? (
                    <div className="watchlist-state">
                        <Star size={28} />
                        <p>Unable to load your watchlist.</p>
                        <button onClick={() => loadWatchlist()}>
                            Try again
                        </button>
                    </div>
                ) : watchlist.length === 0 ? (
                    <div className="watchlist-state">
                        <div className="watchlist-empty-icon">
                            <Star size={27} />
                        </div>

                        <h3>Your watchlist is empty</h3>

                        <p>
                            Search for your favourite stocks above
                            and add them to start tracking.
                        </p>
                    </div>
                ) : (
                    <div className="watchlist-table">

                        <div className="watchlist-row watchlist-table-heading">
                            <span>STOCK</span>
                            <span>PRICE</span>
                            <span>CHANGE</span>
                            <span>VOLUME</span>
                            <span>ACTION</span>
                        </div>

                        {watchlist.map((item) => {
                            const quote = quotes[item.symbol];

                            const change = quote?.change ?? 0;
                            const changePercent = quote?.changePercent ?? 0;
                            const positive = change >= 0;

                            return (
                                <div
                                    className="watchlist-row watchlist-stock-row"
                                    key={item._id || item.symbol}
                                >

                                    <div className="watchlist-stock-info">
                                        <div className="watchlist-stock-avatar">
                                            {item.symbol.slice(0, 2)}
                                        </div>

                                        <div>
                                            <strong>{item.symbol}</strong>
                                            <span>Saved stock</span>
                                        </div>
                                    </div>

                                    <strong className="watchlist-price">
                                        {formatPrice(quote?.price)}
                                    </strong>

                                    <div className={`watchlist-change ${positive ? "positive" : "negative"}`}>
                                        {positive ? (
                                            <ArrowUpRight size={15} />
                                        ) : (
                                            <ArrowDownRight size={15} />
                                        )}

                                        <div>
                                            <strong>
                                                {quote
                                                    ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}`
                                                    : "--"}
                                            </strong>

                                            <span>
                                                {quote
                                                    ? `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`
                                                    : "--"}
                                            </span>
                                        </div>
                                    </div>

                                    <span className="watchlist-volume">
                                        {formatNumber(quote?.volume)}
                                    </span>

                                    <div className="watchlist-actions">

                                        <button
                                            type="button"
                                            title="View stock details"
                                            onClick={() =>
                                                navigate(`/stocks/${encodeURIComponent(item.symbol)}`)
                                            }
                                        >
                                            <ExternalLink size={16} />
                                        </button>

                                        <button
                                            type="button"
                                            title="Remove from watchlist"
                                            className="watchlist-delete-button"
                                            disabled={removingSymbol === item.symbol}
                                            onClick={() => handleRemoveStock(item.symbol)}
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}

            </section>

            <p className="watchlist-disclaimer">
                Market prices are provided by your connected market data API.
                Data availability may vary.
            </p>

        </div>
    );
}

export default Watchlist;
