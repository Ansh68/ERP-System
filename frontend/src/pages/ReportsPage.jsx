import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import {
    TrendingUp,
    Package,
    Cpu,
    Layers,
    Truck,
    AlertTriangle,
    Printer,
    RefreshCw,
    Calendar,
    DollarSign,
    CheckCircle2,
    ArrowUpRight,
    BarChart3,
    Building2,
    Boxes,
    FileText,
    Users,
    ShieldAlert,
    Clock,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { Input } from "../components/ui/Input";

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState("sales");
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Date filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

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

            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const res = await apiClient.get(endpoints[tab], { params });
            if (res.data?.success) {
                setReportData(res.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load report data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(activeTab);
    }, [activeTab]);

    const handleApplyDateFilter = (e) => {
        e.preventDefault();
        fetchReport(activeTab);
    };

    const handlePrint = () => {
        window.print();
    };

    const tabs = [
        { id: "sales", label: "Sales & Revenue", icon: TrendingUp },
        { id: "inventory", label: "Inventory Valuation", icon: Package },
        { id: "production", label: "Production & Scrap", icon: Cpu },
        { id: "consumption", label: "Raw Material Consumption", icon: Layers },
        { id: "dispatch", label: "Dispatch Logistics", icon: Truck },
        { id: "lowStock", label: "Low Stock Replenishment", icon: AlertTriangle },
    ];

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading tracking-tight">
                            Executive Reports & Intelligence
                        </h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 font-medium font-heading">
                            6 Core Audits
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-body mt-0.5">
                        Cross-departmental manufacturing analytics, cost breakdowns, and operational metrics
                    </p>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                    <Button
                        variant="secondary"
                        onClick={handlePrint}
                        className="rounded-xl gap-2 font-heading"
                    >
                        <Printer className="h-4 w-4" />
                        <span>Print / Export</span>
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => fetchReport(activeTab)}
                        className="rounded-xl gap-2 font-heading"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Date Range & Controls Filter Bar */}
            {["sales", "production", "consumption", "dispatch"].includes(activeTab) && (
                <Card className="rounded-2xl print:hidden">
                    <form onSubmit={handleApplyDateFilter} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-xs font-semibold text-slate-600 font-heading flex items-center gap-1.5 shrink-0">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            Date Period:
                        </span>
                        <div className="flex items-center gap-2 flex-1 max-w-lg">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                            />
                            <span className="text-slate-400 text-xs">to</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                            />
                        </div>
                        <Button type="submit" size="sm" className="rounded-xl font-heading shrink-0">
                            Apply Filter
                        </Button>
                        {(startDate || endDate) && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => { setStartDate(""); setEndDate(""); fetchReport(activeTab); }}
                                className="rounded-xl text-slate-500 hover:text-slate-900"
                            >
                                Reset
                            </Button>
                        )}
                    </form>
                </Card>
            )}

            {/* Tabs Strip */}
            <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/80 rounded-2xl text-xs font-heading print:hidden">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 font-medium ${
                                isActive
                                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <Icon className={`h-4 w-4 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Report Content Body */}
            {loading ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <Skeleton className="h-24 rounded-2xl" />
                        <Skeleton className="h-24 rounded-2xl" />
                        <Skeleton className="h-24 rounded-2xl" />
                    </div>
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            ) : !reportData ? (
                <Card className="rounded-2xl p-12 text-center text-slate-400 text-xs font-body">
                    No report analytical data returned for this selection.
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* ─── 1. SALES & REVENUE REPORT ─────────────────────────────── */}
                    {activeTab === "sales" && (
                        <div className="space-y-6">
                            {/* KPI Metrics */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                <Card className="rounded-2xl p-4 bg-white">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 font-medium font-heading">Total Sales Orders</span>
                                        <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-slate-900 font-heading">
                                            {reportData.summary?.totalOrders || 0}
                                        </span>
                                        <span className="text-xs text-slate-400 font-body">Active orders</span>
                                    </div>
                                </Card>

                                <Card className="rounded-2xl p-4 bg-white">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 font-medium font-heading">Gross Revenue</span>
                                        <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <DollarSign className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-emerald-700 font-heading">
                                            ₹{Number(reportData.summary?.totalRevenue || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </Card>

                                <Card className="rounded-2xl p-4 bg-white">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 font-medium font-heading">Average Order Value</span>
                                        <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                            <BarChart3 className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-purple-700 font-heading">
                                            ₹{Math.round(reportData.summary?.avgOrderValue || 0).toLocaleString()}
                                        </span>
                                        <span className="text-xs text-slate-400 font-body">per deal</span>
                                    </div>
                                </Card>
                            </div>

                            {/* Tables Grid: Top Products & Top Customers */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Top Products Table */}
                                <Card className="rounded-2xl">
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-900 font-heading">
                                            Top Revenue Generating Finished Goods
                                        </h3>
                                        <span className="text-[10px] text-slate-400">By Total Sold</span>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs font-body">
                                                <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-2.5 font-semibold font-heading">Product</th>
                                                        <th className="px-4 py-2.5 font-semibold font-heading">Qty Sold</th>
                                                        <th className="px-4 py-2.5 text-right font-semibold font-heading">Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {reportData.topProducts?.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="p-4 text-center text-slate-400">No product sales data.</td>
                                                        </tr>
                                                    ) : (
                                                        reportData.topProducts?.map((p, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                                <td className="px-4 py-2.5">
                                                                    <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                                                                        {p.name}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                                        {p.productCode}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2.5 text-slate-700 font-medium">
                                                                    {p.totalQuantity} pcs
                                                                </td>
                                                                <td className="px-4 py-2.5 text-right font-bold text-slate-900 font-heading">
                                                                    ₹{p.totalRevenue?.toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Top Customers Table */}
                                <Card className="rounded-2xl">
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-900 font-heading">
                                            Top Enterprise Clients by Gross Spend
                                        </h3>
                                        <span className="text-[10px] text-slate-400">Client Volume</span>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs font-body">
                                                <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-2.5 font-semibold font-heading">Client Company</th>
                                                        <th className="px-4 py-2.5 font-semibold font-heading">Orders</th>
                                                        <th className="px-4 py-2.5 text-right font-semibold font-heading">Total Spent</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {reportData.topCustomers?.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="p-4 text-center text-slate-400">No customer spend data.</td>
                                                        </tr>
                                                    ) : (
                                                        reportData.topCustomers?.map((c, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                                <td className="px-4 py-2.5">
                                                                    <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                                                                        {c.companyName}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 block truncate">
                                                                        Attn: {c.contactPerson}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2.5 text-slate-700 font-medium">
                                                                    {c.orderCount} deals
                                                                </td>
                                                                <td className="px-4 py-2.5 text-right font-bold text-emerald-700 font-heading">
                                                                    ₹{c.totalSpent?.toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* ─── 2. INVENTORY VALUATION REPORT ─────────────────────────── */}
                    {activeTab === "inventory" && (
                        <div className="space-y-6">
                            {/* Combined Total Valuation Banner */}
                            <Card className="rounded-2xl p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <span className="text-xs uppercase tracking-wider text-slate-300 font-heading block">
                                            Total Enterprise Inventory Asset Valuation
                                        </span>
                                        <h2 className="text-3xl font-extrabold font-heading mt-1 text-white tracking-tight">
                                            ₹{reportData.totalValuation?.toLocaleString()}
                                        </h2>
                                        <p className="text-xs text-slate-300 mt-1 font-body">
                                            Combined physical book value of raw materials stock and warehouse-ready finished goods
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs text-right">
                                            <span className="text-[10px] text-slate-300 uppercase block font-heading">Raw Stock Value</span>
                                            <span className="text-base font-bold text-sky-300 font-heading">
                                                ₹{reportData.rawMaterials?.totalValuation?.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs text-right">
                                            <span className="text-[10px] text-slate-300 uppercase block font-heading">FG Batches Value</span>
                                            <span className="text-base font-bold text-emerald-300 font-heading">
                                                ₹{reportData.finishedGoods?.totalValuation?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Split Cards: Raw Materials vs Finished Goods */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="rounded-2xl p-4 bg-white">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-5 w-5 text-sky-600" />
                                            <h3 className="text-xs font-bold text-slate-900 font-heading">Raw Materials Warehouse</h3>
                                        </div>
                                        <Badge variant="sky">Physical Assets</Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 py-3 text-center">
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-heading">CATALOG SKUS</span>
                                            <span className="text-base font-bold text-slate-900 font-heading">
                                                {reportData.rawMaterials?.totalItems || 0}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-heading">TOTAL STOCK</span>
                                            <span className="text-base font-bold text-slate-900 font-heading">
                                                {reportData.rawMaterials?.totalQuantity?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-heading">RESERVED</span>
                                            <span className="text-base font-bold text-amber-600 font-heading">
                                                {reportData.rawMaterials?.totalReserved?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="rounded-2xl p-4 bg-white">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <Boxes className="h-5 w-5 text-emerald-600" />
                                            <h3 className="text-xs font-bold text-slate-900 font-heading">Finished Goods Batches</h3>
                                        </div>
                                        <Badge variant="success">Ready for Dispatch</Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 py-3 text-center">
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-heading">BATCHES</span>
                                            <span className="text-base font-bold text-slate-900 font-heading">
                                                {reportData.finishedGoods?.totalBatches || 0}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-heading">TOTAL UNITS</span>
                                            <span className="text-base font-bold text-slate-900 font-heading">
                                                {reportData.finishedGoods?.totalUnits?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-heading">RESERVED</span>
                                            <span className="text-base font-bold text-amber-600 font-heading">
                                                {reportData.finishedGoods?.totalReserved?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Warehouse Locations Breakdown */}
                            <Card className="rounded-2xl">
                                <div className="p-4 border-b border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-900 font-heading">
                                        Warehouse Storage Bay Valuation Breakdown
                                    </h3>
                                </div>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs font-body">
                                            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-5 py-3 font-semibold font-heading">Warehouse Bay</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Catalog Items</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Physical Stock</th>
                                                    <th className="px-5 py-3 text-right font-semibold font-heading">Holding Valuation</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {reportData.warehouseBreakdown?.map((w, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="px-5 py-3 font-semibold text-slate-900 flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-slate-400" />
                                                            <span>{w._id || "Main Central Warehouse"}</span>
                                                        </td>
                                                        <td className="px-5 py-3 text-slate-600 font-medium">{w.itemCount} SKUs</td>
                                                        <td className="px-5 py-3 text-slate-600 font-medium">{w.totalStock?.toLocaleString()} units</td>
                                                        <td className="px-5 py-3 text-right font-bold text-slate-900 font-heading">
                                                            ₹{w.valuation?.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ─── 3. PRODUCTION & SCRAP REPORT ──────────────────────────── */}
                    {activeTab === "production" && (
                        <div className="space-y-6">
                            {/* KPI Metrics */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                                <Card className="rounded-2xl p-4 bg-white">
                                    <span className="text-xs text-slate-500 font-medium font-heading block">Scheduled Runs</span>
                                    <span className="text-2xl font-bold text-slate-900 font-heading mt-2 block">
                                        {reportData.totals?.totalPlans || 0}
                                    </span>
                                </Card>

                                <Card className="rounded-2xl p-4 bg-white">
                                    <span className="text-xs text-slate-500 font-medium font-heading block">Planned Units</span>
                                    <span className="text-2xl font-bold text-sky-700 font-heading mt-2 block">
                                        {reportData.totals?.totalPlannedQty?.toLocaleString() || 0}
                                    </span>
                                </Card>

                                <Card className="rounded-2xl p-4 bg-white">
                                    <span className="text-xs text-slate-500 font-medium font-heading block">Produced Units</span>
                                    <span className="text-2xl font-bold text-emerald-700 font-heading mt-2 block">
                                        {reportData.totals?.totalProducedQty?.toLocaleString() || 0}
                                    </span>
                                </Card>

                                <Card className="rounded-2xl p-4 bg-white">
                                    <span className="text-xs text-slate-500 font-medium font-heading block">Scrap / Defect Rate</span>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-rose-700 font-heading">
                                            {reportData.totals?.scrapRatePercentage || 0}%
                                        </span>
                                        <span className="text-xs text-slate-400 font-body">
                                            ({reportData.totals?.totalRejectedQty} rejected)
                                        </span>
                                    </div>
                                </Card>
                            </div>

                            {/* Machine Workstation Performance */}
                            <Card className="rounded-2xl">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-900 font-heading">
                                        Machine Workstation Performance & Defect Attribution
                                    </h3>
                                    <span className="text-[10px] text-slate-400">Shop Floor Metrics</span>
                                </div>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs font-body">
                                            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-5 py-3 font-semibold font-heading">Machine / Line</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Batches Run</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Produced Qty</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Rejected Qty</th>
                                                    <th className="px-5 py-3 text-right font-semibold font-heading">Yield %</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {reportData.machinePerformance?.map((m, idx) => {
                                                    const total = (m.producedQty || 0) + (m.rejectedQty || 0);
                                                    const yieldPct = total > 0 ? Math.round(((m.producedQty || 0) / total) * 100) : 100;
                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                            <td className="px-5 py-3 font-semibold text-slate-900">
                                                                {m._id || "Assembly Line 01"}
                                                            </td>
                                                            <td className="px-5 py-3 text-slate-700">{m.jobsCount} runs</td>
                                                            <td className="px-5 py-3 text-emerald-700 font-medium">{m.producedQty?.toLocaleString()} pcs</td>
                                                            <td className="px-5 py-3 text-rose-700 font-medium">{m.rejectedQty} pcs</td>
                                                            <td className="px-5 py-3 text-right font-bold text-slate-900 font-heading">
                                                                {yieldPct}%
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ─── 4. MATERIAL CONSUMPTION REPORT ────────────────────────── */}
                    {activeTab === "consumption" && (
                        <div className="space-y-6">
                            <Card className="rounded-2xl p-4 bg-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-slate-500 font-medium font-heading">Total Material Consumption Cost</span>
                                        <h2 className="text-2xl font-bold font-heading text-slate-900 mt-1">
                                            ₹{reportData.totalConsumptionCost?.toLocaleString()}
                                        </h2>
                                    </div>
                                    <Badge variant="sky">Issued to Shop Floor</Badge>
                                </div>
                            </Card>

                            <Card className="rounded-2xl">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-900 font-heading">
                                        Material Issuance & Consumption Ranked by Expenditure
                                    </h3>
                                    <span className="text-[10px] text-slate-400">Inventory Depletion</span>
                                </div>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs font-body">
                                            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-5 py-3 font-semibold font-heading">Raw Material</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Unit Cost</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Quantity Consumed</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Issuance Events</th>
                                                    <th className="px-5 py-3 text-right font-semibold font-heading">Total Value Consumed</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {reportData.materials?.map((m, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="px-5 py-3">
                                                            <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
                                                                {m.name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                {m.materialCode}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-slate-600 font-mono">₹{m.unitPrice}</td>
                                                        <td className="px-5 py-3 font-semibold text-slate-900">
                                                            {m.totalConsumedQty?.toLocaleString()} {m.unit}
                                                        </td>
                                                        <td className="px-5 py-3 text-slate-600">{m.transactionCount} issues</td>
                                                        <td className="px-5 py-3 text-right font-bold text-slate-900 font-heading">
                                                            ₹{m.totalConsumedCost?.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ─── 5. DISPATCH PERFORMANCE REPORT ────────────────────────── */}
                    {activeTab === "dispatch" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                <Card className="rounded-2xl p-4 bg-white">
                                    <span className="text-xs text-slate-500 font-medium font-heading block">Total Dispatches</span>
                                    <span className="text-2xl font-bold text-slate-900 font-heading mt-2 block">
                                        {reportData.totalShipments || 0}
                                    </span>
                                </Card>

                                <Card className="rounded-2xl p-4 bg-white">
                                    <span className="text-xs text-slate-500 font-medium font-heading block">Delivered Shipments</span>
                                    <span className="text-2xl font-bold text-emerald-700 font-heading mt-2 block">
                                        {reportData.statusBreakdown?.delivered || 0}
                                    </span>
                                </Card>

                                <Card className="rounded-2xl p-4 bg-white">
                                    <span className="text-xs text-slate-500 font-medium font-heading block">In Transit / Out for Delivery</span>
                                    <span className="text-2xl font-bold text-sky-700 font-heading mt-2 block">
                                        {(reportData.statusBreakdown?.in_transit || 0) + (reportData.statusBreakdown?.out_for_delivery || 0)}
                                    </span>
                                </Card>
                            </div>

                            {/* Courier Partners Table */}
                            <Card className="rounded-2xl">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-900 font-heading">
                                        Carrier Partner Performance Breakdown
                                    </h3>
                                    <span className="text-[10px] text-slate-400">Courier SLA</span>
                                </div>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs font-body">
                                            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-5 py-3 font-semibold font-heading">Carrier Partner</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Assigned Shipments</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Delivered</th>
                                                    <th className="px-5 py-3 text-right font-semibold font-heading">Fulfillment Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {reportData.courierBreakdown?.map((c, idx) => {
                                                    const rate = c.totalShipments > 0 ? Math.round((c.deliveredCount / c.totalShipments) * 100) : 0;
                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                            <td className="px-5 py-3 font-semibold text-slate-900 flex items-center gap-2">
                                                                <Truck className="h-4 w-4 text-slate-400" />
                                                                <span>{c._id || "FloData Express"}</span>
                                                            </td>
                                                            <td className="px-5 py-3 text-slate-700 font-medium">{c.totalShipments} consignments</td>
                                                            <td className="px-5 py-3 text-emerald-700 font-medium">{c.deliveredCount} fulfilled</td>
                                                            <td className="px-5 py-3 text-right font-bold text-slate-900 font-heading">
                                                                {rate}%
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ─── 6. LOW STOCK REPLENISHMENT REPORT ─────────────────────── */}
                    {activeTab === "lowStock" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <Card className="rounded-2xl p-4 bg-white border-rose-200/80 bg-rose-50/20">
                                    <span className="text-xs text-rose-700 font-bold font-heading block">
                                        Critical Stock Alerts (≤ Min Threshold)
                                    </span>
                                    <span className="text-2xl font-extrabold text-rose-800 font-heading mt-2 block">
                                        {reportData.lowStockCount || 0} Materials
                                    </span>
                                </Card>

                                <Card className="rounded-2xl p-4 bg-white">
                                    <span className="text-xs text-slate-500 font-medium font-heading block">
                                        Estimated Procurement Replenishment Cost
                                    </span>
                                    <span className="text-2xl font-bold text-slate-900 font-heading mt-2 block">
                                        ₹{reportData.totalReplenishmentCost?.toLocaleString() || 0}
                                    </span>
                                </Card>
                            </div>

                            <Card className="rounded-2xl">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-900 font-heading">
                                        Materials Below Safety Threshold Requiring Purchase Orders
                                    </h3>
                                    <span className="text-[10px] text-slate-400">Reorder Planning</span>
                                </div>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs font-body">
                                            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-5 py-3 font-semibold font-heading">Material</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Warehouse</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Current Stock</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Min Level</th>
                                                    <th className="px-5 py-3 font-semibold font-heading">Recommended Reorder</th>
                                                    <th className="px-5 py-3 text-right font-semibold font-heading">Est. Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {reportData.materials?.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="p-6 text-center text-emerald-600 font-medium">
                                                            All raw materials are currently above minimum safety thresholds.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    reportData.materials?.map((m, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                            <td className="px-5 py-3">
                                                                <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                                                                    {m.name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-mono">
                                                                    {m.materialCode}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3 text-slate-600">{m.warehouse}</td>
                                                            <td className="px-5 py-3 text-rose-700 font-bold">
                                                                {m.currentStock} {m.unit}
                                                            </td>
                                                            <td className="px-5 py-3 text-slate-500 font-medium">
                                                                {m.minimumStockLevel} {m.unit}
                                                            </td>
                                                            <td className="px-5 py-3 text-sky-700 font-semibold">
                                                                +{m.recommendedReorderQty} {m.unit}
                                                            </td>
                                                            <td className="px-5 py-3 text-right font-bold text-slate-900 font-heading">
                                                                ₹{m.estimatedProcurementCost?.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
