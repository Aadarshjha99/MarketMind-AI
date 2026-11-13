
import { useEffect, useState } from "react";
import {
    Search,
    BrainCircuit,
    TrendingUp,
    Activity,
    Newspaper,
    ArrowUpRight,
    ArrowDownRight,
    Star
} from "lucide-react";

import {
    searchStocks,
    getStockQuote,
    getStockHistory,
    getStockTechnical,
    getStockPrediction,
    getStockNews
} from "../services/marketApi";

import {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist
} from "../services/watchlistApi";

import "./StockIntelligence.css";

const SUPPORTED_PREDICTIONS = [
    "TCS",
    "INFY",
    "RELIANCE",
    "HDFCBANK",
    "ICICIBANK"
];

function StockIntelligence() {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);

    const [quote, setQuote] = useState(null);
    const [history, setHistory] = useState([]);
    const [technical, setTechnical] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [news, setNews] = useState([]);

    const [loading, setLoading] = useState({
        quote: false,
        history: false,
        technical: false,
        prediction: false,
        news: false
    });

    const [errors, setErrors] = useState({});
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [watchlistUpdating, setWatchlistUpdating] = useState(false);

    // Search stocks
    useEffect(() => {
        if (query.trim().length < 2 || selectedStock) {
            setSuggestions([]);
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            try {
                setSearching(true);

                const response = await searchStocks(query.trim());

                if (!cancelled) {
                    setSuggestions(response.data || []);
                }
            } catch (error) {
                console.error("Stock search failed:", error);
                if (!cancelled) setSuggestions([]);
            } finally {
                if (!cancelled) setSearching(false);
            }
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query, selectedStock]);

    // Load all analysis for selected stock
    useEffect(() => {
        if (!selectedStock) return;

        let cancelled = false;

        const symbol = selectedStock.symbol;
        const normalizedSymbol = symbol.toUpperCase().replace(/\.NS$/, "");

        setQuote(null);
        setHistory([]);
        setTechnical(null);
        setPrediction(null);
        setNews([]);
        setErrors({});

        setLoading({
            quote: true,
            history: true,
            technical: true,
            prediction: true,
            news: true
        });

        const loadSection = async (key, request, onSuccess) => {
            try {
                const response = await request();

                if (!cancelled) {
                    onSuccess(response);
                }
            } catch (error) {
                console.error(`${key} loading failed:`, error);

                if (!cancelled) {
                    setErrors(previous => ({
                        ...previous,
                        [key]:
                            error.response?.data?.message ||
                            error.message ||
                            `Unable to load ${key}.`
                    }));
                }
            } finally {
                if (!cancelled) {
                    setLoading(previous => ({
                        ...previous,
                        [key]: false
                    }));
                }
            }
        };

        loadSection(
            "quote",
            () => getStockQuote(symbol),
            response => setQuote(response.data)
        );

        loadSection(
            "history",
            () => getStockHistory(symbol, "1d"),
            response => {
                if (!Array.isArray(response.data)) {
                    throw new Error("Unexpected historical data format.");
                }
                setHistory(response.data);
            }
        );

        loadSection(
            "technical",
            () => getStockTechnical(symbol),
            response => {
                const indicators = response.data?.indicators;

                if (!Array.isArray(indicators) || !indicators.length) {
                    throw new Error("No technical indicators available.");
                }

                setTechnical(indicators[indicators.length - 1]);
            }
        );

        if (SUPPORTED_PREDICTIONS.includes(normalizedSymbol)) {
            loadSection(
                "prediction",
                () => getStockPrediction(normalizedSymbol),
                response => setPrediction(response)
            );
        } else {
            setErrors(previous => ({
                ...previous,
                prediction: "Prediction is currently available for TCS, INFY, RELIANCE, HDFCBANK and ICICIBANK."
            }));
            setLoading(previous => ({
                ...previous,
                prediction: false
            }));
        }

        loadSection(
            "news",
            () => getStockNews(symbol),
            response => {
                if (!response.success || !Array.isArray(response.data)) {
                    throw new Error("Unexpected news response format.");
                }
                setNews(response.data);
            }
        );

        return () => {
            cancelled = true;
        };
    }, [selectedStock]);

    // Check watchlist status
    useEffect(() => {
        if (!selectedStock) return;

        let cancelled = false;

        const checkWatchlist = async () => {
            try {
                const data = await getWatchlist();

                if (!cancelled) {
                    setIsInWatchlist(
                        data.some(
                            item =>
                                item.symbol?.toUpperCase() ===
                                selectedStock.symbol.toUpperCase()
                        )
                    );
                }
            } catch (error) {
                console.error("Watchlist check failed:", error);
            }
        };

        checkWatchlist();

        return () => {
            cancelled = true;
        };
    }, [selectedStock]);

    const handleSelectStock = stock => {
        setSelectedStock(stock);
        setQuery(stock.symbol);
        setSuggestions([]);
    };

    const handleWatchlistToggle = async () => {
        if (!selectedStock || watchlistUpdating) return;

        try {
            setWatchlistUpdating(true);

            if (isInWatchlist) {
                await removeFromWatchlist(selectedStock.symbol);
                setIsInWatchlist(false);
            } else {
                await addToWatchlist(selectedStock.symbol);
                setIsInWatchlist(true);
            }
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Unable to update watchlist."
            );
        } finally {
            setWatchlistUpdating(false);
        }
    };

    const sentimentCounts = news.reduce(
        (counts, article) => {
            const sentiment = article.sentiment?.toLowerCase();

            if (sentiment === "positive") counts.positive++;
            else if (sentiment === "negative") counts.negative++;
            else counts.neutral++;

            return counts;
        },
        { positive: 0, neutral: 0, negative: 0 }
    );

    const totalSentiment = news.length;

    const overallSentiment =
        !totalSentiment
            ? "Unavailable"
            : sentimentCounts.positive > sentimentCounts.negative
                ? "Positive"
                : sentimentCounts.negative > sentimentCounts.positive
                    ? "Negative"
                    : sentimentCounts.positive > 0
                        ? "Mixed"
                        : "Neutral";

    const formatPrice = value =>
        value == null || !Number.isFinite(Number(value))
            ? "--"
            : `₹${Number(value).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;

    const validHistory = history
        .filter(candle =>
            candle.datetime &&
            Number.isFinite(Number(candle.close))
        )
        .sort(
            (a, b) =>
                new Date(a.datetime) - new Date(b.datetime)
        );

    const prices = validHistory.map(candle => Number(candle.close));
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const range = maxPrice - minPrice || 1;

    const chartPoints = prices.map((price, index) => ({
        x: prices.length === 1
            ? 500
            : (index / (prices.length - 1)) * 1000,
        y: 260 - ((price - minPrice) / range) * 220
    }));

    const chartPath = chartPoints
        .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
        )
        .join(" ");

    const indicators = [
        {
            name: "SMA 20",
            value: technical?.sma20,
            status: technical?.sma20 == null
                ? "Unavailable"
                : technical.close > technical.sma20
                    ? "Bullish"
                    : "Bearish"
        },
        {
            name: "SMA 50",
            value: technical?.sma50,
            status: technical?.sma50 == null
                ? "Unavailable"
                : technical.close > technical.sma50
                    ? "Bullish"
                    : "Bearish"
        },
        {
            name: "RSI 14",
            value: technical?.rsi14,
            status: technical?.rsi14 == null
                ? "Unavailable"
                : technical.rsi14 >= 70
                    ? "Overbought"
                    : technical.rsi14 <= 30
                        ? "Oversold"
                        : "Neutral"
        },
        {
            name: "MACD",
            value: technical?.macd,
            status: technical?.macd == null ||
                technical?.macdSignal == null
                ? "Unavailable"
                : technical.macd > technical.macdSignal
                    ? "Bullish"
                    : "Bearish"
        }
    ];

    // Combined interpretation from actual fetched data
    const technicalBullish = indicators.filter(
        item => item.status === "Bullish"
    ).length;

    const technicalBearish = indicators.filter(
        item => item.status === "Bearish"
    ).length;

    const getCombinedAnalysis = () => {
        const observations = [];

        if (quote) {
            observations.push(
                `The live quote is ${formatPrice(quote.price)}. The daily change is ${Number(quote.changePercent || 0).toFixed(2)}%.`
            );
        }

        if (technical) {
            observations.push(
                `Technical indicators show ${technicalBullish} bullish and ${technicalBearish} bearish signals among the displayed indicators.`
            );
        }

        if (totalSentiment) {
            observations.push(
                `News sentiment is ${overallSentiment.toLowerCase()}, based on ${totalSentiment} available articles.`
            );
        }

        if (prediction) {
            observations.push(
                `The LSTM model predicts ${prediction.direction} movement of ${Number(prediction.predicted_return).toFixed(2)}% for the next session.`
            );
        }

        return observations;
    };

    return (
        <div className="intelligence-page">

            <div className="intelligence-heading">
                <div>
                    <span className="intelligence-eyebrow">
                        MARKETMIND AI
                    </span>
                    <h1>Stock Intelligence</h1>
                    <p>
                        One stock. All the analysis you need.
                    </p>
                </div>

                <BrainCircuit size={34} />
            </div>

            <div className="intelligence-search">
                <Search size={20} />

                <input
                    type="text"
                    value={query}
                    placeholder="Search a stock, e.g. TCS, INFY, RELIANCE..."
                    onChange={event => {
                        setQuery(event.target.value);
                        setSelectedStock(null);
                    }}
                />

                {searching && <span>Searching...</span>}

                {suggestions.length > 0 && (
                    <div className="intelligence-suggestions">
                        {suggestions.map(stock => (
                            <button
                                key={`${stock.symbol}-${stock.exchange || ""}`}
                                type="button"
                                onClick={() => handleSelectStock(stock)}
                            >
                                <strong>{stock.symbol}</strong>
                                <span>{stock.companyName}</span>
                                <small>{stock.exchange}</small>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {!selectedStock ? (
                <div className="intelligence-empty">
                    <BrainCircuit size={48} />
                    <h2>Start with a stock</h2>
                    <p>
                        Search and select a stock to explore its price,
                        technical indicators, AI prediction and news sentiment.
                    </p>
                </div>
            ) : (
                <>
                    {/* Stock overview */}
                    <section className="intelligence-card intelligence-overview">
                        <div className="intelligence-stock-title">
                            <div>
                                <span>{selectedStock.exchange || "NSE"}</span>
                                <h2>{selectedStock.symbol}</h2>
                                <p>{selectedStock.companyName}</p>
                            </div>

                            <button
                                className={`intelligence-watchlist ${isInWatchlist ? "active" : ""}`}
                                onClick={handleWatchlistToggle}
                                disabled={watchlistUpdating}
                            >
                                <Star
                                    size={16}
                                    fill={isInWatchlist ? "currentColor" : "none"}
                                />
                                {watchlistUpdating
                                    ? "Updating..."
                                    : isInWatchlist
                                        ? "In Watchlist"
                                        : "Add to Watchlist"}
                            </button>
                        </div>

                        {loading.quote ? (
                            <p>Loading live quote...</p>
                        ) : errors.quote ? (
                            <p className="intelligence-error">{errors.quote}</p>
                        ) : (
                            <div className="intelligence-price">
                                <h2>{formatPrice(quote?.price)}</h2>

                                <span className={
                                    Number(quote?.change) >= 0
                                        ? "positive"
                                        : "negative"
                                }>
                                    {Number(quote?.change) >= 0
                                        ? <ArrowUpRight size={16} />
                                        : <ArrowDownRight size={16} />}
                                    {quote?.change != null
                                        ? `${Number(quote.change).toFixed(2)} (${Number(quote.changePercent).toFixed(2)}%)`
                                        : "--"}
                                </span>
                            </div>
                        )}

                        <div className="intelligence-market-stats">
                            {[
                                ["Previous Close", quote?.previousClose],
                                ["Day High", quote?.dayHigh],
                                ["Day Low", quote?.dayLow]
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <span>{label}</span>
                                    <strong>{formatPrice(value)}</strong>
                                </div>
                            ))}

                            <div>
                                <span>Volume</span>
                                <strong>
                                    {quote?.volume != null
                                        ? Number(quote.volume).toLocaleString("en-IN")
                                        : "--"}
                                </strong>
                            </div>
                        </div>
                    </section>

                    {/* Historical chart */}
                    <section className="intelligence-card">
                        <div className="intelligence-section-heading">
                            <div>
                                <span>PRICE PERFORMANCE</span>
                                <h3>Historical Price</h3>
                            </div>
                            <TrendingUp size={20} />
                        </div>

                        {loading.history ? (
                            <p>Loading historical prices...</p>
                        ) : errors.history ? (
                            <p className="intelligence-error">{errors.history}</p>
                        ) : prices.length === 0 ? (
                            <p>No historical data available.</p>
                        ) : (
                            <>
                                <div className="intelligence-chart-summary">
                                    <strong>{formatPrice(prices[prices.length - 1])}</strong>
                                    <span>{prices.length} data points</span>
                                </div>

                                <div className="intelligence-chart">
                                    <svg
                                        viewBox="0 0 1000 300"
                                        preserveAspectRatio="none"
                                        role="img"
                                        aria-label={`${selectedStock.symbol} historical price chart`}
                                    >
                                        <path
                                            d={chartPath}
                                            fill="none"
                                            stroke="#4F8CFF"
                                            strokeWidth="3"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    </svg>
                                </div>

                                <div className="intelligence-chart-labels">
                                    <span>{formatPrice(minPrice)}</span>
                                    <span>{formatPrice(maxPrice)}</span>
                                </div>
                            </>
                        )}
                    </section>

                    {/* Technical analysis */}
                    <section className="intelligence-card">
                        <div className="intelligence-section-heading">
                            <div>
                                <span>TECHNICAL ANALYSIS</span>
                                <h3>Technical Indicators</h3>
                            </div>
                            <Activity size={20} />
                        </div>

                        {loading.technical ? (
                            <p>Calculating technical indicators...</p>
                        ) : errors.technical ? (
                            <p className="intelligence-error">{errors.technical}</p>
                        ) : (
                            <div className="intelligence-indicators">
                                {indicators.map(item => (
                                    <div key={item.name}>
                                        <span>{item.name}</span>
                                        <strong>
                                            {item.value == null
                                                ? "--"
                                                : Number(item.value).toFixed(2)}
                                        </strong>
                                        <small className={item.status.toLowerCase()}>
                                            {item.status}
                                        </small>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* AI prediction */}
                    <section className="intelligence-card">
                        <div className="intelligence-section-heading">
                            <div>
                                <span>MARKETMIND AI · LSTM MODEL</span>
                                <h3>AI Price Prediction</h3>
                            </div>
                            <BrainCircuit size={20} />
                        </div>

                        {loading.prediction ? (
                            <p>Analyzing historical market data...</p>
                        ) : errors.prediction ? (
                            <p className="intelligence-error">{errors.prediction}</p>
                        ) : prediction ? (
                            <>
                                <div className="intelligence-prediction-grid">
                                    <div>
                                        <span>Last Historical Close</span>
                                        <strong>{formatPrice(prediction.current_price)}</strong>
                                    </div>
                                    <div>
                                        <span>Predicted Next Session</span>
                                        <strong>{formatPrice(prediction.predicted_price)}</strong>
                                    </div>
                                </div>

                                <div className={`intelligence-signal ${prediction.direction === "UP" ? "positive" : "negative"}`}>
                                    {prediction.direction === "UP"
                                        ? <TrendingUp size={18} />
                                        : <ArrowDownRight size={18} />}
                                    {prediction.direction} · {Number(prediction.predicted_return).toFixed(2)}%
                                </div>

                                <div className="intelligence-model-info">
                                    <span>Model: {prediction.model}</span>
                                    <span>Horizon: {prediction.prediction_horizon}</span>
                                    <span>Data as of: {prediction.last_data_date}</span>
                                </div>

                                <p className="intelligence-disclaimer">
                                    {prediction.disclaimer ||
                                        "Experimental model output. This is not financial advice or a guaranteed prediction."}
                                </p>
                            </>
                        ) : (
                            <p>No prediction available.</p>
                        )}
                    </section>

                    {/* News sentiment */}
                    <section className="intelligence-card">
                        <div className="intelligence-section-heading">
                            <div>
                                <span>NEWS & SENTIMENT</span>
                                <h3>Market News</h3>
                            </div>
                            <Newspaper size={20} />
                        </div>

                        {loading.news ? (
                            <p>Loading stock news...</p>
                        ) : errors.news ? (
                            <p className="intelligence-error">{errors.news}</p>
                        ) : news.length === 0 ? (
                            <p>No news articles available for this stock.</p>
                        ) : (
                            <>
                                <div className="intelligence-sentiment">
                                    <div>
                                        <span>OVERALL NEWS SENTIMENT</span>
                                        <h2 className={overallSentiment.toLowerCase()}>
                                            {overallSentiment}
                                        </h2>
                                        <p>{totalSentiment} analyzed articles</p>
                                    </div>

                                    <div className="intelligence-sentiment-counts">
                                        <span>Positive: {sentimentCounts.positive}</span>
                                        <span>Neutral: {sentimentCounts.neutral}</span>
                                        <span>Negative: {sentimentCounts.negative}</span>
                                    </div>
                                </div>

                                <div className="intelligence-news-list">
                                    {news.map((article, index) => (
                                        <article key={article._id || article.url || index}>
                                            <div>
                                                <h4>{article.title}</h4>
                                                {article.description && (
                                                    <p>{article.description}</p>
                                                )}

                                                <div className="intelligence-news-meta">
                                                    <span>{article.source || "Unknown source"}</span>
                                                    <span>
                                                        {article.publishedAt
                                                            ? new Date(article.publishedAt).toLocaleDateString("en-IN")
                                                            : "Date unavailable"}
                                                    </span>
                                                    <strong className={article.sentiment?.toLowerCase() || "neutral"}>
                                                        {article.sentiment || "Neutral"}
                                                    </strong>
                                                </div>

                                                {article.url && (
                                                    <a
                                                        href={article.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Read article <ArrowUpRight size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>

                    {/* Combined analysis */}
                    <section className="intelligence-card intelligence-summary">
                        <div className="intelligence-section-heading">
                            <div>
                                <span>MARKETMIND AI</span>
                                <h3>Combined Analysis</h3>
                            </div>
                            <BrainCircuit size={20} />
                        </div>

                        {getCombinedAnalysis().length === 0 ? (
                            <p>Analysis will appear as market data becomes available.</p>
                        ) : (
                            <ul>
                                {getCombinedAnalysis().map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        )}

                        <p className="intelligence-disclaimer">
                            This summary combines fetched market data and model outputs.
                            It is informational only and is not investment advice.
                        </p>
                    </section>
                </>
            )}
        </div>
    );
}

export default StockIntelligence;
