
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    BriefcaseBusiness,
    TrendingUp,
    TrendingDown,
    Wallet,
    Trash2,
    Minus,
    RefreshCw,
    X
} from "lucide-react";

import {
    getPortfolio,
    addHolding,
    reduceHolding,
    removeHolding
} from "../services/portfolioApi";

import { getStockQuote, searchStocks } from "../services/marketApi";

import "./Portfolio.css";

function Portfolio() {
    const navigate = useNavigate();

    const [holdings, setHoldings] = useState([]);
    const [quotes, setQuotes] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState("");

    const [formData, setFormData] = useState({
        symbol: "",
        companyName: "",
        quantity: "",
        buyPrice: ""
    });

    const [stockSuggestions, setStockSuggestions] = useState([]);
    const [searchingStocks, setSearchingStocks] = useState(false);
    const [selectedStock, setSelectedStock] = useState(false);

    const [reduceData, setReduceData] = useState(null);

    const loadPortfolio = useCallback(async () => {
        try {
            setError("");
            const data = await getPortfolio();
            setHoldings(data || []);

            const quoteResults = await Promise.allSettled(
                (data || []).map(async (holding) => {
                    const response = await getStockQuote(holding.symbol);

                    return {
                        symbol: holding.symbol,
                        quote: response.data
                    };
                })
            );

            const quoteMap = {};

            quoteResults.forEach((result) => {
                if (result.status === "fulfilled") {
                    quoteMap[result.value.symbol] = result.value.quote;
                }
            });

            setQuotes(quoteMap);
        } catch (err) {
            console.error("Portfolio loading error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to load portfolio. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadPortfolio();
    }, [loadPortfolio]);

    useEffect(() => {
        const query = formData.symbol.trim();

        if (!showModal || selectedStock || query.length < 2) {
            setStockSuggestions([]);
            setSearchingStocks(false);
            return;
        }

        let isActive = true;

        const timer = setTimeout(async () => {
            try {
                setSearchingStocks(true);

                const response = await searchStocks(query);

                if (isActive) {
                    setStockSuggestions(
                        (response.data || []).slice(0, 6)
                    );
                }
            } catch (err) {
                console.error("Stock search failed:", err);

                if (isActive) {
                    setStockSuggestions([]);
                }
            } finally {
                if (isActive) {
                    setSearchingStocks(false);
                }
            }
        }, 350);

        return () => {
            isActive = false;
            clearTimeout(timer);
        };
    }, [formData.symbol, showModal, selectedStock]);

    const totalInvestment = holdings.reduce(
        (total, item) =>
            total + item.quantity * item.averageBuyPrice,
        0
    );

    const currentValue = holdings.reduce((total, item) => {
        const livePrice = quotes[item.symbol]?.price;

        return total + item.quantity * (
            Number.isFinite(livePrice)
                ? livePrice
                : item.averageBuyPrice
        );
    }, 0);

    const totalPnL = currentValue - totalInvestment;

    const totalReturn = totalInvestment > 0
        ? (totalPnL / totalInvestment) * 100
        : 0;

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "symbol" ? { companyName: "" } : {})
        }));

        if (name === "symbol") {
            setSelectedStock(false);
        }
    };

    const handleStockSelect = (stock) => {
        setFormData((prev) => ({
            ...prev,
            symbol: stock.symbol,
            companyName: stock.companyName || ""
        }));

        setSelectedStock(true);
        setStockSuggestions([]);
    };

    const handleAddHolding = async (e) => {
        e.preventDefault();

        const quantity = Number(formData.quantity);
        const buyPrice = Number(formData.buyPrice);

        if (
            !formData.symbol.trim() ||
            !Number.isFinite(quantity) ||
            !Number.isFinite(buyPrice) ||
            quantity <= 0 ||
            buyPrice <= 0
        ) {
            alert("Please enter valid investment details.");
            return;
        }

        try {
            setSubmitting(true);

            await addHolding({
                symbol: formData.symbol.trim().toUpperCase(),
                companyName: formData.companyName.trim(),
                quantity,
                buyPrice
            });

            setFormData({
                symbol: "",
                companyName: "",
                quantity: "",
                buyPrice: ""
            });

            setShowModal(false);
            await loadPortfolio();
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Unable to add investment."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleReduceHolding = async (e) => {
        e.preventDefault();

        if (!reduceData) return;

        const quantity = Number(reduceData.quantity);

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0 ||
            quantity > reduceData.holding.quantity
        ) {
            alert("Please enter a valid quantity.");
            return;
        }

        try {
            setActionLoading(reduceData.holding.symbol);

            await reduceHolding(
                reduceData.holding.symbol,
                quantity
            );

            setReduceData(null);
            await loadPortfolio();
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Unable to update holding."
            );
        } finally {
            setActionLoading("");
        }
    };

    const handleRemoveHolding = async (symbol) => {
        const confirmed = window.confirm(
            `Remove ${symbol} completely from your portfolio?`
        );

        if (!confirmed) return;

        try {
            setActionLoading(symbol);
            await removeHolding(symbol);
            await loadPortfolio();
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Unable to remove holding."
            );
        } finally {
            setActionLoading("");
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(value || 0);

    const formatNumber = (value) =>
        new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 2
        }).format(value || 0);

    return (
        <div className="portfolio-page">

            {/* Header */}
            <div className="portfolio-header">
                <div>
                    <span className="portfolio-eyebrow">
                        INVESTMENT TRACKER
                    </span>

                    <h1>My Portfolio</h1>

                    <p>
                        Track your investments and monitor
                        portfolio performance.
                    </p>
                </div>

                <div className="portfolio-header-actions">
                    <button
                        className="portfolio-refresh-btn"
                        onClick={() => {
                            setRefreshing(true);
                            loadPortfolio();
                        }}
                        disabled={loading || refreshing}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        className="portfolio-add-btn"
                        onClick={() => setShowModal(true)}
                    >
                        <Plus size={18} />
                        Add Investment
                    </button>
                </div>
            </div>

            {error && (
                <div className="portfolio-error">
                    {error}
                    <button onClick={loadPortfolio}>
                        Retry
                    </button>
                </div>
            )}

            {/* Overview Cards */}
            <div className="portfolio-overview">

                <div className="portfolio-card">
                    <div className="portfolio-card-top">
                        <span>Total Investment</span>
                        <Wallet size={20} />
                    </div>

                    <h2>
                        {loading ? "—" : formatCurrency(totalInvestment)}
                    </h2>

                    <p>Amount invested</p>
                </div>

                <div className="portfolio-card">
                    <div className="portfolio-card-top">
                        <span>Current Value</span>
                        <BriefcaseBusiness size={20} />
                    </div>

                    <h2>
                        {loading ? "—" : formatCurrency(currentValue)}
                    </h2>

                    <p>Based on available market prices</p>
                </div>

                <div className="portfolio-card">
                    <div className="portfolio-card-top">
                        <span>Total Profit / Loss</span>
                        {totalPnL >= 0
                            ? <TrendingUp size={20} />
                            : <TrendingDown size={20} />
                        }
                    </div>

                    <h2 className={totalPnL >= 0 ? "positive" : "negative"}>
                        {loading ? "—" : formatCurrency(totalPnL)}
                    </h2>

                    <p>Overall unrealized P&L</p>
                </div>

                <div className="portfolio-card">
                    <div className="portfolio-card-top">
                        <span>Total Returns</span>
                        <TrendingUp size={20} />
                    </div>

                    <h2 className={totalReturn >= 0 ? "positive" : "negative"}>
                        {loading ? "—" : `${totalReturn.toFixed(2)}%`}
                    </h2>

                    <p>Return on investment</p>
                </div>

            </div>

            {/* Holdings */}
            <div className="portfolio-holdings-section">

                <div className="portfolio-section-header">
                    <div>
                        <h2>Your Holdings</h2>
                        <p>
                            {holdings.length} stocks in your portfolio
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="portfolio-empty">
                        Loading your holdings...
                    </div>
                ) : holdings.length === 0 ? (
                    <div className="portfolio-empty">
                        <BriefcaseBusiness size={38} />
                        <h3>Your portfolio is empty</h3>
                        <p>
                            Add your first investment to start
                            tracking your performance.
                        </p>

                        <button
                            className="portfolio-add-btn"
                            onClick={() => setShowModal(true)}
                        >
                            <Plus size={17} />
                            Add Your First Investment
                        </button>
                    </div>
                ) : (
                    <div className="portfolio-table-wrapper">
                        <table className="portfolio-table">
                            <thead>
                                <tr>
                                    <th>STOCK</th>
                                    <th>QUANTITY</th>
                                    <th>AVG. BUY PRICE</th>
                                    <th>CURRENT PRICE</th>
                                    <th>INVESTMENT</th>
                                    <th>PROFIT / LOSS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>

                            <tbody>
                                {holdings.map((item) => {
                                    const livePrice = quotes[item.symbol]?.price;

                                    const hasLivePrice =
                                        Number.isFinite(livePrice);

                                    const currentPrice = hasLivePrice
                                        ? livePrice
                                        : item.averageBuyPrice;

                                    const investment =
                                        item.quantity * item.averageBuyPrice;

                                    const value =
                                        item.quantity * currentPrice;

                                    const pnl = value - investment;

                                    const pnlPercent = investment > 0
                                        ? (pnl / investment) * 100
                                        : 0;

                                    return (
                                        <tr key={item._id}>
                                            <td>
                                                <div className="portfolio-stock">
                                                    <strong>{item.symbol}</strong>
                                                    <span>
                                                        {item.companyName || "—"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>{formatNumber(item.quantity)}</td>

                                            <td>
                                                {formatCurrency(item.averageBuyPrice)}
                                            </td>

                                            <td>
                                                {hasLivePrice
                                                    ? formatCurrency(currentPrice)
                                                    : "Unavailable"
                                                }
                                            </td>

                                            <td>{formatCurrency(investment)}</td>

                                            <td>
                                                <div className={
                                                    pnl >= 0
                                                        ? "portfolio-pnl positive"
                                                        : "portfolio-pnl negative"
                                                }>
                                                    <strong>
                                                        {formatCurrency(pnl)}
                                                    </strong>
                                                    <span>
                                                        {pnlPercent.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="portfolio-actions">
                                                    <button
                                                        title="Reduce shares"
                                                        disabled={!!actionLoading}
                                                        onClick={() => setReduceData({
                                                            holding: item,
                                                            quantity: ""
                                                        })}
                                                    >
                                                        <Minus size={16} />
                                                    </button>

                                                    <button
                                                        title="View stock"
                                                        onClick={() =>
                                                            navigate(
                                                                `/stocks/${encodeURIComponent(item.symbol)}`
                                                            )
                                                        }
                                                    >
                                                        <TrendingUp size={16} />
                                                    </button>

                                                    <button
                                                        title="Remove holding"
                                                        className="delete-action"
                                                        disabled={!!actionLoading}
                                                        onClick={() =>
                                                            handleRemoveHolding(item.symbol)
                                                        }
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Investment Modal */}
            {showModal && (
                <div
                    className="portfolio-modal-overlay"
                    onClick={() => !submitting && setShowModal(false)}
                >
                    <div
                        className="portfolio-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="portfolio-modal-header">
                            <div>
                                <h2>Add Investment</h2>
                                <p>Enter your existing stock purchase.</p>
                            </div>

                            <button
                                onClick={() => setShowModal(false)}
                                disabled={submitting}
                            >
                                <X size={20} />
                            </button>
                        </div>

                            <form onSubmit={handleAddHolding}>
                                <label>Search Stock</label>

                                <div className="portfolio-stock-search">
                                    <input
                                        name="symbol"
                                        value={formData.symbol}
                                        onChange={handleInputChange}
                                        placeholder="Search by stock name or symbol..."
                                        autoComplete="off"
                                        required
                                        maxLength={50}
                                    />

                                    {searchingStocks && (
                                        <span className="portfolio-search-status">
                                            Searching stocks...
                                        </span>
                                    )}

                                    {!searchingStocks && stockSuggestions.length > 0 && (
                                        <div className="portfolio-stock-suggestions">
                                            {stockSuggestions.map((stock) => (
                                                <button
                                                    type="button"
                                                    key={stock.instrumentKey || stock.symbol}
                                                    onClick={() => handleStockSelect(stock)}
                                                    className="portfolio-stock-suggestion"
                                                >
                                                    <div>
                                                        <strong>{stock.symbol}</strong>
                                                        <span>{stock.companyName}</span>
                                                    </div>

                                                    <small>{stock.exchange || "NSE"}</small>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {formData.companyName && (
                                    <div className="portfolio-selected-stock">
                                        Selected: {formData.companyName}
                                    </div>
                                )}

                            <div className="portfolio-form-row">
                                <div>
                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        placeholder="10"
                                        min="0.000001"
                                        step="any"
                                        required
                                    />
                                </div>

                                <div>
                                    <label>Average Buy Price (₹)</label>
                                    <input
                                        type="number"
                                        name="buyPrice"
                                        value={formData.buyPrice}
                                        onChange={handleInputChange}
                                        placeholder="3000"
                                        min="0.01"
                                        step="any"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="portfolio-submit-btn"
                                disabled={submitting}
                            >
                                {submitting
                                    ? "Adding..."
                                    : "Add to Portfolio"
                                }
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Reduce Shares Modal */}
            {reduceData && (
                <div
                    className="portfolio-modal-overlay"
                    onClick={() => setReduceData(null)}
                >
                    <div
                        className="portfolio-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="portfolio-modal-header">
                            <div>
                                <h2>Reduce Holdings</h2>
                                <p>
                                    {reduceData.holding.symbol} ·
                                    {" "}Available: {reduceData.holding.quantity}
                                </p>
                            </div>

                            <button onClick={() => setReduceData(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleReduceHolding}>
                            <label>Quantity to remove</label>

                            <input
                                type="number"
                                min="0.000001"
                                max={reduceData.holding.quantity}
                                step="any"
                                value={reduceData.quantity}
                                onChange={(e) =>
                                    setReduceData((prev) => ({
                                        ...prev,
                                        quantity: e.target.value
                                    }))
                                }
                                placeholder="Enter quantity"
                                required
                            />

                            <button
                                type="submit"
                                className="portfolio-submit-btn"
                                disabled={!!actionLoading}
                            >
                                {actionLoading
                                    ? "Updating..."
                                    : "Update Holdings"
                                }
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Portfolio;
