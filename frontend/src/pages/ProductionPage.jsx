import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export default function ProductionPage() {
    const [plans, setPlans] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stageFilter, setStageFilter] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    // Create Plan Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState("");
    const [selectedProduct, setSelectedProduct] = useState("");
    const [quantity, setQuantity] = useState(10);
    const [machine, setMachine] = useState("CNC Line 01");
    const [shift, setShift] = useState("morning");
    const [operator, setOperator] = useState("John Tech");
    const [supervisor, setSupervisor] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [remarks, setRemarks] = useState("");

    // Advance Stage Modal
    const [advancePlan, setAdvancePlan] = useState(null);
    const [nextStage, setNextStage] = useState("material_issued");
    const [producedQty, setProducedQty] = useState("");
    const [rejectedQty, setRejectedQty] = useState(0);
    const [stageRemarks, setStageRemarks] = useState("");

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (stageFilter) params.stage = stageFilter;

            const res = await apiClient.get("/production-plans", { params });
            if (res.data?.success) {
                setPlans(res.data.data.plans);
                setPagination(res.data.data.pagination);
            }
        } catch (err) {
            console.error("Failed to load production plans", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMetadata = async () => {
        try {
            // Get orders in production_planned status
            const [ordersRes, prodRes, usersRes] = await Promise.all([
                apiClient.get("/orders?status=production_planned&limit=50"),
                apiClient.get("/products?limit=100"),
                apiClient.get("/auth/users").catch(() => ({ data: { success: false } })),
            ]);
            if (ordersRes.data?.success) setOrders(ordersRes.data.data.orders);
            if (prodRes.data?.success) setProducts(prodRes.data.data.products);
            if (usersRes.data?.success) setUsers(usersRes.data.data);
        } catch (err) {
            console.error("Failed to load metadata", err);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, [page, stageFilter]);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const handleCreatePlan = async (e) => {
        e.preventDefault();

        if (!selectedOrder) {
            alert("Please select a sales order");
            return;
        }

        if (!selectedProduct) {
            alert("Please select a product");
            return;
        }

        if (isNaN(quantity) || Number(quantity) < 1) {
            alert("Production target quantity must be at least 1");
            return;
        }

        if (operator && !/^[a-zA-Z\s]{2,50}$/.test(operator.trim())) {
            alert("Operator name must contain only letters and spaces (2-50 characters)");
            return;
        }

        try {
            const payload = {
                salesOrder: selectedOrder,
                product: selectedProduct,
                quantity: Number(quantity),
                machine: machine ? machine.trim() : "Assembly Line 1",
                shift,
                operator: operator ? operator.trim() : undefined,
                supervisor: supervisor || users[0]?._id,
                startDate: startDate || new Date(),
                endDate: endDate || new Date(Date.now() + 2 * 86400000),
                remarks: remarks ? remarks.trim() : undefined,
            };
            await apiClient.post("/production-plans", payload);
            alert("Production plan scheduled successfully!");
            setShowCreateModal(false);
            fetchPlans();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create production plan");
        }
    };

    // ─── ACTION: UPDATE STAGE (MATERIAL ISSUE OR COMPLETION) ───────────────────
    const handleUpdateStage = async (e) => {
        e.preventDefault();
        if (!advancePlan) return;

        const pQty = producedQty !== "" ? Number(producedQty) : advancePlan.quantity;
        const rQty = Number(rejectedQty || 0);

        if (isNaN(pQty) || pQty < 0) {
            alert("Produced quantity cannot be negative");
            return;
        }

        if (isNaN(rQty) || rQty < 0) {
            alert("Rejected quantity cannot be negative");
            return;
        }

        try {
            const payload = {
                stage: nextStage,
                producedQuantity: pQty,
                rejectedQuantity: rQty,
                remarks: stageRemarks ? stageRemarks.trim() : undefined,
            };

            const res = await apiClient.post(`/production-plans/${advancePlan._id}/update-stage`, payload);
            alert(res.data?.message || `Stage updated to ${nextStage}`);
            setAdvancePlan(null);
            fetchPlans();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update production stage");
        }
    };

    const getStageBadge = (st) => {
        const colors = {
            planned: "bg-gray-100 text-gray-700",
            material_issued: "bg-blue-100 text-blue-800",
            manufacturing: "bg-amber-100 text-amber-800",
            assembly: "bg-purple-100 text-purple-800",
            packaging: "bg-cyan-100 text-cyan-800",
            completed: "bg-emerald-100 text-emerald-800",
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Production Planning & Execution</h1>
                    <p className="text-xs text-gray-500">
                        Shop floor scheduling, raw material issuance, and 6-stage manufacturing progression
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                >
                    + Schedule Production Plan
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3 rounded border border-gray-200 flex items-center gap-2 text-xs">
                <span className="text-gray-500 font-medium">Filter by Stage:</span>
                <select
                    value={stageFilter}
                    onChange={(e) => {
                        setStageFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-2 py-1.5 border border-gray-300 rounded bg-white"
                >
                    <option value="">All Stages</option>
                    <option value="planned">Planned</option>
                    <option value="material_issued">Material Issued</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="assembly">Assembly</option>
                    <option value="packaging">Packaging</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {/* Plans Table */}
            <div className="bg-white rounded border border-gray-200 overflow-x-auto text-xs">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                        <tr>
                            <th className="p-3">Plan Order #</th>
                            <th className="p-3">Sales Order #</th>
                            <th className="p-3">Product</th>
                            <th className="p-3">Qty Planned / Done</th>
                            <th className="p-3">Machine & Shift</th>
                            <th className="p-3">Supervisor</th>
                            <th className="p-3">Stage</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="p-4 text-center text-gray-500">
                                    Loading production plans...
                                </td>
                            </tr>
                        ) : plans.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="p-4 text-center text-gray-500">
                                    No production plans found.
                                </td>
                            </tr>
                        ) : (
                            plans.map((p) => (
                                <tr key={p._id} className="hover:bg-gray-50/50">
                                    <td className="p-3 font-mono font-medium text-gray-900">{p.productionOrderNumber}</td>
                                    <td className="p-3 font-mono">{p.salesOrder?.orderNumber || "Linked SO"}</td>
                                    <td className="p-3 font-medium">{p.product?.name}</td>
                                    <td className="p-3">
                                        <span className="font-semibold text-emerald-700">{p.producedQuantity || 0}</span> /{" "}
                                        {p.quantity} units
                                    </td>
                                    <td className="p-3">
                                        {p.machine} <span className="text-[10px] text-gray-400 capitalize">({p.shift})</span>
                                    </td>
                                    <td className="p-3">{p.supervisor?.name || "Supervisor"}</td>
                                    <td className="p-3">{getStageBadge(p.stage)}</td>
                                    <td className="p-3">
                                        {p.stage !== "completed" && p.stage !== "cancelled" ? (
                                            <button
                                                onClick={() => {
                                                    setAdvancePlan(p);
                                                    setProducedQty(p.quantity);
                                                    // Auto-suggest next logical stage
                                                    const nextMap = {
                                                        planned: "material_issued",
                                                        material_issued: "manufacturing",
                                                        manufacturing: "assembly",
                                                        assembly: "packaging",
                                                        packaging: "completed",
                                                    };
                                                    setNextStage(nextMap[p.stage] || "completed");
                                                }}
                                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-medium"
                                            >
                                                Advance Stage &rarr;
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 italic">Done</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>
                        Page {pagination.page} of {pagination.totalPages}
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

            {/* ─── MODAL: SCHEDULE PRODUCTION PLAN ─────────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg border max-w-lg w-full p-5 text-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h2 className="font-bold text-base text-gray-900">Schedule Production Plan</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">
                                    Linked Sales Order (in 'Production Planned' status) *
                                </label>
                                <select
                                    required
                                    value={selectedOrder}
                                    onChange={(e) => {
                                        const ordId = e.target.value;
                                        setSelectedOrder(ordId);
                                        const found = orders.find((o) => o._id === ordId);
                                        if (found && found.items?.[0]) {
                                            setSelectedProduct(found.items[0].product._id || found.items[0].product);
                                            setQuantity(found.items[0].quantity);
                                        }
                                    }}
                                    className="w-full border p-2 rounded bg-white"
                                >
                                    <option value="">Select Order...</option>
                                    {orders.map((o) => (
                                        <option key={o._id} value={o._id}>
                                            {o.orderNumber} — {o.customer?.companyName} ({o.items?.length} items)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Product *</label>
                                    <select
                                        required
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                        className="w-full border p-2 rounded bg-white"
                                    >
                                        <option value="">Select Product...</option>
                                        {products.map((p) => (
                                            <option key={p._id} value={p._id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Quantity to Produce *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="w-full border p-2 rounded font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Machine Line *</label>
                                    <input
                                        required
                                        value={machine}
                                        onChange={(e) => setMachine(e.target.value)}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Shift *</label>
                                    <select
                                        value={shift}
                                        onChange={(e) => setShift(e.target.value)}
                                        className="w-full border p-2 rounded bg-white"
                                    >
                                        <option value="morning">Morning</option>
                                        <option value="afternoon">Afternoon</option>
                                        <option value="night">Night</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Operator Name</label>
                                    <input
                                        value={operator}
                                        onChange={(e) => setOperator(e.target.value)}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Supervisor</label>
                                    <select
                                        value={supervisor}
                                        onChange={(e) => setSupervisor(e.target.value)}
                                        className="w-full border p-2 rounded bg-white"
                                    >
                                        <option value="">Select Supervisor...</option>
                                        {users.map((u) => (
                                            <option key={u._id} value={u._id}>
                                                {u.name} ({u.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-3 py-1.5 border rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Schedule Plan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── MODAL: ADVANCE STAGE ────────────────────────────────────────── */}
            {advancePlan && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg border max-w-sm w-full p-5 text-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <div>
                                <h2 className="font-bold text-base text-gray-900">Advance Stage</h2>
                                <p className="text-xs text-gray-500">Plan #{advancePlan.productionOrderNumber}</p>
                            </div>
                            <button onClick={() => setAdvancePlan(null)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleUpdateStage} className="space-y-3 text-xs">
                            <div className="bg-gray-50 p-2.5 rounded text-xs space-y-1">
                                <div>Current Stage: <strong>{getStageBadge(advancePlan.stage)}</strong></div>
                                <div>Target Quantity: <strong>{advancePlan.quantity} units</strong></div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Transition to Stage *</label>
                                <select
                                    value={nextStage}
                                    onChange={(e) => setNextStage(e.target.value)}
                                    className="w-full border p-2 rounded bg-white font-medium"
                                >
                                    <option value="material_issued">Material Issued (Deducts Raw Material Stock)</option>
                                    <option value="manufacturing">Manufacturing (In Production)</option>
                                    <option value="assembly">Assembly</option>
                                    <option value="packaging">Packaging</option>
                                    <option value="completed">Completed (Advances Order to Quality Check)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Units Produced</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={producedQty}
                                        onChange={(e) => setProducedQty(e.target.value)}
                                        className="w-full border p-1.5 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Defects / Scraps</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={rejectedQty}
                                        onChange={(e) => setRejectedQty(e.target.value)}
                                        className="w-full border p-1.5 rounded"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Remarks</label>
                                <input
                                    value={stageRemarks}
                                    onChange={(e) => setStageRemarks(e.target.value)}
                                    placeholder="Shop floor progress note..."
                                    className="w-full border p-1.5 rounded"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button
                                    type="button"
                                    onClick={() => setAdvancePlan(null)}
                                    className="px-3 py-1.5 border rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                                >
                                    Confirm Transition
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
