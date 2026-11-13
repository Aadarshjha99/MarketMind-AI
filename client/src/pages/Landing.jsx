
import { Link } from "react-router-dom";

import {
    ArrowRight,
    TrendingUp,
    BrainCircuit,
    Newspaper,
    ChartNoAxesCombined,
    ShieldCheck,
    Zap
} from "lucide-react";

import "./Landing.css";

function Landing() {
    return (
        <div className="landing-page">

            {/* Navbar */}
            <header className="landing-navbar">
                <Link to="/" className="landing-brand">
                    <div className="landing-logo">M</div>
                    <span>MarketMind <strong>AI</strong></span>
                </Link>

                <nav className="landing-nav-links">
                    <a href="#features">Features</a>
                    <a href="#about">About</a>
                </nav>

                <div className="landing-nav-actions">
                    <Link to="/login" className="landing-login">
                        Log in
                    </Link>

                    <Link to="/register" className="landing-get-started">
                        Get Started
                        <ArrowRight size={15} />
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="landing-hero">

                <div className="hero-content">

                    <div className="hero-badge">
                        <span className="hero-status-dot"></span>
                        INTELLIGENCE FOR SMARTER INVESTING
                    </div>

                    <h1>
                        Think Smarter.
                        <br />
                        <span>Invest Better.</span>
                    </h1>

                    <p className="hero-description">
                        Make informed investment decisions with AI-powered
                        stock analysis, market intelligence, technical
                        indicators and financial news — all in one place.
                    </p>

                    <div className="hero-actions">
                        <Link
                            to="/register"
                            className="hero-primary-button"
                        >
                            Explore MarketMind
                            <ArrowRight size={17} />
                        </Link>

                        <Link
                            to="/login"
                            className="hero-secondary-button"
                        >
                            Sign in
                        </Link>
                    </div>

                    <div className="hero-trust">
                        <ShieldCheck size={16} />
                        <span>Built for data-driven investors</span>
                    </div>

                </div>

                {/* Dashboard Preview */}
                <div className="hero-visual">

                    <div className="preview-glow"></div>

                    <div className="preview-window">

                        <div className="preview-topbar">
                            <div className="preview-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>

                            <span>MARKET OVERVIEW</span>

                            <div className="preview-live">
                                <span></span>
                                LIVE
                            </div>
                        </div>

                        <div className="preview-content">

                            <div className="preview-heading">
                                <div>
                                    <small>PORTFOLIO OVERVIEW</small>
                                    <h3>Market Intelligence</h3>
                                </div>

                                <TrendingUp color="#20C997" size={22} />
                            </div>

                            <div className="preview-stats">

                                <div className="preview-stat">
                                    <span>Market sentiment</span>
                                    <strong className="positive">
                                        Bullish
                                    </strong>
                                </div>

                                <div className="preview-stat">
                                    <span>AI insights</span>
                                    <strong>Available</strong>
                                </div>

                            </div>

                            <div className="preview-chart-heading">
                                <span>Market trend</span>
                                <span>Illustrative preview</span>
                            </div>

                            <div className="preview-chart">
                                <svg
                                    viewBox="0 0 500 160"
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
                                                stopOpacity="0.3"
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#4F8CFF"
                                                stopOpacity="0"
                                            />
                                        </linearGradient>
                                    </defs>

                                    <path
                                        d="M0 130 L45 115 L90 120 L135 85 L180 100 L225 65 L270 80 L315 42 L360 55 L405 25 L450 40 L500 12 L500 160 L0 160 Z"
                                        fill="url(#chartGradient)"
                                    />

                                    <path
                                        d="M0 130 L45 115 L90 120 L135 85 L180 100 L225 65 L270 80 L315 42 L360 55 L405 25 L450 40 L500 12"
                                        fill="none"
                                        stroke="#4F8CFF"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>

                            <div className="preview-bottom">
                                <div>
                                    <span>AI-powered analysis</span>
                                    <strong>Market insights at a glance</strong>
                                </div>

                                <BrainCircuit
                                    size={26}
                                    color="#8B7CFF"
                                />
                            </div>

                        </div>
                    </div>
                </div>

            </section>

            {/* Features */}
            <section className="landing-features" id="features">

                <div className="section-heading">
                    <span>WHAT WE OFFER</span>
                    <h2>
                        Everything you need to
                        <br />
                        understand the market.
                    </h2>
                    <p>
                        Powerful tools designed to turn market data
                        into meaningful insights.
                    </p>
                </div>

                <div className="feature-grid">

                    <div className="feature-card">
                        <div className="feature-icon blue">
                            <BrainCircuit size={23} />
                        </div>

                        <h3>AI-Powered Insights</h3>

                        <p>
                            Explore machine learning-based market
                            predictions and sentiment analysis.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon purple">
                            <ChartNoAxesCombined size={23} />
                        </div>

                        <h3>Technical Analysis</h3>

                        <p>
                            Understand price movements with historical
                            charts and technical indicators.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon green">
                            <Newspaper size={23} />
                        </div>

                        <h3>Market News</h3>

                        <p>
                            Follow relevant financial news and explore
                            market sentiment.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon orange">
                            <Zap size={23} />
                        </div>

                        <h3>Market Intelligence</h3>

                        <p>
                            Bring stock information, analysis and
                            insights together in one workspace.
                        </p>
                    </div>

                </div>

            </section>

            {/* About */}
            <section className="landing-about" id="about">
                <div>
                    <span>YOUR MARKET WORKSPACE</span>
                    <h2>
                        Data is powerful.
                        <br />
                        Understanding it is better.
                    </h2>
                </div>

                <Link to="/register" className="landing-get-started">
                    Get Started
                    <ArrowRight size={16} />
                </Link>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <Link to="/" className="landing-brand">
                    <div className="landing-logo">M</div>
                    <span>MarketMind <strong>AI</strong></span>
                </Link>

                <p>
                    © {new Date().getFullYear()} MarketMind AI.
                    Built for smarter market decisions.
                </p>
            </footer>

        </div>
    );
}

export default Landing;