
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Search,
    Bell,
    ChevronDown,
    User,
    Settings,
    LogOut,
    X
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { searchStocks } from "../../services/marketApi";

import "./Navbar.css";

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);

    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const displayName = user?.name || "User";

    const initials = displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    // Debounced stock search
    useEffect(() => {
        if (!search.trim()) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            try {
                setSearchLoading(true);

                const response = await searchStocks(search.trim());

                if (!cancelled) {
                    setSearchResults(response.data || []);
                }
            } catch (error) {
                console.error("Navbar stock search failed:", error);

                if (!cancelled) {
                    setSearchResults([]);
                }
            } finally {
                if (!cancelled) {
                    setSearchLoading(false);
                }
            }
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [search]);

    const handleStockSelect = (stock) => {
        setSearch("");
        setSearchResults([]);
        navigate(`/stocks/${stock.symbol}`);
    };

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

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

                {/* Functional Stock Search */}
                <div className="navbar-search-container">

                    <div className="stock-search">
                        <Search size={17} />

                        <input
                            type="text"
                            placeholder="Search stocks..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />

                        {search && (
                            <button
                                type="button"
                                className="search-clear"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}

                        {!search && (
                            <span className="search-shortcut">/</span>
                        )}
                    </div>

                    {search.trim() && (
                        <div className="navbar-search-results">

                            {searchLoading && (
                                <div className="navbar-search-message">
                                    Searching stocks...
                                </div>
                            )}

                            {!searchLoading &&
                                searchResults.length === 0 && (
                                    <div className="navbar-search-message">
                                        No stocks found
                                    </div>
                                )}

                            {!searchLoading &&
                                searchResults.map((stock) => (
                                    <button
                                        type="button"
                                        key={stock.instrumentKey}
                                        className="navbar-search-result"
                                        onClick={() =>
                                            handleStockSelect(stock)
                                        }
                                    >
                                        <div>
                                            <strong>{stock.symbol}</strong>
                                            <span>{stock.companyName}</span>
                                        </div>

                                        <small>{stock.exchange}</small>
                                    </button>
                                ))}
                        </div>
                    )}
                </div>

                {/* Notification Panel */}
                <div className="notification-container">

                    <button
                        className="navbar-icon-button"
                        type="button"
                        aria-label="Notifications"
                        aria-expanded={notificationOpen}
                        onClick={() => {
                            setNotificationOpen((prev) => !prev);
                            setProfileOpen(false);
                        }}
                    >
                        <Bell size={19} strokeWidth={1.8} />
                    </button>

                    {notificationOpen && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                <strong>Notifications</strong>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setNotificationOpen(false)
                                    }
                                    aria-label="Close notifications"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="notification-empty">
                                <Bell size={25} />
                                <strong>No notifications yet</strong>
                                <span>
                                    Your alerts and updates will appear here.
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="navbar-divider"></div>

                {/* Profile Dropdown */}
                <div className="profile-container">

                    <button
                        className="user-profile"
                        type="button"
                        onClick={() => {
                            setProfileOpen((prev) => !prev);
                            setNotificationOpen(false);
                        }}
                        aria-expanded={profileOpen}
                    >
                        <div className="user-avatar">
                            {initials || <User size={16} />}
                        </div>

                        <div className="user-info">
                            <strong>{displayName}</strong>
                            <span>{user?.role || "Investor"}</span>
                        </div>

                        <ChevronDown
                            size={16}
                            className={`user-chevron ${
                                profileOpen ? "rotated" : ""
                            }`}
                        />
                    </button>

                    {profileOpen && (
                        <div className="profile-dropdown">

                            <div className="profile-dropdown-header">
                                <strong>{displayName}</strong>
                                <span>{user?.email}</span>
                            </div>

                            <div className="profile-dropdown-divider"></div>

                            <button
                                type="button"
                                className="profile-dropdown-item"
                                onClick={() => {
                                    setProfileOpen(false);
                                    navigate("/settings");
                                }}
                            >
                                <Settings size={16} />
                                Settings
                            </button>

                            <button
                                type="button"
                                className="profile-dropdown-item logout-item"
                                onClick={handleLogout}
                            >
                                <LogOut size={16} />
                                Logout
                            </button>

                        </div>
                    )}
                </div>

            </div>
        </header>
    );
}

export default Navbar;
