import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState("sales");
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = async (tab) => {
        setLoading(true);
        setReportData(null);
        try {
            const endpoints = {
                sales: "/reports/sales",
                inventory: "/reports/inventory",
                production: "/reports/production",
                consumption: "/reports/material-consumption",
                dispatch: "/reports/dispatch",
                lowStock: "/reports/low-stock",
            };
            const res = await apiClient.get(endpoints[tab]);
            if (res.data?.success) {
                setReportData(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load report", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(activeTab);
    }, [activeTab]);

    const tabs = [
        { id: "sales", label: "Sales Report" },
        { id: "inventory", label: "Inventory Valuation" },
        { id: "production", label: "Production & Scrap %" },
        { id: "consumption", label: "Material Consumption" },
        { id: "dispatch", label: "Dispatch Performance" },
        { id: "lowStock", label: "Low Stock Replenishment" },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-4">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Analytical Management Reports</h1>
                <p className="text-xs text-gray-500">6 core manufacturing aggregations and operational audits</p>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto text-xs font-medium space-x-2">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`py-2 px-3 border-b-2 whitespace-nowrap transition-colors ${
                            activeTab === t.id
                                ? "border-blue-600 text-blue-600 font-bold"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Report Content */}
            <div className="bg-white rounded border border-gray-200 p-5 text-xs">
                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading analytical report data...</div>
                ) : !reportData ? (
                    <div className="text-center py-8 text-gray-400">No report data returned.</div>
                ) : (
                    <>
                        {/* ─── 1. SALES REPORT ─────────────────────────────────────── */}
                        {activeTab === "sales" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded">
                                    <div>
                                        <span className="text-gray-500">Total Orders:</span>
                                        <p className="text-lg font-bold">{reportData.summary?.totalOrders || 0}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Total Revenue:</span>
                                        <p className="text-lg font-bold text-emerald-700">
                                            ₹{Number(reportData.summary?.totalRevenue || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Avg Order Value:</span>
                                        <p className="text-lg font-bold text-blue-700">
                                            ₹{Math.round(reportData.summary?.avgOrderValue || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Top Selling Products</h3>
                                        <table className="w-full text-left border">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="p-2">Product</th>
                                                    <th className="p-2">Units</th>
                                                    <th className="p-2">Revenue</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {reportData.topProducts?.map((p, i) => (
                                                    <tr key={i}>
                                                        <td className="p-2 font-medium">{p.name}</td>
                                                        <td className="p-2">{p.totalQuantity}</td>
                                                        <td className="p-2 font-semibold">₹{p.totalRevenue?.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Top Corporate Clients</h3>
                                        <table className="w-full text-left border">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="p-2">Company</th>
                                                    <th className="p-2">Orders</th>
                                                    <th className="p-2">Total Spend</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {reportData.topCustomers?.map((c, i) => (
                                                    <tr key={i}>
                                                        <td className="p-2 font-medium">{c.companyName}</td>
                                                        <td className="p-2">{c.orderCount}</td>
                                                        <td className="p-2 font-semibold text-emerald-700">
                                                            ₹{c.totalSpent?.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── 2. INVENTORY REPORT ─────────────────────────────────── */}
                        {activeTab === "inventory" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded">
                                    <div>
                                        <span className="text-gray-500">Raw Materials Valuation:</span>
                                        <p className="text-lg font-bold">
                                            ₹{Number(reportData.rawMaterials?.totalValuation || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Finished Goods Valuation:</span>
                                        <p className="text-lg font-bold text-blue-700">
                                            ₹{Number(reportData.finishedGoods?.totalValuation || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Combined Total Valuation:</span>
                                        <p className="text-lg font-bold text-emerald-700">
                                            ₹{Number(reportData.totalValuation || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <h3 className="font-semibold text-gray-800">Warehouse Storage Distribution</h3>
                                <table className="w-full text-left border">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="p-2">Warehouse Bay</th>
                                            <th className="p-2">Distinct Items</th>
                                            <th className="p-2">Total Stock</th>
                                            <th className="p-2">Valuation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {reportData.warehouseBreakdown?.map((w, i) => (
                                            <tr key={i}>
                                                <td className="p-2 font-medium">{w._id || "Main Storage"}</td>
                                                <td className="p-2">{w.itemCount}</td>
                                                <td className="p-2">{w.totalStock?.toLocaleString()}</td>
                                                <td className="p-2 font-semibold">₹{w.valuation?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ─── 3. PRODUCTION & SCRAP RATE REPORT ───────────────────── */}
                        {activeTab === "production" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 gap-3 bg-gray-50 p-3 rounded">
                                    <div>
                                        <span className="text-gray-500">Total Plans:</span>
                                        <p className="text-lg font-bold">{reportData.totals?.totalPlans || 0}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Total Produced:</span>
                                        <p className="text-lg font-bold text-emerald-700">
                                            {reportData.totals?.totalProducedQty || 0} pcs
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Total Rejected / Scrap:</span>
                                        <p className="text-lg font-bold text-red-600">
                                            {reportData.totals?.totalRejectedQty || 0} pcs
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Scrap Rate %:</span>
                                        <p className="text-lg font-bold text-amber-700">
                                            {reportData.totals?.scrapRatePercentage || 0}%
                                        </p>
                                    </div>
                                </div>

                                <h3 className="font-semibold text-gray-800">Machine Line Performance</h3>
                                <table className="w-full text-left border">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="p-2">Machine Name</th>
                                            <th className="p-2">Jobs Run</th>
                                            <th className="p-2">Units Produced</th>
                                            <th className="p-2">Units Rejected</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {reportData.machinePerformance?.map((m, i) => (
                                            <tr key={i}>
                                                <td className="p-2 font-medium">{m._id}</td>
                                                <td className="p-2">{m.jobsCount}</td>
                                                <td className="p-2 font-semibold text-emerald-700">{m.producedQty}</td>
                                                <td className="p-2 text-red-600">{m.rejectedQty}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ─── 4. MATERIAL CONSUMPTION REPORT ───────────────────────── */}
                        {activeTab === "consumption" && (
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-3 rounded">
                                    <span className="text-gray-500">Total Manufacturing Input Cost Consumed:</span>
                                    <p className="text-xl font-bold text-emerald-800">
                                        ₹{Number(reportData.totalConsumptionCost || 0).toLocaleString()}
                                    </p>
                                </div>

                                <table className="w-full text-left border">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="p-2">Material Code</th>
                                            <th className="p-2">Name</th>
                                            <th className="p-2">Quantity Consumed</th>
                                            <th className="p-2">Unit Price</th>
                                            <th className="p-2">Total Consumed Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {reportData.materials?.map((m, i) => (
                                            <tr key={i}>
                                                <td className="p-2 font-mono font-medium">{m.materialCode}</td>
                                                <td className="p-2">{m.name}</td>
                                                <td className="p-2 font-semibold">
                                                    {m.totalConsumedQty} {m.unit}
                                                </td>
                                                <td className="p-2">₹{m.unitPrice}</td>
                                                <td className="p-2 font-bold text-gray-900">
                                                    ₹{m.totalConsumedCost?.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ─── 5. DISPATCH PERFORMANCE REPORT ───────────────────────── */}
                        {activeTab === "dispatch" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded">
                                    <div>
                                        <span className="text-gray-500">Total Shipments:</span>
                                        <p className="text-lg font-bold">{reportData.totalShipments || 0}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Delivered Consignments:</span>
                                        <p className="text-lg font-bold text-emerald-700">
                                            {reportData.statusBreakdown?.delivered || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">In-Transit / Out for Delivery:</span>
                                        <p className="text-lg font-bold text-blue-700">
                                            {(reportData.statusBreakdown?.in_transit || 0) +
                                                (reportData.statusBreakdown?.out_for_delivery || 0)}
                                        </p>
                                    </div>
                                </div>

                                <h3 className="font-semibold text-gray-800">Courier Carrier Performance</h3>
                                <table className="w-full text-left border">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="p-2">Courier</th>
                                            <th className="p-2">Total Assigned</th>
                                            <th className="p-2">Delivered</th>
                                            <th className="p-2">Completion Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {reportData.courierBreakdown?.map((c, i) => {
                                            const rate = c.totalShipments > 0 ? ((c.deliveredCount / c.totalShipments) * 100).toFixed(1) : 0;
                                            return (
                                                <tr key={i}>
                                                    <td className="p-2 font-medium">{c._id}</td>
                                                    <td className="p-2">{c.totalShipments}</td>
                                                    <td className="p-2 font-semibold text-emerald-700">{c.deliveredCount}</td>
                                                    <td className="p-2 font-bold">{rate}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ─── 6. LOW STOCK REPLENISHMENT REPORT ─────────────────────── */}
                        {activeTab === "lowStock" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 bg-red-50 p-3 rounded border border-red-200">
                                    <div>
                                        <span className="text-red-700">Critical Low Stock Items:</span>
                                        <p className="text-xl font-bold text-red-900">{reportData.lowStockCount || 0}</p>
                                    </div>
                                    <div>
                                        <span className="text-red-700">Est. Replenishment Procurement Cost:</span>
                                        <p className="text-xl font-bold text-red-900">
                                            ₹{Number(reportData.totalReplenishmentCost || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <table className="w-full text-left border">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="p-2">Material Code</th>
                                            <th className="p-2">Name</th>
                                            <th className="p-2">Current Stock</th>
                                            <th className="p-2">Min Level</th>
                                            <th className="p-2">Reorder Qty</th>
                                            <th className="p-2">Est. Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {reportData.materials?.map((m, i) => (
                                            <tr key={i}>
                                                <td className="p-2 font-mono font-medium text-gray-900">{m.materialCode}</td>
                                                <td className="p-2">{m.name}</td>
                                                <td className="p-2 font-bold text-red-600">
                                                    {m.currentStock} {m.unit}
                                                </td>
                                                <td className="p-2 text-gray-500">{m.minimumStockLevel}</td>
                                                <td className="p-2 font-semibold text-blue-700">
                                                    {m.recommendedReorderQty} {m.unit}
                                                </td>
                                                <td className="p-2 font-bold text-gray-900">
                                                    ₹{m.estimatedProcurementCost?.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
