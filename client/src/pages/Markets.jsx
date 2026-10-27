import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Search,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Star,
    SlidersHorizontal
} from "lucide-react";

import {
    searchStocks,
    getStockQuote
} from "../services/marketApi";

import "./Markets.css";


const stocks = [
    {
        symbol: "TCS",
        name: "Tata Consultancy Services",
        sector: "Information Technology"
    },
    {
        symbol: "INFY",
        name: "Infosys Limited",
        sector: "Information Technology"
    },
    {
        symbol: "RELIANCE",
        name: "Reliance Industries",
        sector: "Oil & Gas"
    },
    {
        symbol: "HDFCBANK",
        name: "HDFC Bank",
        sector: "Banking"
    },
    {
        symbol: "ITC",
        name: "ITC Limited",
        sector: "FMCG"
    },
    {
        symbol: "WIPRO",
        name: "Wipro Limited",
        sector: "Information Technology"
    }
];


function Markets() {

    const navigate = useNavigate();

    const [quotes, setQuotes] = useState({});
    const [quotesLoading, setQuotesLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);


    // --------------------------------
    // Load Quotes
    // --------------------------------

    useEffect(() => {

        const loadQuotes = async () => {

            try {

                setQuotesLoading(true);

                const results = await Promise.all(
                    stocks.map(async (stock) => {

                        try {

                            const response =
                                await getStockQuote(stock.symbol);

                            return {
                                symbol: stock.symbol,
                                quote: response.data
                            };

                        } catch (error) {

                            console.error(
                                `Failed to load ${stock.symbol}:`,
                                error
                            );

                            return {
                                symbol: stock.symbol,
                                quote: null
                            };
                        }
                    })
                );


                const quoteMap = {};

                results.forEach(({ symbol, quote }) => {
                    quoteMap[symbol] = quote;
                });

                setQuotes(quoteMap);

            } finally {

                setQuotesLoading(false);

            }
        };


        loadQuotes();

    }, []);


    // --------------------------------
    // Stock Search
    // --------------------------------

    useEffect(() => {

        const searchMarket = async () => {

            if (!search.trim()) {

                setSearchResults([]);

                return;
            }


            try {

                setSearchLoading(true);

                const response =
                    await searchStocks(search.trim());

                setSearchResults(
                    response.data || []
                );

            } catch (error) {

                console.error(
                    "Stock search failed:",
                    error
                );

                setSearchResults([]);

            } finally {

                setSearchLoading(false);

            }
        };


        const timer = setTimeout(
            searchMarket,
            400
        );


        return () =>
            clearTimeout(timer);

    }, [search]);


    // --------------------------------
    // Helpers
    // --------------------------------

    const formatPrice = (value) => {

        if (value === undefined || value === null) {
            return "--";
        }

        return `₹${value.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )}`;
    };


    const formatVolume = (value) => {

        if (value === undefined || value === null) {
            return "--";
        }

        return value.toLocaleString("en-IN");
    };


    // --------------------------------
    // UI
    // --------------------------------

    return (
        <div className="markets-page">


            {/* Page Header */}

            <section className="markets-header">

                <div>

                    <p className="markets-eyebrow">
                        MARKET DATA
                    </p>

                    <h2>
                        Markets
                    </h2>

                    <p>
                        Explore stocks, prices and market
                        performance.
                    </p>

                </div>


                <div className="market-live-status">

                    <span></span>

                    Live Market

                </div>

            </section>



            {/* Search + Filters */}

            <section className="markets-toolbar">

                <div className="markets-search">

                    <Search size={17} />

                    <input
                        type="text"
                        placeholder="Search stocks or companies..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />

                    <span>/</span>

                </div>


                {/* Search Results */}

                {search.trim() && (

                    <div className="stock-search-results">

                        {searchLoading && (

                            <div className="search-result-message">
                                Searching stocks...
                            </div>

                        )}


                        {!searchLoading &&
                            searchResults.length === 0 && (

                                <div className="search-result-message">
                                    No stocks found
                                </div>

                            )}


                        {!searchLoading &&
                            searchResults.map((stock) => (

                                <button
                                    key={stock.instrumentKey}
                                    className="search-result-item"

                                    onClick={() => {

                                        setSearch("");
                                        setSearchResults([]);

                                        navigate(
                                            `/stocks/${stock.symbol}`
                                        );

                                    }}
                                >

                                    <div>

                                        <strong>
                                            {stock.symbol}
                                        </strong>

                                        <span>
                                            {stock.companyName}
                                        </span>

                                    </div>


                                    <span className="search-result-exchange">
                                        {stock.exchange}
                                    </span>

                                </button>

                            ))}

                    </div>

                )}


                <button className="filter-button">

                    <SlidersHorizontal size={15} />

                    Filters

                </button>

            </section>



            {/* Market Overview */}

            <section className="market-overview">

                <div className="overview-item">

                    <div className="overview-icon positive-bg">
                        <TrendingUp size={17} />
                    </div>

                    <div>
                        <span>Advancing</span>
                        <strong>—</strong>
                    </div>

                </div>


                <div className="overview-item">

                    <div className="overview-icon negative-bg">
                        <TrendingDown size={17} />
                    </div>

                    <div>
                        <span>Declining</span>
                        <strong>—</strong>
                    </div>

                </div>


                <div className="overview-item">

                    <div className="overview-icon neutral-bg">
                        <span>—</span>
                    </div>

                    <div>
                        <span>Unchanged</span>
                        <strong>—</strong>
                    </div>

                </div>


                <div className="overview-item">

                    <div className="overview-index">
                        N50
                    </div>

                    <div>
                        <span>NIFTY 50</span>
                        <strong>—</strong>
                    </div>

                </div>

            </section>



            {/* Stock Table */}

            <section className="markets-table-card">


                <div className="table-header">

                    <div>

                        <span className="table-label">
                            NSE EQUITIES
                        </span>

                        <h3>
                            Stocks
                        </h3>

                    </div>


                    <span className="stock-count">
                        {stocks.length} stocks
                    </span>

                </div>



                <div className="stock-table">


                    {/* Table Heading */}

                    <div className="table-row table-heading">

                        <span>STOCK</span>

                        <span>SECTOR</span>

                        <span>PRICE</span>

                        <span>CHANGE</span>

                        <span>VOLUME</span>

                        <span></span>

                    </div>



                    {/* Loading */}

                    {quotesLoading && (

                        <div className="market-data-loading">
                            Loading live market data...
                        </div>

                    )}



                    {/* Stocks */}

                    {!quotesLoading &&
                        stocks.map((stock) => {

                            const quote =
                                quotes[stock.symbol];


                            const price =
                                quote?.price;


                            const change =
                                quote?.change ?? 0;


                            const changePercent =
                                quote?.changePercent ?? 0;


                            const volume =
                                quote?.volume ?? 0;


                            const positive =
                                change >= 0;


                            return (

                                <div
                                    className="table-row stock-data-row"
                                    key={stock.symbol}

                                    onClick={() =>
                                        navigate(
                                            `/stocks/${stock.symbol}`
                                        )
                                    }
                                >


                                    {/* Stock */}

                                    <div className="stock-name-cell">

                                        <div className="market-stock-icon">
                                            {stock.symbol.substring(
                                                0,
                                                2
                                            )}
                                        </div>


                                        <div>

                                            <strong>
                                                {stock.symbol}
                                            </strong>

                                            <span>
                                                {stock.name}
                                            </span>

                                        </div>

                                    </div>



                                    {/* Sector */}

                                    <span className="sector-cell">
                                        {stock.sector}
                                    </span>



                                    {/* Price */}

                                    <strong className="price-cell">

                                        {formatPrice(price)}

                                    </strong>



                                    {/* Change */}

                                    <div
                                        className={`change-cell ${
                                            positive
                                                ? "positive"
                                                : "negative"
                                        }`}
                                    >

                                        {positive ? (
                                            <ArrowUpRight size={14} />
                                        ) : (
                                            <ArrowDownRight size={14} />
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



                                    {/* Volume */}

                                    <span className="volume-cell">

                                        {quote
                                            ? formatVolume(volume)
                                            : "--"}

                                    </span>



                                    {/* Watchlist */}

                                    <button
                                        className="watch-button"

                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                    >

                                        <Star size={16} />

                                    </button>


                                </div>

                            );

                        })}

                </div>

            </section>

        </div>
    );
}


export default Markets;
