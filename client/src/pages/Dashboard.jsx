
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    TrendingDown,
    Activity,
    Star,
    Newspaper,
    Sparkles
} from "lucide-react";

import {
    getStockQuote,
    getStockHistory,
    getStockNews
} from "../services/marketApi";

import { getWatchlist } from "../services/watchlistApi";

import "./Dashboard.css";

const unwrap = (response) => response?.data ?? response;

const formatPrice = (price) => {
    if (!Number.isFinite(Number(price))) return "—";

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(price));
};

const formatChange = (change) => {
    const value = Number(change);

    if (!Number.isFinite(value)) return "—";

    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const formatTime = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "Date unavailable";
    }

    return parsed.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
};

function Dashboard() {
    const navigate = useNavigate();

    const [watchlist, setWatchlist] = useState([]);
    const [quotes, setQuotes] = useState({});
    const [news, setNews] = useState([]);
    const [history, setHistory] = useState([]);

    const [watchlistLoading, setWatchlistLoading] = useState(true);
    const [quotesLoading, setQuotesLoading] = useState(false);
    const [newsLoading, setNewsLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [watchlistError, setWatchlistError] = useState("");
    const [newsError, setNewsError] = useState("");
    const [historyError, setHistoryError] = useState("");

    const [period, setPeriod] = useState("1D");

    // --------------------------------
    // Load user's watchlist
    // --------------------------------

    useEffect(() => {
        let cancelled = false;

        const loadWatchlist = async () => {
            try {
                setWatchlistLoading(true);
                setWatchlistError("");

                const response = await getWatchlist();
                const stocks = Array.isArray(response) ? response : [];

                if (!cancelled) {
                    setWatchlist(stocks);
                }
            } catch (error) {
                console.error("Dashboard watchlist error:", error);

                if (!cancelled) {
                    setWatchlistError(
                        "Unable to load your watchlist."
                    );
                }
            } finally {
                if (!cancelled) {
                    setWatchlistLoading(false);
                }
            }
        };

        loadWatchlist();

        return () => {
            cancelled = true;
        };
    }, []);

    // --------------------------------
    // Load live quotes
    // --------------------------------

    useEffect(() => {
        let cancelled = false;

        const loadQuotes = async () => {
            if (!watchlist.length) {
                setQuotes({});
                return;
            }

            try {
                setQuotesLoading(true);

                const results = await Promise.all(
                    watchlist.map(async (stock) => {
                        try {
                            const response = await getStockQuote(
                                stock.symbol
                            );

                            return [
                                stock.symbol,
                                unwrap(response)
                            ];
                        } catch (error) {
                            console.error(
                                `Quote error for ${stock.symbol}:`,
                                error
                            );

                            return [stock.symbol, null];
                        }
                    })
                );

                if (!cancelled) {
                    setQuotes(Object.fromEntries(results));
                }
            } finally {
                if (!cancelled) {
                    setQuotesLoading(false);
                }
            }
        };

        loadQuotes();

        return () => {
            cancelled = true;
        };
    }, [watchlist]);

    // --------------------------------
    // Load news for watchlist stocks
    // --------------------------------

    useEffect(() => {
        let cancelled = false;

        const loadNews = async () => {
            if (!watchlist.length) {
                setNews([]);
                return;
            }

            try {
                setNewsLoading(true);
                setNewsError("");

                const results = await Promise.all(
                    watchlist.map(async (stock) => {
                        try {
                            const response = await getStockNews(
                                stock.symbol
                            );

                            const articles = unwrap(response);

                            return Array.isArray(articles)
                                ? articles.map((article) => ({
                                    ...article,
                                    symbol: stock.symbol
                                }))
                                : [];
                        } catch (error) {
                            console.error(
                                `News error for ${stock.symbol}:`,
                                error
                            );

                            return [];
                        }
                    })
                );

                const combined = results
                    .flat()
                    .filter((article) => article.title);

                // Remove duplicate articles
                const unique = Array.from(
                    new Map(
                        combined.map((article) => [
                            article.url || article._id || article.title,
                            article
                        ])
                    ).values()
                );

                unique.sort(
                    (a, b) =>
                        new Date(b.publishedAt || 0) -
                        new Date(a.publishedAt || 0)
                );

                if (!cancelled) {
                    setNews(unique.slice(0, 8));
                }
            } catch (error) {
                console.error("Dashboard news error:", error);

                if (!cancelled) {
                    setNewsError("Unable to load stock news.");
                }
            } finally {
                if (!cancelled) {
                    setNewsLoading(false);
                }
            }
        };

        loadNews();

        return () => {
            cancelled = true;
        };
    }, [watchlist]);

    // --------------------------------
    // Load historical data for first
    // tracked stock
    // --------------------------------

    const chartStock = watchlist[0];

    useEffect(() => {
        let cancelled = false;

        const loadHistory = async () => {
            if (!chartStock?.symbol) {
                setHistory([]);
                return;
            }

            try {
                setHistoryLoading(true);
                setHistoryError("");

                const interval = period === "1D" ? "5m" : "1d";

                const response = await getStockHistory(
                    chartStock.symbol,
                    interval
                );

                const result = unwrap(response);

                const candles = Array.isArray(result)
                    ? result
                    : result?.candles || result?.history || [];

                if (!cancelled) {
                    setHistory(candles);
                }
            } catch (error) {
                console.error("Dashboard history error:", error);

                if (!cancelled) {
                    setHistory([]);
                    setHistoryError(
                        "Historical data is currently unavailable."
                    );
                }
            } finally {
                if (!cancelled) {
                    setHistoryLoading(false);
                }
            }
        };

        loadHistory();

        return () => {
            cancelled = true;
        };
    }, [chartStock?.symbol, period]);

    // --------------------------------
    // Calculate dashboard statistics
    // --------------------------------

    const quoteList = Object.values(quotes).filter(Boolean);

    const advancing = quoteList.filter(
        (quote) => Number(quote.changePercent) > 0
    ).length;

    const declining = quoteList.filter(
        (quote) => Number(quote.changePercent) < 0
    ).length;

    const unchanged = quoteList.filter(
        (quote) => Number(quote.changePercent) === 0
    ).length;

    const sentimentCounts = useMemo(() => {
        return news.reduce(
            (counts, article) => {
                const sentiment = article.sentiment?.toLowerCase();

                if (sentiment === "positive") {
                    counts.positive++;
                } else if (sentiment === "negative") {
                    counts.negative++;
                } else {
                    counts.neutral++;
                }

                return counts;
            },
            { positive: 0, negative: 0, neutral: 0 }
        );
    }, [news]);

    const totalSentiment =
        sentimentCounts.positive +
        sentimentCounts.negative +
        sentimentCounts.neutral;

    const sentimentScore = totalSentiment
        ? Math.round(
            (
                sentimentCounts.positive * 100 +
                sentimentCounts.neutral * 50
            ) / totalSentiment
        )
        : null;

    const sentimentLabel =
        sentimentScore === null
            ? "Unavailable"
            : sentimentScore >= 65
                ? "Positive news sentiment"
                : sentimentScore <= 35
                    ? "Negative news sentiment"
                    : "Mixed news sentiment";

    const sentimentDescription = totalSentiment
        ? `Based on ${totalSentiment} available news articles from your tracked stocks.`
        : "No classified news articles are currently available.";

    // --------------------------------
    // Chart data
    // --------------------------------

    const validHistory = history
        .filter(
            (candle) =>
                candle.datetime &&
                Number.isFinite(Number(candle.close))
        )
        .sort(
            (a, b) =>
                new Date(a.datetime) - new Date(b.datetime)
        );

    const periodDays = {
        "1D": 1,
        "1W": 7,
        "1M": 30,
        "1Y": 365
    };

    const filteredHistory = validHistory.filter((candle) => {
        const cutoff = new Date();

        cutoff.setDate(
            cutoff.getDate() - periodDays[period]
        );

        return new Date(candle.datetime) >= cutoff;
    });

    const chartValues = filteredHistory.map(
        (candle) => Number(candle.close)
    );

    const chartMin = chartValues.length
        ? Math.min(...chartValues)
        : 0;

    const chartMax = chartValues.length
        ? Math.max(...chartValues)
        : 0;

    const chartRange = chartMax - chartMin || 1;

    const chartPoints = chartValues.map((price, index) => {
        const x = chartValues.length === 1
            ? 400
            : (index / (chartValues.length - 1)) * 800;

        const y = 230 - (
            (price - chartMin) / chartRange
        ) * 190;

        return { x, y };
    });

    const chartPath = chartPoints
        .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
        )
        .join(" ");

    const areaPath = chartPath
        ? `${chartPath} L 800 260 L 0 260 Z`
        : "";

    // --------------------------------
    // Render
    // --------------------------------

    return (
        <div className="dashboard">

            <section className="dashboard-header">
                <div>
                    <p className="dashboard-eyebrow">
                        MARKET OVERVIEW
                    </p>

                    <h2>Welcome back</h2>

                    <p className="dashboard-subtitle">
                        Here's what's happening with your tracked stocks.
                    </p>
                </div>

                <div className="market-status">
                    <span className="market-status-dot"></span>
                    Live data
                </div>
            </section>

            {/* Dynamic overview cards */}

            <section className="market-cards">

                {[
                    {
                        name: "Tracked Stocks",
                        value: watchlistLoading ? "..." : watchlist.length,
                        icon: <Star size={16} />
                    },
                    {
                        name: "Advancing",
                        value: quotesLoading ? "..." : advancing,
                        icon: <TrendingUp size={16} />,
                        positive: true
                    },
                    {
                        name: "Declining",
                        value: quotesLoading ? "..." : declining,
                        icon: <TrendingDown size={16} />,
                        positive: false
                    },
                    {
                        name: "News Articles",
                        value: newsLoading ? "..." : news.length,
                        icon: <Newspaper size={16} />
                    }
                ].map((item) => (
                    <div className="market-card" key={item.name}>
                        <div className="market-card-top">
                            <span>{item.name}</span>
                            {item.icon}
                        </div>

                        <div className="market-value">
                            {item.value}
                        </div>
                    </div>
                ))}

            </section>

            {/* Main Grid */}

            <section className="dashboard-grid">

                {/* Real stock chart */}

                <div className="dashboard-card performance-card">

                    <div className="card-header">
                        <div>
                            <span className="card-label">
                                TRACKED STOCK PERFORMANCE
                            </span>

                            <h3>
                                {chartStock
                                    ? `${chartStock.symbol} Trend`
                                    : "Stock Trend"}
                            </h3>
                        </div>

                        <div className="chart-periods">
                            {["1D", "1W", "1M", "1Y"].map((value) => (
                                <button
                                    key={value}
                                    className={
                                        period === value ? "active" : ""
                                    }
                                    onClick={() => setPeriod(value)}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    </div>

                    {historyLoading ? (
                        <div className="dashboard-data-message">
                            Loading historical prices...
                        </div>
                    ) : historyError ? (
                        <div className="dashboard-data-message">
                            {historyError}
                        </div>
                    ) : chartPoints.length === 0 ? (
                        <div className="dashboard-data-message">
                            {chartStock
                                ? "No historical price data available."
                                : "Add stocks to your watchlist to see their price trends."}
                        </div>
                    ) : (
                        <div className="chart-area">

                            <div className="chart-y-axis">
                                <span>{formatPrice(chartMax)}</span>
                                <span>
                                    {formatPrice((chartMax + chartMin) / 2)}
                                </span>
                                <span>{formatPrice(chartMin)}</span>
                            </div>

                            <div className="chart-placeholder">

                                <svg
                                    viewBox="0 0 800 260"
                                    preserveAspectRatio="none"
                                >
                                    <defs>
                                        <linearGradient
                                            id="dashboardChartGradient"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#4F8CFF"
                                                stopOpacity="0.22"
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#4F8CFF"
                                                stopOpacity="0"
                                            />
                                        </linearGradient>
                                    </defs>

                                    <path
                                        d={areaPath}
                                        fill="url(#dashboardChartGradient)"
                                    />

                                    <path
                                        d={chartPath}
                                        fill="none"
                                        stroke="#4F8CFF"
                                        strokeWidth="2.5"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </svg>

                                <div className="chart-x-axis">
                                    <span>
                                        {formatTime(
                                            filteredHistory[0]?.datetime
                                        )}
                                    </span>
                                    <span>
                                        {formatTime(
                                            filteredHistory[
                                                Math.floor(
                                                    filteredHistory.length / 2
                                                )
                                            ]?.datetime
                                        )}
                                    </span>
                                    <span>
                                        {formatTime(
                                            filteredHistory[
                                                filteredHistory.length - 1
                                            ]?.datetime
                                        )}
                                    </span>
                                </div>

                            </div>
                        </div>
                    )}

                </div>

                {/* Actual news sentiment */}

                <div className="dashboard-card sentiment-card">

                    <div className="card-header">
                        <div>
                            <span className="card-label">
                                AI NEWS ANALYSIS
                            </span>

                            <h3>News Sentiment</h3>
                        </div>

                        <Sparkles size={19} className="ai-icon" />
                    </div>

                    <div className="sentiment-content">

                        <div className="sentiment-score">
                            <span>
                                {sentimentScore ?? "—"}
                            </span>
                            <small>/ 100</small>
                        </div>

                        <div className="sentiment-label">
                            <span className="sentiment-dot"></span>
                            {sentimentLabel}
                        </div>

                        <p>{sentimentDescription}</p>

                        <div className="sentiment-bar">
                            <div
                                style={{
                                    width: `${sentimentScore ?? 0}%`
                                }}
                            />
                        </div>

                        <div className="dashboard-sentiment-breakdown">
                            <span>
                                Positive: {sentimentCounts.positive}
                            </span>
                            <span>
                                Neutral: {sentimentCounts.neutral}
                            </span>
                            <span>
                                Negative: {sentimentCounts.negative}
                            </span>
                        </div>

                    </div>
                </div>

            </section>

            {/* Bottom Grid */}

            <section className="bottom-grid">

                {/* Actual Watchlist */}

                <div className="dashboard-card watchlist-card">

                    <div className="card-header">
                        <div>
                            <span className="card-label">
                                YOUR WATCHLIST
                            </span>

                            <h3>Tracked Stocks</h3>
                        </div>

                        <Star size={18} className="card-icon" />
                    </div>

                    <div className="stock-list">

                        {watchlistLoading ? (
                            <div className="dashboard-data-message">
                                Loading your watchlist...
                            </div>
                        ) : watchlistError ? (
                            <div className="dashboard-data-message">
                                {watchlistError}
                            </div>
                        ) : watchlist.length === 0 ? (
                            <div className="dashboard-data-message">
                                Your watchlist is empty. Add stocks from Markets.
                            </div>
                        ) : (
                            watchlist.map((stock) => {
                                const quote = quotes[stock.symbol];
                                const change = Number(quote?.changePercent);

                                return (
                                    <div
                                        className="stock-row dashboard-clickable"
                                        key={stock.symbol}
                                        onClick={() =>
                                            navigate(`/stocks/${encodeURIComponent(stock.symbol)}`)
                                        }
                                    >
                                        <div className="stock-identity">
                                            <div className="stock-symbol">
                                                {stock.symbol}
                                            </div>

                                            <span>
                                                {stock.companyName || stock.symbol}
                                            </span>
                                        </div>

                                        <div className="stock-price">
                                            <strong>
                                                {quote
                                                    ? formatPrice(quote.price)
                                                    : "—"}
                                            </strong>

                                            <span
                                                className={
                                                    Number.isFinite(change)
                                                        ? change >= 0
                                                            ? "positive"
                                                            : "negative"
                                                        : ""
                                                }
                                            >
                                                {quote
                                                    ? formatChange(change)
                                                    : "Quote unavailable"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                    </div>

                </div>

                {/* Actual news */}

                <div className="dashboard-card news-card">

                    <div className="card-header">
                        <div>
                            <span className="card-label">
                                MARKET INTELLIGENCE
                            </span>

                            <h3>Latest News</h3>
                        </div>

                        <Newspaper size={18} className="card-icon" />
                    </div>

                    <div className="news-list">

                        {newsLoading ? (
                            <div className="dashboard-data-message">
                                Loading latest news...
                            </div>
                        ) : newsError ? (
                            <div className="dashboard-data-message">
                                {newsError}
                            </div>
                        ) : news.length === 0 ? (
                            <div className="dashboard-data-message">
                                No news is currently available for your tracked stocks.
                            </div>
                        ) : (
                            news.map((item, index) => {
                                const sentiment =
                                    item.sentiment?.toLowerCase() || "neutral";

                                return (
                                    <article
                                        className="news-item"
                                        key={item._id || item.url || index}
                                    >
                                        <div className="news-symbol">
                                            {item.symbol || "NEWS"}
                                        </div>

                                        <div className="news-content">
                                            <h4>{item.title}</h4>

                                            <div className="news-meta">
                                                <span>
                                                    {item.source || "News"}
                                                </span>

                                                <span>•</span>

                                                <span>
                                                    {formatTime(item.publishedAt)}
                                                </span>

                                                <span
                                                    className={`news-sentiment ${
                                                        ["positive", "negative", "neutral"].includes(sentiment)
                                                            ? sentiment
                                                            : "neutral"
                                                    }`}
                                                >
                                                    {sentiment}
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })
                        )}

                    </div>
                </div>

            </section>

        </div>
    );
}

export default Dashboard;
