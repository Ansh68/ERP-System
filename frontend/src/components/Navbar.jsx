import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
    const { user, logout, demoLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const handleRoleSwitch = async (roleEmail) => {
        try {
            await demoLogin(roleEmail);
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to switch role");
        }
    };

    const navLinks = [
        { path: "/", label: "Dashboard" },
        { path: "/orders", label: "Orders" },
        { path: "/customers", label: "Customers" },
        { path: "/raw-materials", label: "Raw Materials" },
        { path: "/products", label: "Products & BOM" },
        { path: "/production", label: "Production" },
        { path: "/qc", label: "Quality Control" },
        { path: "/dispatch", label: "Dispatch" },
        { path: "/reports", label: "Reports" },
        { path: "/audit", label: "Users & Audit" },
    ];

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            {/* Top Bar */}
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/" className="text-xl font-bold text-blue-600 tracking-tight">
                        FloData ERP
                    </Link>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                        Functional Test Suite
                    </span>
                </div>

                {user && (
                    <div className="flex items-center gap-4 text-sm">
                        {/* Current User Role Badge */}
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600 font-medium">{user.name}</span>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                                {user.role.replace("_", " ")}
                            </span>
                        </div>

                        {/* Quick Role Switcher for Testing */}
                        <div className="flex items-center gap-1 text-xs">
                            <span className="text-gray-400">Switch:</span>
                            <button
                                onClick={() => handleRoleSwitch("admin@flodata.com")}
                                className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                                title="Admin"
                            >
                                Admin
                            </button>
                            <button
                                onClick={() => handleRoleSwitch("sales@flodata.com")}
                                className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                                title="Sales Executive"
                            >
                                Sales
                            </button>
                            <button
                                onClick={() => handleRoleSwitch("inventory@flodata.com")}
                                className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                                title="Inventory Manager"
                            >
                                Inventory
                            </button>
                            <button
                                onClick={() => handleRoleSwitch("production@flodata.com")}
                                className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                                title="Production Manager"
                            >
                                Prod
                            </button>
                            <button
                                onClick={() => handleRoleSwitch("qc@flodata.com")}
                                className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                                title="Quality Inspector"
                            >
                                QC
                            </button>
                            <button
                                onClick={() => handleRoleSwitch("dispatch@flodata.com")}
                                className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                                title="Dispatch Manager"
                            >
                                Dispatch
                            </button>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="text-xs text-red-600 hover:text-red-700 font-medium border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            {user && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                    <nav className="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto text-sm">
                        {navLinks.map((tab) => {
                            const active = location.pathname === tab.path;
                            return (
                                <Link
                                    key={tab.path}
                                    to={tab.path}
                                    className={`px-3 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${
                                        active
                                            ? "border-blue-600 text-blue-600 bg-white"
                                            : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                                    }`}
                                >
                                    {tab.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </header>
    );
}
