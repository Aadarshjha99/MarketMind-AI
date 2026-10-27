import Sidebar from "../navigation/Sidebar";
import Navbar from "../navigation/Navbar";

import "./DashboardLayout.css";

function DashboardLayout({ children }) {
    return (
        <div className="app-layout">

            <Sidebar />

            <div className="main-area">

                <Navbar />

                <main className="main-content">
                    {children}
                </main>

            </div>

        </div>
    );
}

export default DashboardLayout;