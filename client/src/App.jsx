
import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Markets from "./pages/Markets";
import StockDetails from "./pages/StockDetails";

import Watchlist from "./pages/Watchlist";

import StockIntelligence from "./pages/StockIntelligence";

import Portfolio from "./pages/Portfolio";

import Settings from "./pages/Settings";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute";

function App() {
    return (
        <Routes>
            {/* Public pages */}
            <Route element={<PublicOnlyRoute />}>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Route>
            {/* Protected application pages */}
            <Route element={<ProtectedRoute />}>
                <Route
                    path="/app"
                    element={
                        <DashboardLayout>
                            <Dashboard />
                        </DashboardLayout>
                    }
                />
                <Route
                    path="/watchlist"
                    element={
                        <DashboardLayout>
                            <Watchlist />
                        </DashboardLayout>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <DashboardLayout>
                            <Settings />
                        </DashboardLayout>
                    }
                />
                <Route
                    path="/portfolio"
                    element={
                        <DashboardLayout>
                            <Portfolio />
                        </DashboardLayout>
                    }
                />
                <Route
                    path="/intelligence"
                    element={
                        <DashboardLayout>
                            <StockIntelligence />
                        </DashboardLayout>
                    }
                />
                <Route
                    path="/markets"
                    element={
                        <DashboardLayout>
                            <Markets />
                        </DashboardLayout>
                    }
                />
                <Route
                    path="/stocks/:symbol"
                    element={
                        <DashboardLayout>
                            <StockDetails />
                        </DashboardLayout>
                    }
                />
            </Route>

            {/* Unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
