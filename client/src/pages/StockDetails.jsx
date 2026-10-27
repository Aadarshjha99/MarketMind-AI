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
    searchStocks
} from "../services/marketApi";

import "./StockDetails.css";


const indicators = [
    {
        name: "SMA 20",
        value: "₹3,384.20",
        status: "Bullish"
    },
    {
        name: "SMA 50",
        value: "₹3,312.80",
        status: "Bullish"
    },
    {
        name: "RSI 14",
        value: "62.4",
        status: "Neutral"
    },
    {
        name: "MACD",
        value: "+18.42",
        status: "Bullish"
    }
];


const news = [
    {
        title: "Technology stocks gain as market sentiment improves",
        source: "Market Intelligence",
        time: "2 hours ago",
        sentiment: "Positive"
    },
    {
        title: "IT sector remains in focus amid global market recovery",
        source: "Financial News",
        time: "5 hours ago",
        sentiment: "Positive"
    },
    {
        title: "Investors monitor upcoming technology sector results",
        source: "Business Desk",
        time: "Yesterday",
        sentiment: "Neutral"
    }
];


function StockDetails() {

    const { symbol } = useParams();
    const navigate = useNavigate();

    const [quote, setQuote] = useState(null);
    const [stockInfo, setStockInfo] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


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

                        <h3>
                            Market Price
                        </h3>

                    </div>


                    <div className="stock-chart-periods">

                        <button>
                            1D
                        </button>

                        <button className="active">
                            1W
                        </button>

                        <button>
                            1M
                        </button>

                        <button>
                            6M
                        </button>

                        <button>
                            1Y
                        </button>

                    </div>

                </div>



                <div className="stock-chart">

                    <div className="chart-values">

                        <span>3,450</span>
                        <span>3,400</span>
                        <span>3,350</span>
                        <span>3,300</span>

                    </div>


                    <div className="stock-chart-area">

                        <svg
                            viewBox="0 0 1000 330"
                            preserveAspectRatio="none"
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
                                d="
                                    M0 270
                                    C45 258 70 220 105 235
                                    C145 252 165 205 205 218
                                    C245 230 270 185 310 196
                                    C350 207 375 158 415 174
                                    C450 190 475 135 520 151
                                    C555 166 590 120 625 137
                                    C665 155 700 104 735 119
                                    C775 135 810 80 850 96
                                    C900 113 935 70 1000 55
                                    L1000 330
                                    L0 330
                                    Z
                                "
                                fill="url(#stockChartGradient)"
                            />


                            <path
                                d="
                                    M0 270
                                    C45 258 70 220 105 235
                                    C145 252 165 205 205 218
                                    C245 230 270 185 310 196
                                    C350 207 375 158 415 174
                                    C450 190 475 135 520 151
                                    C555 166 590 120 625 137
                                    C665 155 700 104 735 119
                                    C775 135 810 80 850 96
                                    C900 113 935 70 1000 55
                                "
                                fill="none"
                                stroke="#4F8CFF"
                                strokeWidth="3"
                                vectorEffect="non-scaling-stroke"
                            />

                        </svg>


                        <div className="chart-times">

                            <span>Sep 29</span>
                            <span>Sep 30</span>
                            <span>Oct 1</span>
                            <span>Oct 2</span>
                            <span>Oct 5</span>
                            <span>Oct 6</span>

                        </div>

                    </div>

                </div>

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

                        {indicators.map((indicator) => (

                            <div
                                className="indicator"
                                key={indicator.name}
                            >

                                <span>
                                    {indicator.name}
                                </span>


                                <strong>
                                    {indicator.value}
                                </strong>


                                <small
                                    className={
                                        indicator.status ===
                                        "Bullish"
                                            ? "bullish"
                                            : "neutral"
                                    }
                                >
                                    {indicator.status}
                                </small>

                            </div>

                        ))}

                    </div>

                </div>



                {/* AI */}

                <div className="details-card ai-analysis-card">

                    <div className="details-card-header">

                        <div>

                            <span>
                                MARKETMIND AI
                            </span>

                            <h3>
                                AI Insight
                            </h3>

                        </div>


                        <Sparkles
                            size={18}
                            className="ai-sparkle"
                        />

                    </div>


                    <div className="ai-insight-content">

                        <div className="ai-confidence">

                            <div>

                                <span>
                                    Confidence
                                </span>

                                <strong>
                                    78%
                                </strong>

                            </div>


                            <div className="confidence-bar">
                                <div></div>
                            </div>

                        </div>


                        <p>

                            {displaySymbol} is showing
                            moderately bullish momentum.
                            The stock is currently trading
                            above its 20-day and 50-day
                            moving averages, while RSI
                            remains below overbought territory.

                        </p>


                        <div className="ai-signal">

                            <TrendingUp size={16} />

                            <span>
                                Moderately Bullish
                            </span>

                        </div>

                    </div>

                </div>

            </section>



            {/* News */}

            <section className="details-card stock-news-card">

                <div className="details-card-header">

                    <div>

                        <span>
                            MARKET INTELLIGENCE
                        </span>

                        <h3>
                            Latest {displaySymbol} News
                        </h3>

                    </div>


                    <Newspaper size={18} />

                </div>


                <div className="stock-news-list">

                    {news.map((article, index) => (

                        <article
                            className="stock-news-item"
                            key={index}
                        >

                            <div className="news-number">
                                0{index + 1}
                            </div>


                            <div className="stock-news-content">

                                <h4>
                                    {article.title}
                                </h4>


                                <div>

                                    <span>
                                        {article.source}
                                    </span>

                                    <span>
                                        •
                                    </span>

                                    <span>
                                        {article.time}
                                    </span>

                                    <span
                                        className={
                                            article.sentiment ===
                                            "Positive"
                                                ? "news-positive"
                                                : "news-neutral"
                                        }
                                    >
                                        {article.sentiment}
                                    </span>

                                </div>

                            </div>


                            <ArrowUpRight
                                size={16}
                                className="news-arrow"
                            />

                        </article>

                    ))}

                </div>

            </section>

        </div>
    );
}


export default StockDetails;
