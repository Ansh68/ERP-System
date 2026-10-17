import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import {
    Truck,
    CheckCircle2,
    Clock,
    MapPin,
    Search,
    Plus,
    Navigation,
    Phone,
    User,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    FileText,
    Boxes,
    Sparkles,
    Eye,
    ShieldCheck,
    FastForward,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Skeleton } from "../components/ui/Skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/Dialog";

const STATUS_CONFIG = {
    pending: { label: "Pending Pick", variant: "slate" },
    in_transit: { label: "In Transit", variant: "sky" },
    out_for_delivery: { label: "Out for Delivery", variant: "amber" },
    delivered: { label: "Delivered", variant: "success" },
    failed_delivery: { label: "Failed", variant: "destructive" },
};

export default function DispatchPage() {
    const [dispatches, setDispatches] = useState([]);
    const [readyOrders, setReadyOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Create Dispatch Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [vehicle, setVehicle] = useState("MH-04-AZ-9921");
    const [driverName, setDriverName] = useState("Ramesh Kumar");
    const [driverPhone, setDriverPhone] = useState("9876543210");
    const [courier, setCourier] = useState("FloData Express");
    const [remarks, setRemarks] = useState("");

    // Dossier & Tracking Modal
    const [selectedDispatch, setSelectedDispatch] = useState(null);
    const [trackingInput, setTrackingInput] = useState("");
    const [simulating, setSimulating] = useState(false);

    const fetchDispatches = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (statusFilter && statusFilter !== "all") {
                params.status = statusFilter;
            }
            if (searchTerm.trim()) {
                params.search = searchTerm.trim();
            }

            const res = await apiClient.get("/dispatches", { params });
            if (res.data?.success) {
                setDispatches(res.data.data.dispatches || []);
                setPagination(res.data.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load dispatches");
        } finally {
            setLoading(false);
        }
    };

    const fetchReadyOrders = async () => {
        try {
            const res = await apiClient.get("/orders?status=ready_for_dispatch&limit=50");
            if (res.data?.success) {
                setReadyOrders(res.data.data.orders || []);
            }
        } catch (err) {
            console.error("Failed to load ready orders", err);
        }
    };

    useEffect(() => {
        fetchDispatches();
    }, [page, statusFilter]);

    useEffect(() => {
        fetchReadyOrders();
    }, []);

    // Instant public tracking search
    const handleQuickTrackSearch = async (e) => {
        e.preventDefault();
        if (!trackingInput.trim()) {
            toast.error("Please enter a tracking number");
            return;
        }

        const loadToast = toast.loading("Locating shipment...");
        try {
            const res = await apiClient.get(`/dispatches/track/${encodeURIComponent(trackingInput.trim())}`);
            toast.dismiss(loadToast);
            if (res.data?.success) {
                setSelectedDispatch(res.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Tracking number not found", { id: loadToast });
        }
    };

    // Quick ship from ready orders banner
    const handleQuickShipOrder = (order) => {
        setSelectedOrderId(order._id);
        setVehicle("MH-04-AZ-9921");
        setDriverName("Ramesh Kumar");
        setDriverPhone("9876543210");
        setCourier("FloData Express");
        setRemarks(`Fulfillment shipment for order ${order.orderNumber}`);
        setShowCreateModal(true);
    };

    // Submit Create Dispatch
    const handleCreateDispatch = async (e) => {
        e.preventDefault();

        if (!selectedOrderId) {
            toast.error("Please select a sales order ready for dispatch");
            return;
        }

        if (driverName && !/^[a-zA-Z\s]{2,50}$/.test(driverName.trim())) {
            toast.error("Driver name must contain only letters and spaces (2-50 characters)");
            return;
        }

        if (driverPhone && !/^\d{10}$/.test(String(driverPhone).trim())) {
            toast.error("Driver contact phone must be exactly 10 digits");
            return;
        }

        setCreateLoading(true);
        const actionToast = toast.loading("Generating consignment, waybill & decrementing FG inventory...");
        try {
            const payload = {
                salesOrder: selectedOrderId,
                vehicle: vehicle.trim(),
                driver: { name: driverName.trim(), phone: driverPhone.trim() },
                courier,
                remarks: remarks ? remarks.trim() : undefined,
            };

            const res = await apiClient.post("/dispatches", payload);
            toast.success(res.data?.message || "Shipment dispatched successfully!", { id: actionToast });
            setShowCreateModal(false);
            fetchDispatches();
            fetchReadyOrders();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create dispatch", { id: actionToast });
        } finally {
            setCreateLoading(false);
        }
    };

    // Advance carrier milestone simulation
    const handleSimulateProgress = async (dispatchId, e) => {
        if (e) e.stopPropagation();
        setSimulating(true);
        const simToast = toast.loading("Simulating carrier telematics update...");
        try {
            const res = await apiClient.post(`/dispatches/${dispatchId}/simulate-progress`);
            toast.success(res.data?.message || "Carrier milestone updated!", { id: simToast });
            fetchDispatches();
            if (selectedDispatch && selectedDispatch._id === dispatchId) {
                // Refresh dossier
                const updated = await apiClient.get(`/dispatches/${dispatchId}`);
                if (updated.data?.success) setSelectedDispatch(updated.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Simulation failed or already delivered", { id: simToast });
        } finally {
            setSimulating(false);
        }
    };

    // Direct mark as delivered
    const handleDeliverOrder = async (dispatchId, e) => {
        if (e) e.stopPropagation();
        const delToast = toast.loading("Recording proof of delivery...");
        try {
            const res = await apiClient.post(`/dispatches/${dispatchId}/deliver`);
            toast.success(res.data?.message || "Order marked delivered!", { id: delToast });
            fetchDispatches();
            if (selectedDispatch && selectedDispatch._id === dispatchId) {
                const updated = await apiClient.get(`/dispatches/${dispatchId}`);
                if (updated.data?.success) setSelectedDispatch(updated.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to mark delivered", { id: delToast });
        }
    };

    // Open detail dossier for clicked dispatch
    const handleViewDispatch = async (dispatch) => {
        setSelectedDispatch(dispatch);
    };

    // KPI Metrics calculation
    const totalCount = pagination.total || dispatches.length;
    const inTransitCount = dispatches.filter((d) => d.status === "in_transit" || d.status === "out_for_delivery").length;
    const deliveredCount = dispatches.filter((d) => d.status === "delivered").length;
    const pendingCount = dispatches.filter((d) => d.status === "pending").length;

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading tracking-tight">
                            Dispatch Logistics & Carrier Hub
                        </h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 font-medium font-heading">
                            {totalCount} Consignments
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-body mt-0.5">
                        Waybill dispatch, GPS telematics milestone simulation, and delivery fulfillment
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => {
                            if (readyOrders.length > 0) {
                                handleQuickShipOrder(readyOrders[0]);
                            } else {
                                setSelectedOrderId("");
                                setShowCreateModal(true);
                            }
                        }}
                        className="rounded-xl gap-2 font-heading"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Create Dispatch</span>
                    </Button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <Card className="rounded-2xl p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium font-heading">In Transit</span>
                        <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                            <Truck className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 font-heading">{inTransitCount}</span>
                        <span className="text-xs text-sky-600 font-medium font-body">On the Road</span>
                    </div>
                </Card>

                <Card className="rounded-2xl p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium font-heading">Delivered Orders</span>
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 font-heading">{deliveredCount}</span>
                        <span className="text-xs text-emerald-600 font-medium font-body">Fulfilled</span>
                    </div>
                </Card>

                <Card className="rounded-2xl p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium font-heading">Ready for Dispatch</span>
                        <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-amber-700 font-heading">{readyOrders.length}</span>
                        <span className="text-xs text-slate-400 font-body">Orders cleared</span>
                    </div>
                </Card>

                <Card className="rounded-2xl p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium font-heading">Pending Waybills</span>
                        <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <FileText className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 font-heading">{pendingCount}</span>
                        <span className="text-xs text-slate-400 font-body">Pre-dispatch</span>
                    </div>
                </Card>
            </div>

            {/* Orders Ready for Dispatch Banner */}
            {readyOrders.length > 0 && (
                <Card className="rounded-2xl border-sky-200/80 bg-sky-50/30 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                                <Boxes className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-900 font-heading">
                                    {readyOrders.length} Sales Order{readyOrders.length > 1 ? "s" : ""} Awaiting Dispatch Waybill
                                </h3>
                                <p className="text-[11px] text-slate-500 font-body">
                                    QC certified and packaged finished goods ready to assign carrier & vehicle
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                            {readyOrders.slice(0, 3).map((order) => (
                                <button
                                    key={order._id}
                                    type="button"
                                    onClick={() => handleQuickShipOrder(order)}
                                    className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-xs font-heading font-medium text-sky-900 hover:bg-sky-100/70 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                                >
                                    <span>{order.orderNumber}</span>
                                    <span className="text-[10px] text-sky-600">({order.customer?.companyName || "Client"})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>
            )}

            {/* Filter & Live Tracking Search Bar */}
            <Card className="rounded-2xl">
                <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Live Tracking Quick Lookup */}
                    <form onSubmit={handleQuickTrackSearch} className="flex items-center gap-2 max-w-md w-full">
                        <div className="relative flex-1">
                            <Navigation className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Track Consignment (e.g. TRK-FloData-...)"
                                value={trackingInput}
                                onChange={(e) => setTrackingInput(e.target.value)}
                                className="pl-9 h-9.5 text-xs rounded-xl"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="rounded-xl font-heading">
                            Track
                        </Button>
                    </form>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/80 rounded-xl text-xs font-heading">
                        {[
                            { key: "all", label: "All Dispatches" },
                            { key: "pending", label: "Pending" },
                            { key: "in_transit", label: "In Transit" },
                            { key: "out_for_delivery", label: "Out for Delivery" },
                            { key: "delivered", label: "Delivered" },
                        ].map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => { setStatusFilter(t.key); setPage(1); }}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                    statusFilter === t.key
                                        ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Dispatches Table */}
            <Card className="rounded-2xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-body">
                            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-3 font-semibold font-heading">Dispatch & Invoice #</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Customer & Order</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Courier & Tracking #</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Vehicle & Driver</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Shipment Status</th>
                                    <th className="px-5 py-3 text-right font-semibold font-heading">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={6} className="px-5 py-3.5">
                                                <Skeleton className="h-5 w-full rounded" />
                                            </td>
                                        </tr>
                                    ))
                                ) : dispatches.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                            No dispatches found matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    dispatches.map((d) => {
                                        const cfg = STATUS_CONFIG[d.status] || { label: d.status, variant: "slate" };
                                        const isDelivered = d.status === "delivered";

                                        return (
                                            <tr
                                                key={d._id}
                                                onClick={() => handleViewDispatch(d)}
                                                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                            >
                                                {/* Dispatch & Invoice */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs shrink-0 font-heading">
                                                            <Truck className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-slate-900 group-hover:text-sky-600 font-heading block">
                                                                {d.dispatchNumber}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono block">
                                                                Inv: {d.invoiceNumber || "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Customer & Order */}
                                                <td className="px-5 py-3.5">
                                                    <span className="font-medium text-slate-800 block truncate max-w-[160px]">
                                                        {d.customer?.companyName || "Client"}
                                                    </span>
                                                    <span className="text-[11px] font-mono text-sky-600 block">
                                                        {d.salesOrder?.orderNumber || "SO-ORDER"}
                                                    </span>
                                                </td>

                                                {/* Courier & Tracking # */}
                                                <td className="px-5 py-3.5">
                                                    <span className="font-medium text-slate-700 block">
                                                        {d.courier || "FloData Express"}
                                                    </span>
                                                    <span className="text-[11px] font-mono text-slate-500 block">
                                                        {d.trackingNumber || "—"}
                                                    </span>
                                                </td>

                                                {/* Vehicle & Driver */}
                                                <td className="px-5 py-3.5 text-slate-600">
                                                    <span className="font-mono text-[11px] block text-slate-800">
                                                        {d.vehicle || "Standard Fleet"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                                                        {d.driver?.name || "Carrier Driver"}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-3.5">
                                                    <Badge variant={cfg.variant} className="text-[10px]">
                                                        {cfg.label.toUpperCase()}
                                                    </Badge>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                        {!isDelivered && (
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={(e) => handleSimulateProgress(d._id, e)}
                                                                className="h-7 px-2 text-[11px] rounded-lg font-heading gap-1 text-sky-700 bg-sky-50 hover:bg-sky-100 border-sky-200"
                                                                title="Simulate Carrier Telematics Step"
                                                            >
                                                                <FastForward className="h-3 w-3" />
                                                                <span className="hidden sm:inline">Progress</span>
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewDispatch(d)}
                                                            className="h-7 px-2 text-[11px] rounded-lg text-slate-500 hover:text-slate-900"
                                                        >
                                                            Track
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>
                                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} consignments)
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="h-7 px-2.5 rounded-lg gap-1"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    <span>Prev</span>
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page >= pagination.totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="h-7 px-2.5 rounded-lg gap-1"
                                >
                                    <span>Next</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ─── MODAL 1: DISPATCH DOSSIER & LIVE TRACKING TIMELINE ───────────── */}
            {selectedDispatch && (
                <Dialog open={!!selectedDispatch} onOpenChange={() => setSelectedDispatch(null)}>
                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
                        <DialogHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-base font-bold text-slate-900 font-heading">
                                            {selectedDispatch.dispatchNumber}
                                        </DialogTitle>
                                        <Badge
                                            variant={
                                                selectedDispatch.status === "delivered"
                                                    ? "success"
                                                    : selectedDispatch.status === "in_transit"
                                                    ? "sky"
                                                    : "amber"
                                            }
                                        >
                                            {selectedDispatch.status?.replace("_", " ").toUpperCase()}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 font-body mt-0.5">
                                        Courier: <span className="font-semibold text-slate-700">{selectedDispatch.courier}</span> • Tracking: <span className="font-mono text-sky-700 font-medium">{selectedDispatch.trackingNumber}</span>
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 my-3 text-xs font-body">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">CLIENT</span>
                                    <span className="font-semibold text-slate-800 text-xs block truncate">
                                        {selectedDispatch.customer?.companyName || "Client"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">INVOICE NUMBER</span>
                                    <span className="font-mono font-medium text-slate-800 text-xs">
                                        {selectedDispatch.invoiceNumber || "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">VEHICLE</span>
                                    <span className="font-mono font-medium text-slate-800 text-xs">
                                        {selectedDispatch.vehicle || "Fleet Carrier"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">DRIVER</span>
                                    <span className="font-medium text-slate-800 text-xs">
                                        {selectedDispatch.driver?.name || "Carrier Driver"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">DRIVER PHONE</span>
                                    <span className="font-mono text-slate-800 text-xs">
                                        {selectedDispatch.driver?.phone || "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">DISPATCH DATE</span>
                                    <span className="text-slate-800 text-xs">
                                        {new Date(selectedDispatch.dispatchDate || selectedDispatch.createdAt || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Shipped Items List */}
                            {selectedDispatch.items && selectedDispatch.items.length > 0 && (
                                <div>
                                    <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-2 font-heading">
                                        Consignment Manifest & Shipped Batches
                                    </span>
                                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 text-slate-500">
                                                <tr>
                                                    <th className="px-3 py-2 font-medium">Product</th>
                                                    <th className="px-3 py-2 font-medium">FG Batch #</th>
                                                    <th className="px-3 py-2 text-right font-medium">Quantity</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedDispatch.items.map((item, i) => (
                                                    <tr key={i}>
                                                        <td className="px-3 py-2 text-slate-800 font-medium">
                                                            {item.product?.name || "Industrial Part"}
                                                        </td>
                                                        <td className="px-3 py-2 font-mono text-[11px] text-sky-700">
                                                            {item.batchNumber || "FG-BATCH"}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-bold text-slate-900 font-heading">
                                                            {item.quantity} pcs
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Carrier Timeline */}
                            <div>
                                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-3 font-heading">
                                    Carrier Milestones & Live Telematics
                                </span>
                                {selectedDispatch.carrierEvents && selectedDispatch.carrierEvents.length > 0 ? (
                                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                        {selectedDispatch.carrierEvents.map((evt, idx) => (
                                            <div key={idx} className="relative text-xs">
                                                <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-white border-2 border-sky-500 flex items-center justify-center">
                                                    <div className="h-2 w-2 rounded-full bg-sky-500" />
                                                </div>
                                                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-slate-900 capitalize font-heading">
                                                            {evt.status?.replace("_", " ")}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(evt.timestamp || Date.now()).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-600 text-[11px] mt-0.5">{evt.description}</p>
                                                    {evt.location && (
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                                                            <MapPin className="h-3 w-3" />
                                                            <span>{evt.location}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 italic text-xs">No carrier telemetry events logged yet.</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            {selectedDispatch.status !== "delivered" && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        disabled={simulating}
                                        onClick={(e) => handleSimulateProgress(selectedDispatch._id, e)}
                                        className="rounded-xl font-heading gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
                                    >
                                        <FastForward className="h-3.5 w-3.5" />
                                        <span>Advance Milestone</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={(e) => handleDeliverOrder(selectedDispatch._id, e)}
                                        className="rounded-xl font-heading gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span>Deliver</span>
                                    </Button>
                                </div>
                            )}
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedDispatch(null)}
                                className="rounded-xl ml-auto"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* ─── MODAL 2: CREATE DISPATCH ────────────────────────────────────── */}
            {showCreateModal && (
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent className="max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 font-heading">
                                Create Consignment & Dispatch
                            </DialogTitle>
                            <p className="text-xs text-slate-500 font-body">
                                Fulfill an inspected sales order, assign carrier logistics, and generate waybill
                            </p>
                        </DialogHeader>

                        <form onSubmit={handleCreateDispatch} className="space-y-3.5 mt-3 text-xs font-body">
                            <div>
                                <Label className="text-xs font-heading">Sales Order (Ready for Dispatch) *</Label>
                                <select
                                    value={selectedOrderId}
                                    onChange={(e) => setSelectedOrderId(e.target.value)}
                                    className="w-full mt-1 h-9 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                                    required
                                >
                                    <option value="">Select Sales Order</option>
                                    {readyOrders.map((o) => (
                                        <option key={o._id} value={o._id}>
                                            {o.orderNumber} — {o.customer?.companyName || "Client"} (₹{o.totalAmount?.toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-heading">Carrier Service</Label>
                                    <select
                                        value={courier}
                                        onChange={(e) => setCourier(e.target.value)}
                                        className="w-full mt-1 h-9 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                                    >
                                        <option value="FloData Express">FloData Dedicated Express</option>
                                        <option value="Blue Dart">Blue Dart Surface / Air</option>
                                        <option value="Delhivery">Delhivery Freight Logistics</option>
                                        <option value="DTDC">DTDC Secure Courier</option>
                                        <option value="FedEx Supply Chain">FedEx Supply Chain</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-heading">Vehicle Plate #</Label>
                                    <Input
                                        value={vehicle}
                                        onChange={(e) => setVehicle(e.target.value)}
                                        placeholder="e.g. MH-04-AZ-9921"
                                        className="mt-1 h-9 rounded-xl text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-heading">Driver Name (Letters Only)</Label>
                                    <Input
                                        value={driverName}
                                        onChange={(e) => setDriverName(e.target.value)}
                                        placeholder="e.g. Ramesh Kumar"
                                        className="mt-1 h-9 rounded-xl text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-heading">Driver Phone (10 Digits)</Label>
                                    <Input
                                        value={driverPhone}
                                        onChange={(e) => setDriverPhone(e.target.value)}
                                        placeholder="e.g. 9876543210"
                                        className="mt-1 h-9 rounded-xl text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-heading">Consignment Remarks & Shipping Notes</Label>
                                <Input
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="e.g. Handle with care, fragile packaging"
                                    className="mt-1 h-9 rounded-xl text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createLoading}
                                    className="rounded-xl font-heading"
                                >
                                    {createLoading ? "Creating..." : "Confirm & Dispatch"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
