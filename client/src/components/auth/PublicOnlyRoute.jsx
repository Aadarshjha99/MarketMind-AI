
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PublicOnlyRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-loading">
                <p>Loading MarketMind AI...</p>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/app" replace />;
    }

    return <Outlet />;
};

export default PublicOnlyRoute;
