import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import {
    LayoutDashboard,
    TrendingUp,
    Star,
    BriefcaseBusiness,
    Newspaper,
    Sparkles,
    BarChart3,
    Settings
} from "lucide-react";

const navigation = [
    {
        section: "MAIN",
        items: [
            { name: "Dashboard", path: "/", icon: LayoutDashboard },
            { name: "Markets", path: "/markets", icon: TrendingUp },
            { name: "Watchlist", path: "/watchlist", icon: Star },
            { name: "Portfolio", path: "/portfolio", icon: BriefcaseBusiness }
        ]
    },
    {
        section: "INTELLIGENCE",
        items: [
            { name: "News", path: "/news", icon: Newspaper },
            { name: "AI Insights", path: "/ai-insights", icon: Sparkles },
            { name: "Analytics", path: "/analytics", icon: BarChart3 }
        ]
    },
    {
        section: "SYSTEM",
        items: [
            { name: "Settings", path: "/settings", icon: Settings }
        ]
    }
];

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-mark">M</div>

                <div>
                    <h2>MarketMind</h2>
                    <span>AI</span>
                </div>
            </div>

            <nav className="sidebar-navigation">
                {navigation.map((group) => (
                    <div className="nav-group" key={group.section}>
                        <p className="nav-section-title">
                            {group.section}
                        </p>

                        {group.items.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `nav-item ${
                                            isActive ? "active" : ""
                                        }`
                                    }
                                >
                                    <Icon size={18} strokeWidth={1.8} />
                                    <span>{item.name}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="ai-status">
                    <span className="status-dot"></span>

                    <div>
                        <strong>MarketMind AI</strong>
                        <small>Intelligence active</small>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;