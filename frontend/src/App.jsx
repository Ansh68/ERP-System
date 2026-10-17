import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import { Skeleton } from "./components/ui/Skeleton";

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
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
                <p className="mt-4 text-xs font-medium text-slate-500 font-body">
                    Restoring authenticated ERP session...
                </p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <AppLayout>{children}</AppLayout>;
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
