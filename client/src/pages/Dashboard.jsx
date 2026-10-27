import {
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    TrendingDown,
    Activity,
    Wallet,
    Star,
    Newspaper,
    Sparkles
} from "lucide-react";

import "./Dashboard.css";

const marketStats = [
    {
        name: "NIFTY 50",
        value: "25,412.80",
        change: "+0.82%",
        positive: true
    },
    {
        name: "SENSEX",
        value: "83,104.32",
        change: "+0.61%",
        positive: true
    },
    {
        name: "NIFTY BANK",
        value: "56,821.45",
        change: "-0.34%",
        positive: false
    },
    {
        name: "NIFTY IT",
        value: "39,284.15",
        change: "+1.24%",
        positive: true
    }
];

const watchlist = [
    {
        symbol: "TCS",
        name: "Tata Consultancy Services",
        price: "₹3,421.60",
        change: "+1.24%",
        positive: true
    },
    {
        symbol: "INFY",
        name: "Infosys",
        price: "₹1,521.40",
        change: "+0.82%",
        positive: true
    },
    {
        symbol: "RELIANCE",
        name: "Reliance Industries",
        price: "₹1,482.30",
        change: "-0.46%",
        positive: false
    },
    {
        symbol: "ITC",
        name: "ITC Limited",
        price: "₹412.85",
        change: "+0.37%",
        positive: true
    }
];

const news = [
    {
        symbol: "MARKET",
        title: "Indian equities continue to show strong momentum",
        source: "Market Intelligence",
        time: "2h ago",
        sentiment: "Positive"
    },
    {
        symbol: "TCS",
        title: "Technology stocks gain amid improved global sentiment",
        source: "Market News",
        time: "4h ago",
        sentiment: "Positive"
    },
    {
        symbol: "ITC",
        title: "Consumer sector remains in focus as markets advance",
        source: "Financial News",
        time: "6h ago",
        sentiment: "Neutral"
    }
];

function Dashboard() {
    return (
        <div className="dashboard">

            {/* Header */}

            <section className="dashboard-header">
                <div>
                    <p className="dashboard-eyebrow">
                        MARKET OVERVIEW
                    </p>

                    <h2>
                        Good afternoon, Aadarsh
                    </h2>

                    <p className="dashboard-subtitle">
                        Here's what's happening across the market today.
                    </p>
                </div>

                <div className="market-status">
                    <span className="market-status-dot"></span>
                    Market Open
                </div>
            </section>

            {/* Market Cards */}

            <section className="market-cards">

                {marketStats.map((market) => (
                    <div
                        className="market-card"
                        key={market.name}
                    >
                        <div className="market-card-top">
                            <span>{market.name}</span>

                            {market.positive ? (
                                <TrendingUp size={16} />
                            ) : (
                                <TrendingDown size={16} />
                            )}
                        </div>

                        <div className="market-value">
                            {market.value}
                        </div>

                        <div
                            className={`market-change ${
                                market.positive
                                    ? "positive"
                                    : "negative"
                            }`}
                        >
                            {market.positive ? (
                                <ArrowUpRight size={14} />
                            ) : (
                                <ArrowDownRight size={14} />
                            )}

                            {market.change}

                            <span>today</span>
                        </div>
                    </div>
                ))}

            </section>

            {/* Main Grid */}

            <section className="dashboard-grid">

                {/* Market Performance */}

                <div className="dashboard-card performance-card">

                    <div className="card-header">
                        <div>
                            <span className="card-label">
                                MARKET PERFORMANCE
                            </span>

                            <h3>Market Trend</h3>
                        </div>

                        <div className="chart-periods">
                            <button className="active">
                                1D
                            </button>
                            <button>1W</button>
                            <button>1M</button>
                            <button>1Y</button>
                        </div>
                    </div>

                    <div className="chart-area">

                        <div className="chart-y-axis">
                            <span>25.5K</span>
                            <span>25.2K</span>
                            <span>24.9K</span>
                            <span>24.6K</span>
                        </div>

                        <div className="chart-placeholder">

                            <svg
                                viewBox="0 0 800 260"
                                preserveAspectRatio="none"
                            >
                                <defs>
                                    <linearGradient
                                        id="chartGradient"
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
                                    d="M0 205
                                    C45 195 60 175 95 184
                                    S145 155 180 168
                                    S225 130 260 145
                                    S310 115 345 128
                                    S390 92 425 110
                                    S470 78 505 95
                                    S550 65 585 80
                                    S630 55 665 68
                                    S720 40 800 52
                                    L800 260
                                    L0 260 Z"
                                    fill="url(#chartGradient)"
                                />

                                <path
                                    d="M0 205
                                    C45 195 60 175 95 184
                                    S145 155 180 168
                                    S225 130 260 145
                                    S310 115 345 128
                                    S390 92 425 110
                                    S470 78 505 95
                                    S550 65 585 80
                                    S630 55 665 68
                                    S720 40 800 52"
                                    fill="none"
                                    stroke="#4F8CFF"
                                    strokeWidth="2.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>

                            <div className="chart-x-axis">
                                <span>09:15</span>
                                <span>11:00</span>
                                <span>13:00</span>
                                <span>15:30</span>
                            </div>

                        </div>

                    </div>

                </div>

                {/* AI Sentiment */}

                <div className="dashboard-card sentiment-card">

                    <div className="card-header">
                        <div>
                            <span className="card-label">
                                AI INTELLIGENCE
                            </span>

                            <h3>Market Sentiment</h3>
                        </div>

                        <Sparkles
                            size={19}
                            className="ai-icon"
                        />
                    </div>

                    <div className="sentiment-content">

                        <div className="sentiment-score">
                            <span>72</span>
                            <small>/ 100</small>
                        </div>

                        <div className="sentiment-label">
                            <span className="sentiment-dot"></span>
                            Moderately Bullish
                        </div>

                        <p>
                            Market sentiment remains positive,
                            supported by strong technology and
                            banking sector momentum.
                        </p>

                        <div className="sentiment-bar">
                            <div></div>
                        </div>

                    </div>

                </div>

            </section>

            {/* Bottom Grid */}

            <section className="bottom-grid">

                {/* Watchlist */}

                <div className="dashboard-card watchlist-card">

                    <div className="card-header">

                        <div>
                            <span className="card-label">
                                YOUR WATCHLIST
                            </span>

                            <h3>Tracked Stocks</h3>
                        </div>

                        <Star
                            size={18}
                            className="card-icon"
                        />

                    </div>

                    <div className="stock-list">

                        {watchlist.map((stock) => (
                            <div
                                className="stock-row"
                                key={stock.symbol}
                            >

                                <div className="stock-identity">

                                    <div className="stock-symbol">
                                        {stock.symbol}
                                    </div>

                                    <span>
                                        {stock.name}
                                    </span>

                                </div>

                                <div className="stock-price">
                                    <strong>
                                        {stock.price}
                                    </strong>

                                    <span
                                        className={
                                            stock.positive
                                                ? "positive"
                                                : "negative"
                                        }
                                    >
                                        {stock.change}
                                    </span>
                                </div>

                            </div>
                        ))}

                    </div>

                </div>

                {/* News */}

                <div className="dashboard-card news-card">

                    <div className="card-header">

                        <div>
                            <span className="card-label">
                                MARKET INTELLIGENCE
                            </span>

                            <h3>Latest News</h3>
                        </div>

                        <Newspaper
                            size={18}
                            className="card-icon"
                        />

                    </div>

                    <div className="news-list">

                        {news.map((item, index) => (
                            <div
                                className="news-item"
                                key={index}
                            >

                                <div className="news-symbol">
                                    {item.symbol}
                                </div>

                                <div className="news-content">

                                    <h4>
                                        {item.title}
                                    </h4>

                                    <div className="news-meta">
                                        <span>
                                            {item.source}
                                        </span>

                                        <span>
                                            •
                                        </span>

                                        <span>
                                            {item.time}
                                        </span>

                                        <span
                                            className={`news-sentiment ${
                                                item.sentiment
                                                    .toLowerCase()
                                            }`}
                                        >
                                            {item.sentiment}
                                        </span>
                                    </div>

                                </div>

                            </div>
                        ))}

                    </div>

                </div>

            </section>

        </div>
    );
}

export default Dashboard;