import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import CustomersPage from "./pages/CustomersPage";
import RawMaterialsPage from "./pages/RawMaterialsPage";
import ProductsPage from "./pages/ProductsPage";
import ProductionPage from "./pages/ProductionPage";
import QualityControlPage from "./pages/QualityControlPage";
import DispatchPage from "./pages/DispatchPage";
import ReportsPage from "./pages/ReportsPage";
import UsersAuditPage from "./pages/UsersAuditPage";

// Protected Route Guard
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
                Checking session...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <Navbar />
            <main>{children}</main>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Login */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected ERP Modules */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/orders"
                        element={
                            <ProtectedRoute>
                                <OrdersPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/customers"
                        element={
                            <ProtectedRoute>
                                <CustomersPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/raw-materials"
                        element={
                            <ProtectedRoute>
                                <RawMaterialsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/products"
                        element={
                            <ProtectedRoute>
                                <ProductsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/production"
                        element={
                            <ProtectedRoute>
                                <ProductionPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/qc"
                        element={
                            <ProtectedRoute>
                                <QualityControlPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dispatch"
                        element={
                            <ProtectedRoute>
                                <DispatchPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports"
                        element={
                            <ProtectedRoute>
                                <ReportsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/audit"
                        element={
                            <ProtectedRoute>
                                <UsersAuditPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}
