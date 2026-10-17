import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    // Modal state for creating an order
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [orderItems, setOrderItems] = useState([{ product: "", quantity: 1 }]);
    const [expectedDate, setExpectedDate] = useState("");
    const [priority, setPriority] = useState("medium");
    const [remarks, setRemarks] = useState("");

    // Modal state for viewing order details
    const [viewOrder, setViewOrder] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;

            const res = await apiClient.get("/orders", { params });
            if (res.data?.success) {
                setOrders(res.data.data.orders);
                setPagination(res.data.data.pagination);
            }
        } catch (err) {
            console.error("Failed to load orders", err);
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
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...orderItems];
        updated[index][field] = value;
        setOrderItems(updated);
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();

        if (!selectedCustomer) {
            alert("Please select a customer");
            return;
        }

        const validItems = orderItems.filter((item) => item.product && Number(item.quantity) >= 1);
        if (validItems.length === 0) {
            alert("Please add at least one line item with a selected product and quantity >= 1");
            return;
        }

        try {
            const payload = {
                customer: selectedCustomer,
                items: validItems.map((item) => ({
                    product: item.product,
                    quantity: Number(item.quantity),
                })),
                expectedDeliveryDate: expectedDate || undefined,
                priority,
                remarks: remarks ? remarks.trim() : undefined,
            };

            await apiClient.post("/orders", payload);
            alert("Sales Order created successfully!");
            setShowCreateModal(false);
            // Reset form
            setSelectedCustomer("");
            setOrderItems([{ product: "", quantity: 1 }]);
            setExpectedDate("");
            setRemarks("");
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create order");
        }
    };

    // ─── ACTION: APPROVE ORDER & RUN AUTO-INVENTORY VALIDATION ─────────────────
    const handleApproveOrder = async (orderId) => {
        if (!window.confirm("Approve order and run automated Inventory / MRP check?")) return;
        setActionLoading(true);
        try {
            const res = await apiClient.post(`/orders/${orderId}/approve`);
            alert(res.data?.message || "Order approved successfully!");
            fetchOrders();
            if (viewOrder && viewOrder._id === orderId) {
                const refreshed = await apiClient.get(`/orders/${orderId}`);
                setViewOrder(refreshed.data.data);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to approve order");
        } finally {
            setActionLoading(false);
        }
    };

    // ─── ACTION: CANCEL ORDER & RELEASE RESERVATIONS ───────────────────────────
    const handleCancelOrder = async (orderId) => {
        const reason = window.prompt("Reason for cancellation:", "Customer requested cancellation");
        if (!reason) return;
        setActionLoading(true);
        try {
            await apiClient.post(`/orders/${orderId}/cancel`, { reason });
            alert("Order cancelled and reserved stock released.");
            fetchOrders();
            if (viewOrder && viewOrder._id === orderId) {
                const refreshed = await apiClient.get(`/orders/${orderId}`);
                setViewOrder(refreshed.data.data);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to cancel order");
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewDetails = async (orderId) => {
        try {
            const res = await apiClient.get(`/orders/${orderId}`);
            if (res.data?.success) {
                setViewOrder(res.data.data);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to fetch order details");
        }
    };

    const getStatusBadge = (st) => {
        const colors = {
            draft: "bg-gray-100 text-gray-700",
            approved: "bg-blue-50 text-blue-700 border-blue-200",
            inventory_check: "bg-yellow-50 text-yellow-700",
            production_planned: "bg-amber-100 text-amber-800",
            in_production: "bg-orange-100 text-orange-800",
            quality_check: "bg-purple-100 text-purple-800",
            ready_for_dispatch: "bg-indigo-100 text-indigo-800",
            dispatched: "bg-cyan-100 text-cyan-800",
            delivered: "bg-emerald-100 text-emerald-800",
            cancelled: "bg-red-100 text-red-800",
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${colors[st] || "bg-gray-100"}`}>
                {st?.replace("_", " ")}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Sales Orders</h1>
                    <p className="text-xs text-gray-500">Manage orders, approve for automated MRP check, or cancel</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                >
                    + Create Sales Order
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-3 rounded border border-gray-200 flex flex-wrap items-center gap-3 text-xs">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search order number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none"
                    />
                    <button type="submit" className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded font-medium">
                        Search
                    </button>
                </form>

                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Status:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-2 py-1.5 border border-gray-300 rounded bg-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="production_planned">Production Planned</option>
                        <option value="in_production">In Production</option>
                        <option value="quality_check">Quality Check</option>
                        <option value="ready_for_dispatch">Ready for Dispatch</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded border border-gray-200 overflow-x-auto text-xs">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                        <tr>
                            <th className="p-3">Order #</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Items</th>
                            <th className="p-3">Total Amount</th>
                            <th className="p-3">Priority</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="p-4 text-center text-gray-500">
                                    Loading orders...
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="p-4 text-center text-gray-500">
                                    No sales orders found.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50/50">
                                    <td className="p-3 font-mono font-medium">{order.orderNumber}</td>
                                    <td className="p-3">{order.customer?.companyName || "N/A"}</td>
                                    <td className="p-3">{order.items?.length || 0} product(s)</td>
                                    <td className="p-3 font-semibold">
                                        ₹{Number(order.totalAmount || 0).toLocaleString()}
                                    </td>
                                    <td className="p-3">
                                        <span className="capitalize">{order.priority}</span>
                                    </td>
                                    <td className="p-3">{getStatusBadge(order.status)}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => handleViewDetails(order._id)}
                                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                                            >
                                                Details
                                            </button>
                                            {order.status === "draft" && (
                                                <button
                                                    onClick={() => handleApproveOrder(order._id)}
                                                    disabled={actionLoading}
                                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                                                    title="Triggers Automated Inventory Check & MRP"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            {!["dispatched", "delivered", "cancelled"].includes(order.status) && (
                                                <button
                                                    onClick={() => handleCancelOrder(order._id)}
                                                    disabled={actionLoading}
                                                    className="px-2 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center text-xs text-gray-600 pt-2">
                    <span>
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total orders)
                    </span>
                    <div className="flex gap-1">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                            className="px-2 py-1 border rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page >= pagination.totalPages}
                            onClick={() => setPage(page + 1)}
                            className="px-2 py-1 border rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* ─── MODAL: CREATE ORDER ────────────────────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg border max-w-xl w-full p-5 text-sm space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h2 className="font-bold text-base text-gray-900">New Sales Order</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrder} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Customer</label>
                                <select
                                    required
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                    className="w-full border p-2 rounded text-xs bg-white"
                                >
                                    <option value="">Select Customer...</option>
                                    {customers.map((c) => (
                                        <option key={c._id} value={c._id}>
                                            {c.companyName} ({c.contactPerson})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-medium text-gray-700">Order Items</label>
                                    <button
                                        type="button"
                                        onClick={handleAddItemRow}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        + Add Product
                                    </button>
                                </div>
                                {orderItems.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <select
                                            required
                                            value={item.product}
                                            onChange={(e) => handleItemChange(index, "product", e.target.value)}
                                            className="flex-1 border p-1.5 rounded text-xs bg-white"
                                        >
                                            <option value="">Select Product...</option>
                                            {products.map((p) => (
                                                <option key={p._id} value={p._id}>
                                                    {p.name} (₹{p.unitSellingPrice})
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                            className="w-20 border p-1.5 rounded text-xs"
                                            placeholder="Qty"
                                        />
                                        {orderItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItemRow(index)}
                                                className="text-red-500 hover:text-red-700 text-xs px-1"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Expected Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={expectedDate}
                                        onChange={(e) => setExpectedDate(e.target.value)}
                                        className="w-full border p-2 rounded text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full border p-2 rounded text-xs bg-white"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows="2"
                                    className="w-full border p-2 rounded text-xs"
                                    placeholder="Optional order notes..."
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-3 py-1.5 border rounded text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                >
                                    Create Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── MODAL: ORDER DETAILS & VALIDATION REPORT ───────────────────── */}
            {viewOrder && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg border max-w-2xl w-full p-5 text-sm space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start border-b pb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-base text-gray-900">{viewOrder.orderNumber}</h2>
                                    {getStatusBadge(viewOrder.status)}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Customer: {viewOrder.customer?.companyName} ({viewOrder.customer?.contactPerson})
                                </p>
                            </div>
                            <button onClick={() => setViewOrder(null)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>

                        {/* Items Table */}
                        <div>
                            <h3 className="font-semibold text-xs text-gray-700 mb-2">Order Line Items</h3>
                            <table className="w-full text-xs text-left border">
                                <thead className="bg-gray-50 text-gray-500 border-b">
                                    <tr>
                                        <th className="p-2">Product</th>
                                        <th className="p-2">Qty</th>
                                        <th className="p-2">Unit Price</th>
                                        <th className="p-2">Total</th>
                                        <th className="p-2">Fulfillment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {viewOrder.items?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="p-2 font-medium">{item.product?.name || "Product"}</td>
                                            <td className="p-2">{item.quantity}</td>
                                            <td className="p-2">₹{item.unitPrice}</td>
                                            <td className="p-2 font-semibold">₹{item.totalPrice}</td>
                                            <td className="p-2 uppercase text-[10px] text-gray-600">
                                                {item.fulfillmentSource?.replace("_", " ")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Inventory & MRP Validation Report */}
                        {viewOrder.inventoryValidation?.checkedAt && (
                            <div className="bg-gray-50 p-3 rounded border text-xs space-y-2">
                                <div className="flex justify-between font-semibold">
                                    <span className="text-gray-800">Automated Inventory Check Report</span>
                                    <span className="text-gray-400">
                                        {new Date(viewOrder.inventoryValidation.checkedAt).toLocaleString()}
                                    </span>
                                </div>

                                {viewOrder.inventoryValidation.isFinishedGoodsSufficient ? (
                                    <p className="text-emerald-700 font-medium">
                                        100% Finished Goods in stock. Production skipped! Reserved batches:
                                        {viewOrder.inventoryValidation.reservedFinishedGoods?.map((b) => (
                                            <span key={b.batchNumber} className="ml-2 font-mono bg-white px-1 py-0.5 rounded border">
                                                {b.batchNumber} ({b.quantity} pcs)
                                            </span>
                                        ))}
                                    </p>
                                ) : (
                                    <div className="space-y-1">
                                        <p className="text-amber-700 font-medium">
                                            Finished goods insufficient &rarr; Production requirement generated!
                                        </p>
                                        {viewOrder.inventoryValidation.shortages?.length > 0 ? (
                                            <div className="text-red-700">
                                                <span className="font-semibold">Shortages identified:</span>
                                                <ul className="list-disc pl-4 mt-0.5">
                                                    {viewOrder.inventoryValidation.shortages.map((s, i) => (
                                                        <li key={i}>
                                                            {s.name} ({s.materialCode}): Required {s.requiredQuantity}, Available {s.availableQuantity} (Short: {s.shortage})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <p className="text-emerald-600">All required raw materials reserved successfully!</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Status History Timeline */}
                        <div>
                            <h3 className="font-semibold text-xs text-gray-700 mb-2">Order Lifecycle Audit Trail</h3>
                            <div className="border rounded divide-y text-xs max-h-36 overflow-y-auto">
                                {viewOrder.statusHistory?.map((hist, i) => (
                                    <div key={i} className="p-2 flex justify-between items-center">
                                        <div>
                                            <span className="font-semibold uppercase text-blue-700 mr-2">{hist.status}</span>
                                            <span className="text-gray-600">{hist.note}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(hist.changedAt).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions in details modal */}
                        <div className="flex justify-end gap-2 pt-2 border-t">
                            {viewOrder.status === "draft" && (
                                <button
                                    onClick={() => handleApproveOrder(viewOrder._id)}
                                    disabled={actionLoading}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                                >
                                    Approve & Run MRP Check
                                </button>
                            )}
                            <button
                                onClick={() => setViewOrder(null)}
                                className="px-3 py-1.5 border rounded text-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
