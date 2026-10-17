import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import {
    ShoppingCart,
    Search,
    Plus,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    Edit3,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Boxes,
    Package,
    RotateCw,
    X,
    Calendar,
    FileText,
    Truck,
    Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/Dialog";
import { Skeleton } from "../components/ui/Skeleton";

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    // Modal state: Create Order
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [orderItems, setOrderItems] = useState([{ product: "", quantity: 1 }]);
    const [expectedDate, setExpectedDate] = useState("");
    const [priority, setPriority] = useState("medium");
    const [remarks, setRemarks] = useState("");

    // Modal state: View Order Details
    const [viewOrder, setViewOrder] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Edit Draft Order mode
    const [isEditingOrder, setIsEditingOrder] = useState(false);
    const [editPriority, setEditPriority] = useState("medium");
    const [editDate, setEditDate] = useState("");
    const [editRemarks, setEditRemarks] = useState("");

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (statusFilter) params.status = statusFilter;
            if (search.trim()) params.search = search.trim();

            const res = await apiClient.get("/orders", { params });
            if (res.data?.success) {
                setOrders(res.data.data.orders);
                setPagination(res.data.data.pagination);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const fetchMetadata = async () => {
        try {
            const [custRes, prodRes] = await Promise.all([
                apiClient.get("/customers?limit=100"),
                apiClient.get("/products?limit=100"),
            ]);
            if (custRes.data?.success) setCustomers(custRes.data.data.customers);
            if (prodRes.data?.success) setProducts(prodRes.data.data.products);
        } catch (err) {
            console.error("Failed to load metadata", err);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter, page]);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchOrders();
    };

    const handleAddItemRow = () => {
        setOrderItems([...orderItems, { product: "", quantity: 1 }]);
    };

    const handleRemoveItemRow = (index) => {
        if (orderItems.length > 1) {
            setOrderItems(orderItems.filter((_, i) => i !== index));
        }
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...orderItems];
        updated[index][field] = value;
        setOrderItems(updated);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    // Create Order
    const handleCreateOrder = async (e) => {
        e.preventDefault();

        if (!selectedCustomer) {
            toast.error("Please select a customer");
            return;
        }

        const validItems = orderItems.filter((item) => item.product && Number(item.quantity) >= 1);
        if (validItems.length === 0) {
            toast.error("Please add at least one line item with quantity >= 1");
            return;
        }

        setCreateLoading(true);
        const actionToast = toast.loading("Creating sales order...");

        try {
            const payload = {
                customer: selectedCustomer,
                items: validItems.map((item) => ({
                    product: item.product,
                    quantity: Math.max(1, parseInt(item.quantity, 10)),
                })),
                expectedDeliveryDate: expectedDate || undefined,
                priority,
                remarks: remarks.trim() || undefined,
            };

            await apiClient.post("/orders", payload);
            toast.success("Sales Order created successfully!", { id: actionToast });
            setShowCreateModal(false);
            setSelectedCustomer("");
            setOrderItems([{ product: "", quantity: 1 }]);
            setExpectedDate("");
            setRemarks("");
            fetchOrders();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create order", { id: actionToast });
        } finally {
            setCreateLoading(false);
        }
    };

    // Open detail modal for clicked order
    const handleViewOrder = async (orderId) => {
        try {
            const res = await apiClient.get(`/orders/${orderId}`);
            if (res.data?.success) {
                const orderData = res.data.data;
                setViewOrder(orderData);
                setIsEditingOrder(false);
                setEditPriority(orderData.priority || "medium");
                setEditDate(orderData.expectedDeliveryDate ? orderData.expectedDeliveryDate.slice(0, 10) : "");
                setEditRemarks(orderData.remarks || "");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load order details");
        }
    };

    // Approve Order & Run MRP Check
    const handleApproveOrder = async (orderId) => {
        setActionLoading(true);
        const actionToast = toast.loading("Verifying inventory & running MRP...");
        try {
            const res = await apiClient.post(`/orders/${orderId}/approve`);
            const validation = res.data?.data?.inventoryValidation;
            if (validation?.isFinishedGoodsSufficient) {
                toast.success("Finished Goods in stock! Skipped production & reserved stock.", { id: actionToast, duration: 5000 });
            } else {
                toast.success("Materials verified! Generated production requirement.", { id: actionToast, duration: 5000 });
            }
            fetchOrders();
            // Refresh detail modal if open
            if (viewOrder && viewOrder._id === orderId) {
                handleViewOrder(orderId);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to approve order", { id: actionToast });
        } finally {
            setActionLoading(false);
        }
    };

    // Cancel Order
    const handleCancelOrder = async (orderId) => {
        const reason = window.prompt("Reason for cancellation:", "Customer requested cancellation");
        if (!reason) return;

        setActionLoading(true);
        const actionToast = toast.loading("Cancelling order & releasing stock...");
        try {
            await apiClient.post(`/orders/${orderId}/cancel`, { reason });
            toast.success("Order cancelled and reserved stock released.", { id: actionToast });
            fetchOrders();
            if (viewOrder && viewOrder._id === orderId) {
                handleViewOrder(orderId);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to cancel order", { id: actionToast });
        } finally {
            setActionLoading(false);
        }
    };

    // Update Draft Order
    const handleUpdateDraftOrder = async (e) => {
        e.preventDefault();
        if (!viewOrder) return;

        setActionLoading(true);
        const actionToast = toast.loading("Saving order changes...");
        try {
            const payload = {
                priority: editPriority,
                expectedDeliveryDate: editDate || undefined,
                remarks: editRemarks.trim() || undefined,
            };
            const res = await apiClient.patch(`/orders/${viewOrder._id}`, payload);
            toast.success("Draft order updated successfully!", { id: actionToast });
            setIsEditingOrder(false);
            if (res.data?.data) {
                setViewOrder(res.data.data);
            }
            fetchOrders();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update order", { id: actionToast });
        } finally {
            setActionLoading(false);
        }
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

    const priorityBadgeMap = {
        urgent: { label: "Urgent", variant: "danger" },
        high: { label: "High", variant: "warning" },
        medium: { label: "Medium", variant: "default" },
        low: { label: "Low", variant: "slate" },
    };

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading tracking-tight">
                            Sales Orders Hub
                        </h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 font-medium">
                            {pagination.total || orders.length} Orders
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-body mt-0.5">
                        Manage customer sales orders, trigger automated MRP checks, and track lifecycle progression
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-xl gap-2 font-heading"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Create Order</span>
                    </Button>
                </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <Card className="rounded-2xl">
                <div className="p-3.5 sm:p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Search Input */}
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
                            <div className="relative flex-1">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Search by order number (e.g. SO-1001)..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9.5 text-xs rounded-xl"
                                />
                            </div>
                            <Button type="submit" variant="secondary" size="sm" className="rounded-xl font-heading">
                                Search
                            </Button>
                        </form>
                    </div>

                    {/* Status Tabs Strip (Vantus style) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-heading">
                        {[
                            { key: "", label: "All Statuses" },
                            { key: "draft", label: "Draft" },
                            { key: "approved", label: "Approved" },
                            { key: "production_planned", label: "Planned" },
                            { key: "in_production", label: "Production" },
                            { key: "quality_check", label: "QC Check" },
                            { key: "ready_for_dispatch", label: "Ready Ship" },
                            { key: "dispatched", label: "Dispatched" },
                            { key: "delivered", label: "Delivered" },
                            { key: "cancelled", label: "Cancelled" },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => {
                                    setStatusFilter(t.key);
                                    setPage(1);
                                }}
                                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer font-medium ${
                                    statusFilter === t.key
                                        ? "bg-sky-500 text-white font-semibold shadow-xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Orders Table */}
            <Card className="rounded-2xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-body">
                            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-3 font-semibold font-heading">Order Identifier</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Customer</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Line Items</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Order Total</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Priority</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Lifecycle Status</th>
                                    <th className="px-5 py-3 text-right font-semibold font-heading">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={7} className="px-5 py-3.5">
                                                <Skeleton className="h-5 w-full rounded" />
                                            </td>
                                        </tr>
                                    ))
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                                            No sales orders found matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((ord) => {
                                        const badgeInfo = statusBadgeMap[ord.status] || {
                                            label: ord.status,
                                            variant: "slate",
                                        };
                                        const pBadge = priorityBadgeMap[ord.priority] || {
                                            label: ord.priority,
                                            variant: "slate",
                                        };

                                        return (
                                            <tr
                                                key={ord._id}
                                                onClick={() => handleViewOrder(ord._id)}
                                                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                            >
                                                <td className="px-5 py-3.5 font-mono font-semibold text-slate-800">
                                                    <span className="text-sky-600 group-hover:underline">
                                                        {ord.orderNumber}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="font-semibold text-slate-900 font-heading block">
                                                        {ord.customer?.companyName || "N/A"}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 block">
                                                        Attn: {ord.customer?.contactPerson || "Contact"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-600">
                                                    {ord.items?.length || 0} product(s)
                                                </td>
                                                <td className="px-5 py-3.5 font-semibold text-slate-900 font-heading">
                                                    {formatCurrency(ord.totalAmount)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <Badge variant={pBadge.variant} className="text-[10px]">
                                                        {pBadge.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <Badge variant={badgeInfo.variant} className="text-[10px]">
                                                        {badgeInfo.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewOrder(ord._id)}
                                                            className="h-7 px-2 text-[11px] rounded-lg text-slate-600 hover:text-sky-600"
                                                        >
                                                            <Eye className="h-3.5 w-3.5 mr-1" />
                                                            Details
                                                        </Button>

                                                        {ord.status === "draft" && (
                                                            <Button
                                                                size="sm"
                                                                disabled={actionLoading}
                                                                onClick={() => handleApproveOrder(ord._id)}
                                                                className="h-7 px-2.5 text-[11px] rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-heading"
                                                                title="Verify Inventory & Trigger MRP"
                                                            >
                                                                Approve
                                                            </Button>
                                                        )}

                                                        {!["dispatched", "delivered", "cancelled"].includes(ord.status) && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={actionLoading}
                                                                onClick={() => handleCancelOrder(ord._id)}
                                                                className="h-7 px-2 text-[10.5px] rounded-lg text-rose-600 hover:bg-rose-50 border-rose-200"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        )}
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
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-body">
                            <span>
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                    className="h-8 rounded-lg text-xs"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= pagination.totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="h-8 rounded-lg text-xs"
                                >
                                    Next
                                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ─── MODAL: CREATE SALES ORDER ────────────────────────────────────────── */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent onClose={() => setShowCreateModal(false)} className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>New Manufacturing Sales Order</DialogTitle>
                        <DialogDescription>
                            Create a customer sales order with multi-item specifications and delivery schedule
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateOrder} className="space-y-4">
                        <div>
                            <Label htmlFor="orderCustomer">Client Customer Account *</Label>
                            <select
                                id="orderCustomer"
                                required
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-body text-slate-900 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/15"
                            >
                                <option value="">Select Customer...</option>
                                {customers.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.companyName} — Attn: {c.contactPerson} ({c.shippingAddress?.city || "India"})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Order Line Items */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="mb-0">Product Line Items *</Label>
                                <button
                                    type="button"
                                    onClick={handleAddItemRow}
                                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 font-heading cursor-pointer"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Add Product</span>
                                </button>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {orderItems.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <select
                                            required
                                            value={item.product}
                                            onChange={(e) => handleItemChange(index, "product", e.target.value)}
                                            className="flex-1 h-9 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-body text-slate-900 focus:border-sky-500 focus:outline-none"
                                        >
                                            <option value="">Choose Finished Good...</option>
                                            {products.map((p) => (
                                                <option key={p._id} value={p._id}>
                                                    {p.name} ({p.code}) — {formatCurrency(p.unitSellingPrice)}
                                                </option>
                                            ))}
                                        </select>
                                        <Input
                                            type="number"
                                            min="1"
                                            required
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                            className="w-20 h-9 text-xs"
                                            placeholder="Qty"
                                        />
                                        {orderItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItemRow(index)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                                title="Remove Item"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="expectedDate">Target Delivery Date</Label>
                                <Input
                                    id="expectedDate"
                                    type="date"
                                    value={expectedDate}
                                    onChange={(e) => setExpectedDate(e.target.value)}
                                    className="text-xs h-9.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="orderPriority">Order Priority</Label>
                                <select
                                    id="orderPriority"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="flex h-9.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-body text-slate-900 focus:border-sky-500 focus:outline-none"
                                >
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                    <option value="urgent">Urgent Manufacturing</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="orderRemarks">Special Notes / Remarks</Label>
                            <Input
                                id="orderRemarks"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Optional shipping or manufacturing specifications..."
                                className="text-xs"
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowCreateModal(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createLoading}
                                size="sm"
                                className="rounded-xl font-heading"
                            >
                                {createLoading ? "Creating..." : "Submit Order"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── MODAL: ORDER DETAILS & AUTOMATED MRP REPORT ────────────────────────── */}
            {viewOrder && (
                <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
                    <DialogContent onClose={() => setViewOrder(null)} className="max-w-2xl">
                        <DialogHeader>
                            <div className="flex items-center justify-between pr-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold font-mono">
                                        SO
                                    </div>
                                    <div>
                                        <DialogTitle>{viewOrder.orderNumber}</DialogTitle>
                                        <DialogDescription>
                                            Customer: <span className="font-semibold text-slate-800">{viewOrder.customer?.companyName}</span> ({viewOrder.customer?.contactPerson})
                                        </DialogDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Badge variant={priorityBadgeMap[viewOrder.priority]?.variant || "slate"}>
                                        {viewOrder.priority}
                                    </Badge>
                                    <Badge variant={statusBadgeMap[viewOrder.status]?.variant || "slate"}>
                                        {statusBadgeMap[viewOrder.status]?.label || viewOrder.status}
                                    </Badge>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Order Line Items */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-heading mb-2">
                                    Order Line Items
                                </h4>
                                <div className="border border-slate-100 rounded-xl overflow-hidden">
                                    <table className="w-full text-xs text-left font-body">
                                        <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                            <tr>
                                                <th className="p-2.5 font-semibold font-heading">Product</th>
                                                <th className="p-2.5 font-semibold font-heading">Qty</th>
                                                <th className="p-2.5 font-semibold font-heading">Unit Price</th>
                                                <th className="p-2.5 font-semibold font-heading">Line Total</th>
                                                <th className="p-2.5 font-semibold font-heading">Fulfillment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {viewOrder.items?.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="p-2.5 font-medium text-slate-800">
                                                        {item.product?.name || "Product"}
                                                    </td>
                                                    <td className="p-2.5 text-slate-700 font-semibold">{item.quantity}</td>
                                                    <td className="p-2.5 text-slate-600">{formatCurrency(item.unitPrice)}</td>
                                                    <td className="p-2.5 font-semibold text-slate-900 font-heading">
                                                        {formatCurrency(item.totalPrice)}
                                                    </td>
                                                    <td className="p-2.5 uppercase text-[10px] text-slate-500">
                                                        {item.fulfillmentSource?.replace("_", " ")}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Inventory Validation & MRP Check Report */}
                            {viewOrder.inventoryValidation?.checkedAt && (
                                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2 text-xs font-body">
                                    <div className="flex justify-between items-center font-heading">
                                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                            <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                                            Automated Inventory & MRP Verification Report
                                        </span>
                                        <span className="text-[10.5px] text-slate-400">
                                            {new Date(viewOrder.inventoryValidation.checkedAt).toLocaleString()}
                                        </span>
                                    </div>

                                    {viewOrder.inventoryValidation.isFinishedGoodsSufficient ? (
                                        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                            <span>
                                                100% Finished Goods in stock. Production skipped! Reserved batch inventory:
                                                {viewOrder.inventoryValidation.reservedFinishedGoods?.map((b) => (
                                                    <span key={b.batchNumber} className="ml-1.5 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                                                        {b.batchNumber} ({b.quantity} pcs)
                                                    </span>
                                                ))}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/70 flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                                <span>
                                                    Finished Goods insufficient &rarr; Production requirement scheduled! Raw materials reserved.
                                                </span>
                                            </div>

                                            {viewOrder.inventoryValidation.shortages?.length > 0 ? (
                                                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/70">
                                                    <span className="font-semibold block font-heading mb-1">
                                                        Material Shortages Detected:
                                                    </span>
                                                    <ul className="list-disc pl-4 space-y-0.5 text-[11.5px]">
                                                        {viewOrder.inventoryValidation.shortages.map((s, i) => (
                                                            <li key={i}>
                                                                <span className="font-medium">{s.name}</span> ({s.materialCode}): Required {s.requiredQuantity}, Available {s.availableQuantity} (Shortage: {s.shortage})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <p className="text-[11.5px] text-emerald-600 font-medium">
                                                    All required raw materials are in stock and reserved for production.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Lifecycle History Stepper */}
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-heading mb-2">
                                    Order Lifecycle Audit Trail
                                </h4>
                                <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 max-h-36 overflow-y-auto text-xs">
                                    {viewOrder.statusHistory?.map((hist, i) => (
                                        <div key={i} className="p-2.5 flex justify-between items-center hover:bg-slate-50/50">
                                            <div>
                                                <span className="font-semibold uppercase text-sky-700 mr-2 font-mono text-[11px]">
                                                    {hist.status}
                                                </span>
                                                <span className="text-slate-600">{hist.note}</span>
                                            </div>
                                            <span className="text-[10.5px] text-slate-400">
                                                {new Date(hist.changedAt).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            {viewOrder.status === "draft" && (
                                <Button
                                    size="sm"
                                    disabled={actionLoading}
                                    onClick={() => handleApproveOrder(viewOrder._id)}
                                    className="rounded-xl mr-auto font-heading bg-sky-500 hover:bg-sky-600 text-white"
                                >
                                    Approve & Run MRP Check
                                </Button>
                            )}

                            {!["dispatched", "delivered", "cancelled"].includes(viewOrder.status) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={actionLoading}
                                    onClick={() => handleCancelOrder(viewOrder._id)}
                                    className="rounded-xl text-rose-600 hover:bg-rose-50 border-rose-200"
                                >
                                    Cancel Order
                                </Button>
                            )}

                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setViewOrder(null)}
                                className="rounded-xl"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
