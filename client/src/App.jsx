import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Markets from "./pages/Markets";
import StockDetails from "./pages/StockDetails";

function App() {
    return (
        <DashboardLayout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/markets" element={<Markets />} />
                <Route
                    path="/stocks/:symbol"
                    element={<StockDetails />}
                />
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </DashboardLayout>
    );
}

export default App;