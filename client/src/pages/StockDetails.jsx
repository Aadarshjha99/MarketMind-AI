import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    Star,
    TrendingUp,
    Activity,
    Newspaper,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

import {
    getStockQuote,
    searchStocks,
    getStockHistory,
    getStockTechnical,
    getStockPrediction,
    getStockNews
} from "../services/marketApi";

import "./StockDetails.css";


const periodDays = {
    "1D": 1,
    "1W": 7,
    "1M": 30,
    "6M": 183,
    "1Y": 365
};

function StockDetails() {

    const { symbol } = useParams();
    const navigate = useNavigate();

    const [prediction, setPrediction] = useState(null);
    const [predictionLoading, setPredictionLoading] = useState(false);
    const [predictionError, setPredictionError] = useState("");


    const [news, setNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [newsError, setNewsError] = useState("");


    const [quote, setQuote] = useState(null);
    const [stockInfo, setStockInfo] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");
    const [period, setPeriod] = useState("1M");

    const [technicalData, setTechnicalData] = useState(null);
    const [technicalLoading, setTechnicalLoading] = useState(false);
    const [technicalError, setTechnicalError] = useState("");
    // --------------------------------
    // Decode and validate symbol
    // --------------------------------

    let decodedSymbol = "";

    try {
        decodedSymbol = decodeURIComponent(symbol || "")
            .trim()
            .toUpperCase();
    } catch (err) {
        decodedSymbol = "";
    }


    const isValidSymbol =
        /^[A-Z0-9&.-]+$/.test(decodedSymbol);


    // --------------------------------
    // Load Stock Data
    // --------------------------------

    useEffect(() => {

        const loadStock = async () => {

            if (!isValidSymbol) {

                setLoading(false);

                setError(
                    `Invalid stock symbol: ${symbol}`
                );

                return;
            }


            try {

                setLoading(true);
                setError("");

                setQuote(null);
                setStockInfo(null);


                /*
                 * First search for the stock.
                 *
                 * This gives us:
                 * - symbol
                 * - companyName
                 * - exchange
                 * - isin
                 * - instrumentKey
                 */

                const searchResponse =
                    await searchStocks(decodedSymbol);


                const matchingStock =
                    searchResponse.data?.find(
                        (stock) =>
                            stock.symbol?.toUpperCase() ===
                            decodedSymbol
                    );


                if (!matchingStock) {

                    setLoading(false);

                    setError(
                        `Stock "${decodedSymbol}" was not found.`
                    );

                    return;
                }


                setStockInfo(matchingStock);


                /*
                 * Now fetch the quote using the
                 * actual symbol returned by backend.
                 */

                const quoteResponse =
                    await getStockQuote(
                        matchingStock.symbol
                    );


                setQuote(quoteResponse.data);

            } catch (err) {

                console.error(
                    "Failed to load stock:",
                    err
                );


                const backendMessage =
                    err.response?.data?.message;


                setError(
                    backendMessage ||
                    "Unable to load stock data."
                );

            } finally {

                setLoading(false);

            }

        };


        loadStock();

    }, [symbol, decodedSymbol, isValidSymbol]);


    useEffect(() => {
        let cancelled = false;

        const loadHistory = async () => {
            try {
                setHistoryLoading(true);
                setHistoryError("");
                setHistory([]);

                // Use intraday candles for 1D.
                // Use daily candles for other periods.
                const interval = period === "1D" ? "5m" : "1d";

                const response = await getStockHistory(
                    symbol,
                    interval
                );

                if (!cancelled) {
                    const candles = response.data;

                    if (!Array.isArray(candles)) {
                        throw new Error(
                            "Unexpected historical data format."
                        );
                    }

                    setHistory(candles);
                }
            } catch (error) {
                if (!cancelled) {
                    setHistoryError(
                        error.response?.data?.message ||
                        error.message ||
                        "Failed to load historical data."
                    );
                }
            } finally {
                if (!cancelled) {
                    setHistoryLoading(false);
                }
            }
        };

        if (symbol) {
            loadHistory();
        }

        return () => {
            cancelled = true;
        };
    }, [symbol, period]);

    useEffect(() => {
        let cancelled = false;

        const loadTechnicalData = async () => {
            try {
                setTechnicalLoading(true);
                setTechnicalError("");
                setTechnicalData(null);

                const response = await getStockTechnical(symbol);

                if (!cancelled) {
                    const indicators = response.data?.indicators;

                    if (!Array.isArray(indicators) || !indicators.length) {
                        throw new Error("No technical indicators available.");
                    }

                    setTechnicalData(indicators[indicators.length - 1]);
                }
            } catch (error) {
                if (!cancelled) {
                    setTechnicalError(
                        error.response?.data?.message ||
                        error.message ||
                        "Unable to load technical indicators."
                    );
                }
            } finally {
                if (!cancelled) {
                    setTechnicalLoading(false);
                }
            }
        };

        if (symbol) {
            loadTechnicalData();
        }

        return () => {
            cancelled = true;
        };
    }, [symbol]);


    useEffect(() => {
        let cancelled = false;

        const loadPrediction = async () => {
            const normalizedSymbol = decodedSymbol.replace(/\.NS$/, "");

            const supportedStocks = [
                "TCS",
                "INFY",
                "RELIANCE",
                "HDFCBANK",
                "ICICIBANK"
            ];

            if (!supportedStocks.includes(normalizedSymbol)) {
                setPrediction(null);
                setPredictionError(
                    "AI prediction is currently available for TCS, INFY, RELIANCE, HDFCBANK and ICICIBANK."
                );
                return;
            }

            try {
                setPredictionLoading(true);
                setPredictionError("");
                setPrediction(null);

                const result = await getStockPrediction(normalizedSymbol);

                if (!cancelled) {
                    setPrediction(result);
                }
            } catch (error) {
                if (!cancelled) {
                    setPredictionError(
                        error.message || "Unable to load AI prediction."
                    );
                }
            } finally {
                if (!cancelled) {
                    setPredictionLoading(false);
                }
            }
        };

        if (decodedSymbol) {
            loadPrediction();
        }

        return () => {
            cancelled = true;
        };
    }, [decodedSymbol]);



    useEffect(() => {
        let cancelled = false;

        const loadNews = async () => {
            try {
                setNewsLoading(true);
                setNewsError("");
                setNews([]);

                const response = await getStockNews(decodedSymbol);

                if (!response.success || !Array.isArray(response.data)) {
                    throw new Error("Unexpected news response format.");
                }

                if (!cancelled) {
                    setNews(response.data);
                }
            } catch (error) {
                if (!cancelled) {
                    setNewsError(
                        error.response?.data?.message ||
                        error.message ||
                        "Unable to load stock news."
                    );
                }
            } finally {
                if (!cancelled) {
                    setNewsLoading(false);
                }
            }
        };

        if (decodedSymbol && isValidSymbol) {
            loadNews();
        }

        return () => {
            cancelled = true;
        };
    }, [decodedSymbol, isValidSymbol]);


    const indicators = [
        {
            name: "SMA 20",
            value: technicalData?.sma20,
            status: technicalData?.sma20 == null
                ? "Unavailable"
                : technicalData.close > technicalData.sma20
                    ? "Bullish"
                    : "Bearish"
        },
        {
            name: "SMA 50",
            value: technicalData?.sma50,
            status: technicalData?.sma50 == null
                ? "Unavailable"
                : technicalData.close > technicalData.sma50
                    ? "Bullish"
                    : "Bearish"
        },
        {
            name: "RSI 14",
            value: technicalData?.rsi14,
            status: technicalData?.rsi14 == null
                ? "Unavailable"
                : technicalData.rsi14 >= 70
                    ? "Overbought"
                    : technicalData.rsi14 <= 30
                        ? "Oversold"
                        : "Neutral"
        },
        {
            name: "MACD",
            value: technicalData?.macd,
            status: technicalData?.macd == null ||
                    technicalData?.macdSignal == null
                ? "Unavailable"
                : technicalData.macd > technicalData.macdSignal
                    ? "Bullish"
                    : "Bearish"
        }
    ];


    // --------------------------------
    // News Sentiment Aggregation
    // --------------------------------

    const sentimentCounts = news.reduce(
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
        {
            positive: 0,
            negative: 0,
            neutral: 0
        }
    );

    const totalNews = news.length;

    const getPercentage = (count) =>
        totalNews ? (count / totalNews) * 100 : 0;

    const overallSentiment =
        totalNews === 0
            ? "Unavailable"
            : sentimentCounts.positive > sentimentCounts.negative
                ? "Positive"
                : sentimentCounts.negative > sentimentCounts.positive
                    ? "Negative"
                    : sentimentCounts.positive === sentimentCounts.negative &&
                    sentimentCounts.positive > 0
                        ? "Mixed"
                        : "Neutral";

    const overallSentimentClass = overallSentiment.toLowerCase();


    // --------------------------------
    // Loading State
    // --------------------------------

    if (loading) {

        return (
            <div className="stock-details-page">

                <div className="stock-loading">
                    Loading {decodedSymbol || symbol} market data...
                </div>

            </div>
        );

    }


    // --------------------------------
    // Error State
    // --------------------------------

    if (error) {

        return (
            <div className="stock-details-page">

                <button
                    className="back-button"
                    onClick={() => navigate("/markets")}
                >
                    ← Back to Markets
                </button>


                <div className="stock-error">

                    <strong>
                        Unable to load stock
                    </strong>

                    <span>
                        {error}
                    </span>

                </div>

            </div>
        );

    }


    // --------------------------------
    // Safe Stock Values
    // --------------------------------

    const displaySymbol =
        stockInfo?.symbol ||
        quote?.symbol ||
        decodedSymbol;

    const companyName =
        stockInfo?.companyName ||
        "Company";

    const exchange =
        stockInfo?.exchange ||
        quote?.exchange ||
        "NSE";

    const sector =
        stockInfo?.sector ||
        "NSE Equity";

    const validHistory = history.filter(
        (candle) =>
            candle.datetime &&
            Number.isFinite(Number(candle.close))
    );

    const latestDate = validHistory.length
        ? new Date(validHistory[0].datetime).toDateString()
        : "";

    const filteredHistory = validHistory
        .filter((candle) => {
            const candleDate = new Date(candle.datetime);

            if (period === "1D") {
                return candleDate.toDateString() === latestDate;
            }

            const cutoff = new Date();
            cutoff.setDate(
                cutoff.getDate() - periodDays[period]
            );

            return candleDate >= cutoff;
        })
        .sort(
            (a, b) =>
                new Date(a.datetime) - new Date(b.datetime)
        );

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

    const chartPoints = chartValues.map((price, index) => ({
        x:
            chartValues.length === 1
                ? 500
                : (index / (chartValues.length - 1)) * 1000,

        y:
            280 -
            ((price - chartMin) / chartRange) * 240
    }));

    const chartPath = chartPoints
        .map(
            (point, index) =>
                `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
        )
        .join(" ");

    const chartAreaPath = chartPoints.length
        ? `${chartPath} L 1000 300 L 0 300 Z`
        : "";

    return (

        <div className="stock-details-page">


            {/* Back */}

            <button
                className="back-button"
                onClick={() => navigate("/markets")}
            >
                ← Back to Markets
            </button>



            {/* Stock Header */}

            <section className="stock-details-header">

                <div className="stock-heading">

                    <div className="large-stock-icon">
                        {displaySymbol}
                    </div>


                    <div>

                        <div className="stock-title-row">

                            <h2>
                                {displaySymbol}
                            </h2>

                            <span className="exchange-badge">
                                {exchange}
                            </span>

                        </div>


                        <p>
                            {companyName}
                        </p>


                        <span className="stock-sector">
                            {sector}
                        </span>

                    </div>

                </div>


                <button className="add-watchlist">
                    <Star size={16} />
                    Add to Watchlist
                </button>

            </section>



            {/* Price */}

            <section className="stock-price-section">

                <div className="stock-current-price">

                    <span>

                        {quote?.price !== undefined
                            ? `₹${Number(
                                  quote.price
                              ).toLocaleString(
                                  "en-IN",
                                  {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                  }
                              )}`
                            : "--"}

                    </span>


                    {quote && (

                        <div
                            className={`stock-price-change ${
                                quote.change >= 0
                                    ? "positive"
                                    : "negative"
                            }`}
                        >

                            {quote.change >= 0 ? (
                                <ArrowUpRight size={16} />
                            ) : (
                                <ArrowDownRight size={16} />
                            )}


                            <strong>

                                {quote.change >= 0
                                    ? "+"
                                    : ""}

                                {Number(
                                    quote.change
                                ).toFixed(2)}

                            </strong>


                            <span>

                                {quote.changePercent >= 0
                                    ? "+"
                                    : ""}

                                {Number(
                                    quote.changePercent
                                ).toFixed(2)}%

                            </span>

                        </div>

                    )}

                </div>



                <div className="price-meta">

                    <div>

                        <span>
                            Previous Close
                        </span>

                        <strong>

                            {quote?.previousClose !== undefined
                                ? `₹${Number(
                                      quote.previousClose
                                  ).toLocaleString(
                                      "en-IN",
                                      {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                      }
                                  )}`
                                : "--"}

                        </strong>

                    </div>


                    <div>

                        <span>
                            Day High
                        </span>

                        <strong>

                            {quote?.dayHigh !== undefined
                                ? `₹${Number(
                                      quote.dayHigh
                                  ).toLocaleString(
                                      "en-IN",
                                      {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                      }
                                  )}`
                                : "--"}

                        </strong>

                    </div>


                    <div>

                        <span>
                            Day Low
                        </span>

                        <strong>

                            {quote?.dayLow !== undefined
                                ? `₹${Number(
                                      quote.dayLow
                                  ).toLocaleString(
                                      "en-IN",
                                      {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                      }
                                  )}`
                                : "--"}

                        </strong>

                    </div>


                    <div>

                        <span>
                            Volume
                        </span>

                        <strong>

                            {quote?.volume !== undefined
                                ? Number(
                                      quote.volume
                                  ).toLocaleString("en-IN")
                                : "--"}

                        </strong>

                    </div>

                </div>

            </section>



            {/* Chart */}

            <section className="stock-chart-card">
                <div className="stock-chart-header">
                    <div>
                        <span className="chart-label">
                            PRICE PERFORMANCE
                        </span>
                        <h3>Historical Price</h3>
                    </div>

                    <div className="stock-chart-periods">
                        {["1D", "1W", "1M", "6M", "1Y"].map((item) => (
                            <button
                                key={item}
                                className={period === item ? "active" : ""}
                                onClick={() => setPeriod(item)}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                {historyLoading ? (
                    <div className="market-data-loading">
                        Loading historical prices...
                    </div>
                ) : historyError ? (
                    <div className="market-data-loading">
                        {historyError}
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="market-data-loading">
                        No historical prices available for this period.
                    </div>
                ) : (
                    <>
                        <div className="chart-price-summary">
                            <strong>
                                ₹{chartValues[chartValues.length - 1].toLocaleString(
                                    "en-IN",
                                    { maximumFractionDigits: 2 }
                                )}
                            </strong>

                            <span>
                                {filteredHistory.length}{" "}
                                {period === "1D" ? "price points" : "trading sessions"}
                            </span>
                        </div>

                        <div className="stock-chart">
                            <div className="chart-values">
                                {[1, 0.66, 0.33, 0].map((fraction) => (
                                    <span key={fraction}>
                                        ₹{(
                                            chartMin +
                                            chartRange * fraction
                                        ).toLocaleString("en-IN", {
                                            maximumFractionDigits: 2
                                        })}
                                    </span>
                                ))}
                            </div>

                            <div className="stock-chart-area">
                                <svg
                                    viewBox="0 0 1000 330"
                                    preserveAspectRatio="none"
                                    role="img"
                                    aria-label={`${displaySymbol} historical closing prices`}
                                >
                                    <defs>
                                        <linearGradient
                                            id="stockChartGradient"
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
                                        d={chartAreaPath}
                                        fill="url(#stockChartGradient)"
                                    />

                                    <path
                                        d={chartPath}
                                        fill="none"
                                        stroke="#4F8CFF"
                                        strokeWidth="3"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </svg>

                                <div className="chart-times">
                                    <span>
                                        {new Date(
                                            filteredHistory[0].datetime
                                        ).toLocaleString(
                                            "en-IN",
                                            period === "1D"
                                                ? { hour: "2-digit", minute: "2-digit" }
                                                : { day: "numeric", month: "short" }
                                        )}
                                    </span>

                                    <span>
                                        {new Date(
                                            filteredHistory[
                                                Math.floor(filteredHistory.length / 2)
                                            ].datetime
                                        ).toLocaleString(
                                            "en-IN",
                                            period === "1D"
                                                ? { hour: "2-digit", minute: "2-digit" }
                                                : { day: "numeric", month: "short" }
                                        )}
                                    </span>

                                    <span>
                                        {new Date(
                                            filteredHistory[filteredHistory.length - 1].datetime
                                        ).toLocaleString(
                                            "en-IN",
                                            period === "1D"
                                                ? { hour: "2-digit", minute: "2-digit" }
                                                : { day: "numeric", month: "short" }
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </section>




            {/* Analysis */}

            <section className="analysis-grid">


                {/* Technicals */}

                <div className="details-card">

                    <div className="details-card-header">

                        <div>

                            <span>
                                TECHNICAL ANALYSIS
                            </span>

                            <h3>
                                Technical Indicators
                            </h3>

                        </div>

                        <Activity size={18} />

                    </div>


                    
                    <div className="indicator-grid">

                        {technicalLoading ? (
                            <p>Loading technical indicators...</p>
                        ) : technicalError ? (
                            <p>{technicalError}</p>
                        ) : (
                            indicators.map((indicator) => (
                                <div
                                    className="indicator"
                                    key={indicator.name}
                                >
                                    <span>{indicator.name}</span>

                                    <strong>
                                        {Number.isFinite(Number(indicator.value)) &&
                                        indicator.value !== null
                                            ? Number(indicator.value).toFixed(2)
                                            : "--"}
                                    </strong>

                                    <small
                                        className={
                                            indicator.status === "Bullish"
                                                ? "bullish"
                                                : indicator.status === "Bearish"
                                                    ? "bearish"
                                                    : "neutral"
                                        }
                                    >
                                        {indicator.status}
                                    </small>
                                </div>
                            ))
                        )}

                    </div>


                </div>



                {/* LSTM AI Prediction */}
                <div className="details-card ai-analysis-card">

                    <div className="details-card-header">
                        <div>
                            <span>MARKETMIND AI · LSTM MODEL</span>
                            <h3>AI Price Prediction</h3>
                        </div>

                        <Sparkles
                            size={18}
                            className="ai-sparkle"
                        />
                    </div>

                    <div className="ai-insight-content">

                        {predictionLoading ? (
                            <div className="market-data-loading">
                                <p>Analyzing historical market data...</p>
                                <small>Generating next-day prediction</small>
                            </div>
                        ) : predictionError ? (
                            <div className="market-data-loading">
                                {predictionError}
                            </div>
                        ) : prediction ? (
                            <>
                                <div className="ai-price-grid">
                                    <div className="ai-price-item">
                                        <span>Last Historical Close</span>
                                        <strong>
                                            ₹{Number(prediction.current_price).toLocaleString("en-IN", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                        </strong>
                                    </div>

                                    <div className="ai-price-item">
                                        <span>Predicted Next Session Price</span>
                                        <strong>
                                            ₹{Number(prediction.predicted_price).toLocaleString("en-IN", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                        </strong>
                                    </div>
                                </div>

                                <div className="ai-signal">
                                    {prediction.direction === "UP" ? (
                                        <TrendingUp size={16} />
                                    ) : (
                                        <ArrowDownRight size={16} />
                                    )}

                                    <span>
                                        {prediction.direction}
                                        {" · "}
                                        {Number(prediction.predicted_return).toFixed(2)}%
                                    </span>
                                </div>

                                <p>
                                    The LSTM model predicts a{" "}
                                    {prediction.direction.toLowerCase()} movement for the next
                                    trading session, based on historical market data.
                                </p>

                                <p className="ai-reference-note">
                                    The historical closing price above is the reference price
                                    used by the prediction model. It is not the live market quote.
                                </p>

                                <div className="ai-model-info">
                                    <small>
                                        Model: {prediction.model}
                                    </small>

                                    <small>
                                        Horizon: {prediction.prediction_horizon}
                                    </small>

                                    <small>
                                        Data as of: {prediction.last_data_date}
                                    </small>
                                </div>

                                <p className="ai-disclaimer">
                                    {prediction.disclaimer ||
                                        "Experimental model output. This is not financial advice or a guaranteed prediction."}
                                </p>

                            </>
                        ) : (
                            <p>No prediction available.</p>
                        )}

                    </div>
                </div>

            </section>



            {/* Dynamic Stock News */}

            <section className="details-card stock-news-card">

                <div className="details-card-header">
                    <div>
                        <span>MARKET INTELLIGENCE</span>
                        <h3>Latest {displaySymbol} News</h3>
                    </div>

                    <Newspaper size={18} />
                </div>

                <div className="stock-news-list">
                    {!newsLoading && !newsError && totalNews > 0 && (
                        <div className="news-sentiment-dashboard">

                            <div className="sentiment-dashboard-header">

                                <div className="sentiment-overview">
                                    <span className="sentiment-eyebrow">
                                        OVERALL NEWS SENTIMENT
                                    </span>

                                    <h2 className={`overall-sentiment ${overallSentiment.toLowerCase()}`}>
                                        {overallSentiment}
                                    </h2>

                                    <p>
                                        Based on {totalNews} analyzed news articles
                                    </p>
                                </div>

                                <div className="sentiment-article-count">
                                    <span>Articles analyzed</span>
                                    <strong>{totalNews}</strong>
                                </div>

                            </div>

                            {/* Distribution Bar */}

                            <div
                                className="sentiment-distribution"
                                role="img"
                                aria-label={`Positive ${sentimentCounts.positive}, Neutral ${sentimentCounts.neutral}, Negative ${sentimentCounts.negative}`}
                            >
                                {sentimentCounts.positive > 0 && (
                                    <div
                                        className="distribution-positive"
                                        style={{ width: `${getPercentage(sentimentCounts.positive)}%` }}
                                    />
                                )}

                                {sentimentCounts.neutral > 0 && (
                                    <div
                                        className="distribution-neutral"
                                        style={{ width: `${getPercentage(sentimentCounts.neutral)}%` }}
                                    />
                                )}

                                {sentimentCounts.negative > 0 && (
                                    <div
                                        className="distribution-negative"
                                        style={{ width: `${getPercentage(sentimentCounts.negative)}%` }}
                                    />
                                )}
                            </div>

                            {/* Legend */}

                            <div className="sentiment-legend">

                                <div className="legend-item">
                                    <span className="legend-dot positive-dot" />
                                    <span>Positive</span>
                                    <strong>{sentimentCounts.positive}</strong>
                                    <small>{getPercentage(sentimentCounts.positive).toFixed(0)}%</small>
                                </div>

                                <div className="legend-item">
                                    <span className="legend-dot neutral-dot" />
                                    <span>Neutral</span>
                                    <strong>{sentimentCounts.neutral}</strong>
                                    <small>{getPercentage(sentimentCounts.neutral).toFixed(0)}%</small>
                                </div>

                                <div className="legend-item">
                                    <span className="legend-dot negative-dot" />
                                    <span>Negative</span>
                                    <strong>{sentimentCounts.negative}</strong>
                                    <small>{getPercentage(sentimentCounts.negative).toFixed(0)}%</small>
                                </div>

                            </div>

                            <div className="sentiment-disclaimer">
                                Sentiment reflects the tone of available news articles.
                                It does not predict stock-price movement.
                            </div>

                        </div>
                    )}
                    {newsLoading ? (
                        <div className="market-data-loading">
                            Loading latest news...
                        </div>
                    ) : newsError ? (
                        <div className="market-data-loading">
                            {newsError}
                        </div>
                    ) : news.length === 0 ? (
                        <div className="market-data-loading">
                            No news articles available for {displaySymbol}.
                        </div>
                    ) : (
                        news.map((article, index) => (

                            <article
                                className="stock-news-item"
                                key={article._id || article.url}
                            >

                                <div className="news-number">
                                    {String(index + 1).padStart(2, "0")}
                                </div>

                                <div className="stock-news-content">

                                    <h4>{article.title}</h4>

                                    {article.description && (
                                        <p className="news-description">
                                            {article.description}
                                        </p>
                                    )}

                                    <div>
                                        <span>{article.source || "Unknown source"}</span>

                                        <span>•</span>

                                        <span>
                                            {article.publishedAt
                                                ? new Date(article.publishedAt).toLocaleString(
                                                    "en-IN",
                                                    {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    }
                                                )
                                                : "Date unavailable"}
                                        </span>


                                        <span
                                            className={`news-sentiment-badge ${
                                                ["positive", "negative", "neutral"].includes(
                                                    article.sentiment?.toLowerCase()
                                                )
                                                    ? article.sentiment.toLowerCase()
                                                    : "neutral"
                                            }`}
                                        >
                                            {article.sentiment || "Neutral"}
                                            {article.sentimentScore != null && (
                                                <span className="sentiment-confidence">
                                                    {(Number(article.sentimentScore) * 100).toFixed(1)}%
                                                </span>
                                            )}
                                        </span>

                                    </div>

                                    {article.url && (
                                        <a
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="news-read-link"
                                        >
                                            Read Article
                                            <ArrowUpRight size={14} />
                                        </a>
                                    )}

                                </div>

                                <ArrowUpRight
                                    size={16}
                                    className="news-arrow"
                                />

                            </article>

                        ))
                    )}

                </div>

            </section>


        </div>
    );
}


export default StockDetails;
