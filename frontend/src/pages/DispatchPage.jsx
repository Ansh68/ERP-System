import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export default function DispatchPage() {
    const [dispatches, setDispatches] = useState([]);
    const [readyOrders, setReadyOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    // Create Dispatch Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState("");
    const [vehicle, setVehicle] = useState("MH-04-AZ-9921");
    const [driverName, setDriverName] = useState("Ramesh Kumar");
    const [driverPhone, setDriverPhone] = useState("9876543210");
    const [courier, setCourier] = useState("FloData Express");
    const [remarks, setRemarks] = useState("");

    // Live Tracking View Modal
    const [trackingModal, setTrackingModal] = useState(null);
    const [trackingNumberInput, setTrackingNumberInput] = useState("");

    const fetchDispatches = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get("/dispatches", { params: { page, limit: 10 } });
            if (res.data?.success) {
                setDispatches(res.data.data.dispatches);
                setPagination(res.data.data.pagination);
            }
        } catch (err) {
            console.error("Failed to load dispatches", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReadyOrders = async () => {
        try {
            const res = await apiClient.get("/orders?status=ready_for_dispatch&limit=50");
            if (res.data?.success) {
                setReadyOrders(res.data.data.orders);
            }
        } catch (err) {
            console.error("Failed to load ready orders", err);
        }
    };

    useEffect(() => {
        fetchDispatches();
    }, [page]);

    useEffect(() => {
        fetchReadyOrders();
    }, []);

    const handleCreateDispatch = async (e) => {
        e.preventDefault();

        if (!/^[a-zA-Z\s]{2,50}$/.test(driverName.trim())) {
            alert("Driver name must contain only letters and spaces (2-50 characters)");
            return;
        }

        if (!/^\d{10}$/.test(driverPhone.trim())) {
            alert("Driver contact phone must be exactly 10 digits");
            return;
        }

        try {
            const payload = {
                salesOrder: selectedOrder,
                vehicle: vehicle.trim(),
                driver: { name: driverName.trim(), phone: driverPhone.trim() },
                courier,
                remarks: remarks ? remarks.trim() : undefined,
            };

            const res = await apiClient.post("/dispatches", payload);
            alert(res.data?.message || "Dispatch created successfully!");
            setShowCreateModal(false);
            setDriverName("");
            setDriverPhone("");
            setVehicle("");
            setRemarks("");
            fetchDispatches();
            fetchReadyOrders();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create dispatch");
        }
    };

    // ─── ACTION: SIMULATE CARRIER PROGRESS (ADVANCE MILESTONE) ─────────────────
    const handleSimulateProgress = async (dispatchId) => {
        try {
            const res = await apiClient.post(`/dispatches/${dispatchId}/simulate-progress`);
            alert(res.data?.message || "Carrier milestone advanced!");
            fetchDispatches();
            if (trackingModal && trackingModal._id === dispatchId) {
                const updated = await apiClient.get(`/dispatches/${dispatchId}`);
                setTrackingModal(updated.data.data);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to simulate progress");
        }
    };

    // ─── ACTION: DIRECT TRACK SHIPMENT ─────────────────────────────────────────
    const handleTrackByNumber = async (trkNum) => {
        try {
            const res = await apiClient.get(`/dispatches/track/${trkNum}`);
            if (res.data?.success) {
                setTrackingModal(res.data.data);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Shipment tracking number not found");
        }
    };

    const getDispatchBadge = (st) => {
        const colors = {
            in_transit: "bg-blue-100 text-blue-800",
            out_for_delivery: "bg-amber-100 text-amber-800",
            delivered: "bg-emerald-100 text-emerald-800",
            failed: "bg-red-100 text-red-800",
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
                    <h1 className="text-xl font-bold text-gray-900">Dispatch & Shipment Logistics</h1>
                    <p className="text-xs text-gray-500">
                        Ship ready orders, auto-deduct finished goods, and simulate 3rd party carrier tracking
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                    >
                        + Create Dispatch ({readyOrders.length} Ready)
                    </button>
                </div>
            </div>

            {/* Public Tracking Quick Bar */}
            <div className="bg-white p-3 rounded border border-gray-200 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-gray-700">Track Consignment:</span>
                <input
                    type="text"
                    placeholder="Enter Tracking # (e.g. FDX-12345678)"
                    value={trackingNumberInput}
                    onChange={(e) => setTrackingNumberInput(e.target.value)}
                    className="border px-2.5 py-1.5 rounded w-64 uppercase font-mono"
                />
                <button
                    onClick={() => handleTrackByNumber(trackingNumberInput.trim())}
                    className="px-3 py-1.5 bg-gray-800 text-white rounded font-medium hover:bg-gray-900"
                >
                    Track Shipment
                </button>
            </div>

            {/* Dispatches Table */}
            <div className="bg-white rounded border border-gray-200 overflow-x-auto text-xs">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                        <tr>
                            <th className="p-3">Dispatch #</th>
                            <th className="p-3">Tracking #</th>
                            <th className="p-3">Sales Order #</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Courier</th>
                            <th className="p-3">Vehicle</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="p-4 text-center text-gray-500">
                                    Loading shipments...
                                </td>
                            </tr>
                        ) : dispatches.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="p-4 text-center text-gray-500">
                                    No dispatch records found.
                                </td>
                            </tr>
                        ) : (
                            dispatches.map((dsp) => (
                                <tr key={dsp._id} className="hover:bg-gray-50/50">
                                    <td className="p-3 font-mono font-medium text-gray-900">{dsp.dispatchNumber}</td>
                                    <td className="p-3 font-mono font-bold text-blue-600">{dsp.trackingNumber}</td>
                                    <td className="p-3 font-mono">{dsp.salesOrder?.orderNumber || "Linked SO"}</td>
                                    <td className="p-3 font-medium">{dsp.customer?.companyName}</td>
                                    <td className="p-3">{dsp.courier}</td>
                                    <td className="p-3 text-gray-500">{dsp.vehicle || "-"}</td>
                                    <td className="p-3">{getDispatchBadge(dsp.status)}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => setTrackingModal(dsp)}
                                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                                            >
                                                Timeline
                                            </button>
                                            {dsp.status !== "delivered" && (
                                                <button
                                                    onClick={() => handleSimulateProgress(dsp._id)}
                                                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-medium"
                                                    title="Simulates carrier milestone progress"
                                                >
                                                    Simulate &rarr;
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} shipments)
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

            {/* ─── MODAL: CREATE DISPATCH ─────────────────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg border max-w-md w-full p-5 text-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h2 className="font-bold text-base text-gray-900">Create Shipment & Dispatch</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleCreateDispatch} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">
                                    Select Order (Ready for Dispatch) *
                                </label>
                                <select
                                    required
                                    value={selectedOrder}
                                    onChange={(e) => setSelectedOrder(e.target.value)}
                                    className="w-full border p-2 rounded bg-white font-medium"
                                >
                                    <option value="">Select Ready Order...</option>
                                    {readyOrders.map((o) => (
                                        <option key={o._id} value={o._id}>
                                            {o.orderNumber} — {o.customer?.companyName} (₹{o.totalAmount})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Vehicle # *</label>
                                    <input
                                        required
                                        value={vehicle}
                                        onChange={(e) => setVehicle(e.target.value)}
                                        placeholder="MH-04-AZ-9921"
                                        className="w-full border p-1.5 rounded uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Courier Carrier *</label>
                                    <select
                                        value={courier}
                                        onChange={(e) => setCourier(e.target.value)}
                                        className="w-full border p-1.5 rounded bg-white"
                                    >
                                        <option value="FloData Express">FloData Express</option>
                                        <option value="BlueDart">BlueDart</option>
                                        <option value="Delhivery">Delhivery</option>
                                        <option value="FedEx">FedEx</option>
                                        <option value="DTDC">DTDC</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Driver Name (Letters only) *</label>
                                    <input
                                        required
                                        value={driverName}
                                        maxLength={50}
                                        onChange={(e) => setDriverName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                                        placeholder="Ramesh Kumar"
                                        className="w-full border p-1.5 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Driver Phone (10 Digits) *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={driverPhone}
                                        maxLength={10}
                                        onChange={(e) => setDriverPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                        placeholder="9876543210"
                                        className="w-full border p-1.5 rounded"
                                    />
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded text-[11px]">
                                ℹ️ Creating dispatch will <strong>auto-decrement Finished Goods inventory</strong>,
                                assign tracking number, and transition Sales Order to <strong>Dispatched</strong>.
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
                                    className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                                >
                                    Confirm Shipment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── MODAL: CARRIER TIMELINE TRACKING ─────────────────────────────── */}
            {trackingModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg border max-w-lg w-full p-5 text-sm space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start border-b pb-2">
                            <div>
                                <span className="text-xs uppercase font-semibold text-gray-400">Carrier Live Tracking</span>
                                <h2 className="font-mono font-bold text-lg text-blue-700">{trackingModal.trackingNumber}</h2>
                                <p className="text-xs text-gray-500">
                                    Carrier: <strong>{trackingModal.courier}</strong> | Status:{" "}
                                    <strong>{trackingModal.status?.replace("_", " ")}</strong>
                                </p>
                            </div>
                            <button onClick={() => setTrackingModal(null)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>

                        {/* Milestone Timeline */}
                        <div className="space-y-3 pt-2 text-xs">
                            <span className="font-semibold text-gray-700 block">Consignment Journey Milestones</span>
                            <div className="border-l-2 border-blue-500 pl-4 space-y-3">
                                {trackingModal.events || trackingModal.carrierEvents ? (
                                    (trackingModal.events || trackingModal.carrierEvents).map((ev, i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white"></div>
                                            <p className="font-semibold text-gray-800">{ev.description}</p>
                                            <p className="text-[11px] text-gray-500">
                                                {ev.location} &bull; {new Date(ev.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400">No events logged yet</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t">
                            {trackingModal.status !== "delivered" && (
                                <button
                                    onClick={() => handleSimulateProgress(trackingModal._id)}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-medium"
                                >
                                    Simulate Next Milestone &rarr;
                                </button>
                            )}
                            <button
                                onClick={() => setTrackingModal(null)}
                                className="px-3 py-1.5 border rounded text-xs ml-auto"
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
