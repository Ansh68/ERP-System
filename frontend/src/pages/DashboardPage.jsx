import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
    ShoppingCart,
    Clock,
    Factory,
    Truck,
    AlertTriangle,
    CheckCircle2,
    RotateCw,
    TrendingUp,
    Boxes,
    Package,
    ArrowUpRight,
    ArrowRight,
    Building2,
    DollarSign,
    Layers,
    FileText,
    ShieldAlert,
    ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";

export default function DashboardPage() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const fetchMetrics = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        else setLoading(true);
        setError("");

        try {
            const res = await apiClient.get("/dashboard/metrics");
            if (res.data?.success) {
                setMetrics(res.data.data);
                if (isManual) {
                    toast.success("Operational metrics updated");
                }
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to load dashboard metrics";
            setError(msg);
            if (isManual) toast.error(msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const statusBadgeMap = {
        draft: { label: "Draft", variant: "slate" },
        approved: { label: "Approved", variant: "default" },
        inventory_check: { label: "Inv Check", variant: "warning" },
        production_planned: { label: "Planned", variant: "indigo" },
        in_production: { label: "In Production", variant: "warning" },
        quality_check: { label: "Quality Check", variant: "purple" },
        ready_for_dispatch: { label: "Ready to Ship", variant: "success" },
        dispatched: { label: "Dispatched", variant: "default" },
        delivered: { label: "Delivered", variant: "success" },
        cancelled: { label: "Cancelled", variant: "danger" },
    };

    if (loading && !metrics) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="space-y-1.5">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-9 w-28 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error && !metrics) {
        return (
            <div className="p-8 text-center max-w-md mx-auto space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="font-heading font-semibold text-slate-900 text-lg">
                        Failed to Load Dashboard
                    </h3>
                    <p className="text-xs text-slate-500 font-body mt-1">{error}</p>
                </div>
                <Button onClick={() => fetchMetrics(true)} variant="default" size="sm">
                    Try Again
                </Button>
            </div>
        );
    }

    const { kpis, orderStatusDistribution, recentOrders, recentActivities } = metrics || {};

    const rawVal = kpis?.inventoryValue?.rawMaterials || 0;
    const fgVal = kpis?.inventoryValue?.finishedGoods || 0;
    const totalVal = kpis?.inventoryValue?.total || (rawVal + fgVal) || 1;
    const rawPct = Math.round((rawVal / totalVal) * 100) || 50;
    const fgPct = 100 - rawPct;

    const realizedRev = kpis?.revenue?.realizedRevenue || 0;
    const totalRev = kpis?.revenue?.totalOrderValue || 0;
    const revPct = totalRev > 0 ? Math.round((realizedRev / totalRev) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Top Page Header (Vantus style) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading tracking-tight">
                            Operational Dashboard
                        </h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 font-medium">
                            Live ERP
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-body mt-0.5">
                        Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Here is your manufacturing overview.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={refreshing}
                        onClick={() => fetchMetrics(true)}
                        className="rounded-xl gap-2 font-heading"
                    >
                        <RotateCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
                        <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                    </Button>
                </div>
            </div>

            {/* Top Operational KPI Cards (Vantus Grid Style) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
                {/* Total Orders */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
                            Total Orders
                        </span>
                        <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                            <ShoppingCart className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
                            {kpis?.totalOrders || 0}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10.5px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                Active Pipeline
                            </span>
                        </div>
                    </div>
                </div>

                {/* Pending Orders */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
                            Pending Orders
                        </span>
                        <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-amber-600 font-heading tracking-tight">
                            {kpis?.pendingOrders || 0}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10.5px] text-slate-400">Needs fulfillment</span>
                        </div>
                    </div>
                </div>

                {/* Running Production */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
                            Production
                        </span>
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Factory className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
                            {kpis?.runningProduction || 0}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10.5px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                                Active Shopfloor
                            </span>
                        </div>
                    </div>
                </div>

                {/* Ready to Dispatch */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
                            Ready Ship
                        </span>
                        <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Truck className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-purple-700 font-heading tracking-tight">
                            {kpis?.ordersReadyForDispatch || 0}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10.5px] text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100">
                                QC Passed
                            </span>
                        </div>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
                            Low Stock
                        </span>
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                            (kpis?.lowStockMaterials || 0) > 0
                                ? "bg-rose-50 text-rose-600"
                                : "bg-slate-50 text-slate-400"
                        }`}>
                            <AlertTriangle className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div>
                        <h3 className={`text-2xl font-bold font-heading tracking-tight ${
                            (kpis?.lowStockMaterials || 0) > 0 ? "text-rose-600" : "text-slate-900"
                        }`}>
                            {kpis?.lowStockMaterials || 0}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10.5px] text-slate-400">
                                {(kpis?.lowStockMaterials || 0) > 0 ? "Reorder needed" : "Healthy levels"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Today's Output */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
                            Today's Units
                        </span>
                        <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-emerald-600 font-heading tracking-tight">
                            {kpis?.todayProduction || 0}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10.5px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                Completed output
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Valuation & Revenue Cards (Vantus style) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Inventory Valuation Card */}
                <Card className="rounded-2xl">
                    <CardHeader className="pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                                <Boxes className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle>Inventory Valuation</CardTitle>
                                <CardDescription>Physical warehouse assets & stock capitalization</CardDescription>
                            </div>
                        </div>
                        <Link
                            to="/raw-materials"
                            className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1"
                        >
                            <span>Manage</span>
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div>
                            <span className="text-xs text-slate-400 font-medium">Total Inventory Asset Value</span>
                            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading mt-0.5">
                                {formatCurrency(kpis?.inventoryValue?.total)}
                            </div>
                        </div>

                        {/* Segmented stock distribution bar (Vantus style) */}
                        <div className="space-y-1.5">
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                <div
                                    style={{ width: `${rawPct}%` }}
                                    className="bg-sky-500 h-full transition-all"
                                    title={`Raw Materials: ${rawPct}%`}
                                />
                                <div
                                    style={{ width: `${fgPct}%` }}
                                    className="bg-indigo-500 h-full transition-all"
                                    title={`Finished Goods: ${fgPct}%`}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                                    Raw Materials: {rawPct}%
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                    Finished Goods: {fgPct}%
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                                <span className="text-[11px] text-slate-400 block font-medium">Raw Materials Stock</span>
                                <span className="text-sm sm:text-base font-semibold text-slate-800 font-heading">
                                    {formatCurrency(kpis?.inventoryValue?.rawMaterials)}
                                </span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                                <span className="text-[11px] text-slate-400 block font-medium">Finished Goods Stock</span>
                                <span className="text-sm sm:text-base font-semibold text-slate-800 font-heading">
                                    {formatCurrency(kpis?.inventoryValue?.finishedGoods)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue & Realization Card */}
                <Card className="rounded-2xl">
                    <CardHeader className="pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle>Revenue & Pipeline Realization</CardTitle>
                                <CardDescription>Realized shipments vs active sales backlog</CardDescription>
                            </div>
                        </div>
                        <Link
                            to="/orders"
                            className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1"
                        >
                            <span>Orders</span>
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div>
                            <span className="text-xs text-slate-400 font-medium">Total Lifetime Order Value</span>
                            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading mt-0.5">
                                {formatCurrency(kpis?.revenue?.totalOrderValue)}
                            </div>
                        </div>

                        {/* Realization Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                <div
                                    style={{ width: `${revPct}%` }}
                                    className="bg-emerald-500 h-full transition-all"
                                    title={`Realized: ${revPct}%`}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                                <span>Realization Progress: {revPct}% fulfilled</span>
                                <span className="text-emerald-600 font-semibold">{formatCurrency(realizedRev)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                                <span className="text-[11px] text-slate-400 block font-medium">Realized (Dispatched)</span>
                                <span className="text-sm sm:text-base font-semibold text-emerald-600 font-heading">
                                    {formatCurrency(kpis?.revenue?.realizedRevenue)}
                                </span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                                <span className="text-[11px] text-slate-400 block font-medium">Pipeline Backlog</span>
                                <span className="text-sm sm:text-base font-semibold text-amber-600 font-heading">
                                    {formatCurrency(kpis?.revenue?.pipelineRevenue)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Order Status Pipeline Flow (9 Stages) */}
            <Card className="rounded-2xl">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                            <Layers className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle>Manufacturing Order Lifecycle Pipeline</CardTitle>
                            <CardDescription>Live distribution of customer orders across production milestones</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                        {[
                            { key: "draft", label: "Draft" },
                            { key: "approved", label: "Approved" },
                            { key: "inventory_check", label: "Inv Check" },
                            { key: "production_planned", label: "Planned" },
                            { key: "in_production", label: "Production" },
                            { key: "quality_check", label: "QC Check" },
                            { key: "ready_for_dispatch", label: "Ready Ship" },
                            { key: "dispatched", label: "Dispatched" },
                            { key: "delivered", label: "Delivered" },
                        ].map((st, i) => {
                            const count = orderStatusDistribution?.[st.key] || 0;
                            const isDelivered = st.key === "delivered";
                            return (
                                <div
                                    key={st.key}
                                    className={`p-3 rounded-xl border text-center transition-all ${
                                        count > 0
                                            ? "bg-white border-slate-200/90 shadow-2xs hover:border-sky-300"
                                            : "bg-slate-50/60 border-slate-100 text-slate-400"
                                    }`}
                                >
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
                                        Step {i + 1}
                                    </span>
                                    <span className={`text-lg font-bold font-heading block mt-0.5 ${
                                        count > 0 ? (isDelivered ? "text-emerald-600" : "text-slate-900") : "text-slate-400"
                                    }`}>
                                        {count}
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">
                                        {st.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Bottom 2-Column: Recent Orders Table & Activity Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent Orders Table */}
                <Card className="rounded-2xl">
                    <CardHeader className="pb-3 border-b border-slate-100">
                        <div>
                            <CardTitle>Recent Sales Orders</CardTitle>
                            <CardDescription>Latest customer requests processed by sales</CardDescription>
                        </div>
                        <Link
                            to="/orders"
                            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 font-heading"
                        >
                            <span>View All</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-body">
                                <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-2.5 font-semibold font-heading">Order #</th>
                                        <th className="px-4 py-2.5 font-semibold font-heading">Customer</th>
                                        <th className="px-4 py-2.5 font-semibold font-heading">Amount</th>
                                        <th className="px-4 py-2.5 font-semibold font-heading">Status</th>
                                        <th className="px-4 py-2.5 text-right font-semibold font-heading">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {!recentOrders || recentOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                                No recent orders found.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentOrders.map((ord) => {
                                            const badgeInfo = statusBadgeMap[ord.status] || {
                                                label: ord.status,
                                                variant: "slate",
                                            };
                                            return (
                                                <tr
                                                    key={ord._id}
                                                    className="hover:bg-slate-50/70 transition-colors group"
                                                >
                                                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                                                        {ord.orderNumber}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-700 max-w-[140px] truncate">
                                                        {ord.customer?.companyName || "N/A"}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-slate-900 font-heading">
                                                        {formatCurrency(ord.totalAmount)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={badgeInfo.variant} className="text-[10px]">
                                                            {badgeInfo.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Link
                                                            to="/orders"
                                                            className="inline-flex items-center text-xs text-sky-600 hover:text-sky-700 font-medium"
                                                        >
                                                            <span>Details</span>
                                                            <ExternalLink className="h-3 w-3 ml-1" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent System Activity Log */}
                <Card className="rounded-2xl">
                    <CardHeader className="pb-3 border-b border-slate-100">
                        <div>
                            <CardTitle>System Activity Audit</CardTitle>
                            <CardDescription>Live timeline of manufacturing events</CardDescription>
                        </div>
                        <Link
                            to="/audit"
                            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 font-heading"
                        >
                            <span>Full Log</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                        <div className="space-y-3">
                            {!recentActivities || recentActivities.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-6">
                                    No recent activity recorded.
                                </p>
                            ) : (
                                recentActivities.map((act) => (
                                    <div
                                        key={act._id}
                                        className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-start gap-2.5 min-w-0">
                                            <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                                                <FileText className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-800 truncate font-heading">
                                                    {act.action}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate">
                                                    By <span className="font-medium text-slate-600">{act.userName || "System"}</span> on{" "}
                                                    <span className="font-mono text-slate-600">{act.resource}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                            {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
