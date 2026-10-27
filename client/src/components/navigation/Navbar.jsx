import {
    Search,
    Bell,
    ChevronDown,
    User
} from "lucide-react";

import "./Navbar.css";

function Navbar() {
    return (
        <header className="navbar">

            <div className="navbar-left">
                <div className="page-context">
                    <span className="page-context-label">
                        MARKET INTELLIGENCE
                    </span>

                    <h1>Overview</h1>
                </div>
            </div>

            <div className="navbar-right">

                <div className="stock-search">
                    <Search size={17} />

                    <input
                        type="text"
                        placeholder="Search stocks..."
                    />

                    <span className="search-shortcut">
                        /
                    </span>
                </div>

                <button className="navbar-icon-button">
                    <Bell size={19} strokeWidth={1.8} />

                    <span className="notification-dot"></span>
                </button>

                <div className="navbar-divider"></div>

                <button className="user-profile">
                    <div className="user-avatar">
                        A
                    </div>

                    <div className="user-info">
                        <strong>Aadarsh</strong>
                        <span>Investor</span>
                    </div>

                    <ChevronDown
                        size={16}
                        className="user-chevron"
                    />
                </button>

            </div>

        </header>
    );
}

export default Navbar;