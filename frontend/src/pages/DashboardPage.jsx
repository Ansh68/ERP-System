import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { Link } from "react-router-dom";

export default function DashboardPage() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchMetrics = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await apiClient.get("/dashboard/metrics");
            if (res.data?.success) {
                setMetrics(res.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load dashboard metrics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    if (loading && !metrics) {
        return <div className="p-8 text-center text-gray-500 text-sm">Loading dashboard metrics...</div>;
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-sm mb-4">
                    {error}
                </div>
                <button
                    onClick={fetchMetrics}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    const { kpis, orderStatusDistribution, recentOrders, recentActivities } = metrics || {};

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Manufacturing ERP Dashboard</h1>
                    <p className="text-xs text-gray-500">Live operational indicators and system statistics</p>
                </div>
                <button
                    onClick={fetchMetrics}
                    className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                    Refresh Data
                </button>
            </div>

            {/* Top Operational KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-3 rounded border border-gray-200">
                    <span className="text-[11px] font-medium text-gray-500 uppercase">Total Orders</span>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpis?.totalOrders || 0}</p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                    <span className="text-[11px] font-medium text-gray-500 uppercase">Pending Orders</span>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{kpis?.pendingOrders || 0}</p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                    <span className="text-[11px] font-medium text-gray-500 uppercase">Running Production</span>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{kpis?.runningProduction || 0}</p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                    <span className="text-[11px] font-medium text-gray-500 uppercase">Ready for Dispatch</span>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{kpis?.ordersReadyForDispatch || 0}</p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                    <span className="text-[11px] font-medium text-gray-500 uppercase">Low Stock Alerts</span>
                    <p className={`text-2xl font-bold mt-1 ${(kpis?.lowStockMaterials || 0) > 0 ? "text-red-600" : "text-gray-900"}`}>
                        {kpis?.lowStockMaterials || 0}
                    </p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                    <span className="text-[11px] font-medium text-gray-500 uppercase">Today's Output</span>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{kpis?.todayProduction || 0}</p>
                </div>
            </div>

            {/* Financial & Valuation Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Inventory Valuation Card */}
                <div className="bg-white p-4 rounded border border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-800 mb-3">Inventory Valuation</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-500">Raw Materials Stock Value:</span>
                            <span className="font-semibold">{formatCurrency(kpis?.inventoryValue?.rawMaterials)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-500">Finished Goods Commercial Value:</span>
                            <span className="font-semibold">{formatCurrency(kpis?.inventoryValue?.finishedGoods)}</span>
                        </div>
                        <div className="flex justify-between py-1 font-bold text-base text-blue-600">
                            <span>Total Inventory Valuation:</span>
                            <span>{formatCurrency(kpis?.inventoryValue?.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Revenue Summary Card */}
                <div className="bg-white p-4 rounded border border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-800 mb-3">Revenue Summary</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-500">Realized Revenue (Dispatched/Delivered):</span>
                            <span className="font-semibold text-emerald-600">{formatCurrency(kpis?.revenue?.realizedRevenue)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-500">Pipeline Revenue (Pending Orders):</span>
                            <span className="font-semibold text-amber-600">{formatCurrency(kpis?.revenue?.pipelineRevenue)}</span>
                        </div>
                        <div className="flex justify-between py-1 font-bold text-base text-gray-900">
                            <span>Total Lifetime Order Value:</span>
                            <span>{formatCurrency(kpis?.revenue?.totalOrderValue)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Lifecycle Distribution */}
            <div className="bg-white p-4 rounded border border-gray-200">
                <h2 className="text-sm font-semibold text-gray-800 mb-3">Order Status Pipeline</h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 text-center text-xs">
                    {[
                        "draft",
                        "approved",
                        "inventory_check",
                        "production_planned",
                        "in_production",
                        "quality_check",
                        "ready_for_dispatch",
                        "dispatched",
                        "delivered",
                    ].map((st) => (
                        <div key={st} className="p-2 bg-gray-50 rounded border border-gray-100">
                            <span className="font-bold text-base block text-gray-800">
                                {orderStatusDistribution?.[st] || 0}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-tight block truncate">
                                {st.replace("_", " ")}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Orders & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent Orders Table */}
                <div className="bg-white p-4 rounded border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-sm font-semibold text-gray-800">Recent Sales Orders</h2>
                        <Link to="/orders" className="text-xs text-blue-600 hover:underline">
                            View all &rarr;
                        </Link>
                    </div>
                    <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                <tr>
                                    <th className="p-2">Order #</th>
                                    <th className="p-2">Customer</th>
                                    <th className="p-2">Amount</th>
                                    <th className="p-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentOrders?.map((ord) => (
                                    <tr key={ord._id}>
                                        <td className="p-2 font-mono font-medium">{ord.orderNumber}</td>
                                        <td className="p-2">{ord.customer?.companyName || "N/A"}</td>
                                        <td className="p-2">{formatCurrency(ord.totalAmount)}</td>
                                        <td className="p-2">
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
                                                {ord.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activity Audit Log */}
                <div className="bg-white p-4 rounded border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-sm font-semibold text-gray-800">Recent Activity Log</h2>
                        <Link to="/audit" className="text-xs text-blue-600 hover:underline">
                            View audit &rarr;
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100 text-xs">
                        {recentActivities?.map((act) => (
                            <div key={act._id} className="py-2 flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-gray-800 block">{act.action}</span>
                                    <span className="text-[11px] text-gray-500">
                                        by {act.userName || "System"} on {act.resource}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(act.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
