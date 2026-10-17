import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export default function QualityControlPage() {
    const [inspections, setInspections] = useState([]);
    const [pendingPlans, setPendingPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    // Inspection Modal State
    const [showInspectModal, setShowInspectModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("");
    const [inspectedQty, setInspectedQty] = useState(10);
    const [passedQty, setPassedQty] = useState(10);
    const [failedQty, setFailedQty] = useState(0);
    const [visual, setVisual] = useState("pass");
    const [dimensions, setDimensions] = useState("pass");
    const [weight, setWeight] = useState("pass");
    const [finish, setFinish] = useState("pass");
    const [qcStatus, setQcStatus] = useState("passed");
    const [remarks, setRemarks] = useState("");

    const fetchInspections = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get("/quality-inspections", { params: { page, limit: 10 } });
            if (res.data?.success) {
                setInspections(res.data.data.inspections);
                setPagination(res.data.data.pagination);
            }
        } catch (err) {
            console.error("Failed to load inspections", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingPlans = async () => {
        try {
            // Plans in completed stage
            const res = await apiClient.get("/production-plans?stage=completed&limit=50");
            if (res.data?.success) {
                setPendingPlans(res.data.data.plans);
            }
        } catch (err) {
            console.error("Failed to load pending plans", err);
        }
    };

    useEffect(() => {
        fetchInspections();
    }, [page]);

    useEffect(() => {
        fetchPendingPlans();
    }, []);

    const handleCreateInspection = async (e) => {
        e.preventDefault();

        if (!selectedPlan) {
            alert("Please select a pending production plan to inspect");
            return;
        }

        const insp = Number(inspectedQty);
        const pass = Number(passedQty);
        const fail = Number(failedQty);

        if (isNaN(insp) || insp < 1) {
            alert("Inspected quantity must be at least 1");
            return;
        }

        if (isNaN(pass) || pass < 0 || isNaN(fail) || fail < 0) {
            alert("Passed and Failed quantities cannot be negative");
            return;
        }

        if (pass + fail > insp) {
            alert("The sum of passed and failed items cannot exceed the total inspected quantity");
            return;
        }

        try {
            const payload = {
                productionPlan: selectedPlan,
                inspectedQuantity: insp,
                passedQuantity: pass,
                failedQuantity: fail,
                parameters: {
                    visualInspection: visual,
                    dimensions,
                    weight,
                    finish,
                },
                status: qcStatus,
                remarks: remarks ? remarks.trim() : "Standard QC inspection protocol completed",
            };

            const res = await apiClient.post("/quality-inspections", payload);
            alert(res.data?.message || "Quality inspection submitted successfully!");
            setShowInspectModal(false);
            // Reset
            setRemarks("");
            fetchInspections();
            fetchPendingPlans();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to submit quality inspection");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Quality Control (QC) Station</h1>
                    <p className="text-xs text-gray-500">
                        Inspect finished manufacturing batches, evaluate 4 quality metrics, and approve for dispatch
                    </p>
                </div>
                <button
                    onClick={() => setShowInspectModal(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                >
                    + Record QC Inspection
                </button>
            </div>

            {/* Inspections Table */}
            <div className="bg-white rounded border border-gray-200 overflow-x-auto text-xs">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                        <tr>
                            <th className="p-3">Inspection #</th>
                            <th className="p-3">Product</th>
                            <th className="p-3">Sales Order #</th>
                            <th className="p-3">Inspected / Passed</th>
                            <th className="p-3">Generated FG Batch</th>
                            <th className="p-3">Parameters (V / D / W / F)</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Inspector</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="p-4 text-center text-gray-500">
                                    Loading inspection records...
                                </td>
                            </tr>
                        ) : inspections.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="p-4 text-center text-gray-500">
                                    No quality inspection records found.
                                </td>
                            </tr>
                        ) : (
                            inspections.map((qc) => (
                                <tr key={qc._id} className="hover:bg-gray-50/50">
                                    <td className="p-3 font-mono font-medium text-gray-900">{qc.inspectionNumber}</td>
                                    <td className="p-3 font-medium">{qc.product?.name}</td>
                                    <td className="p-3 font-mono">{qc.salesOrder?.orderNumber || "Linked SO"}</td>
                                    <td className="p-3">
                                        <span className="font-semibold text-emerald-700">{qc.passedQuantity}</span> /{" "}
                                        {qc.inspectedQuantity} pcs
                                    </td>
                                    <td className="p-3 font-mono text-[11px] text-blue-700">
                                        {qc.generatedBatchNumber || "-"}
                                    </td>
                                    <td className="p-3">
                                        <span className="space-x-1 text-[10px]">
                                            <span className={qc.parameters?.visualInspection === "pass" ? "text-emerald-600" : "text-red-600"}>
                                                V:{qc.parameters?.visualInspection}
                                            </span>
                                            <span className={qc.parameters?.dimensions === "pass" ? "text-emerald-600" : "text-red-600"}>
                                                D:{qc.parameters?.dimensions}
                                            </span>
                                            <span className={qc.parameters?.weight === "pass" ? "text-emerald-600" : "text-red-600"}>
                                                W:{qc.parameters?.weight}
                                            </span>
                                            <span className={qc.parameters?.finish === "pass" ? "text-emerald-600" : "text-red-600"}>
                                                F:{qc.parameters?.finish}
                                            </span>
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                                qc.status === "passed"
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : qc.status === "rework_required"
                                                    ? "bg-amber-100 text-amber-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {qc.status?.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-600">{qc.inspector?.name || "Inspector"}</td>
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

            {/* ─── MODAL: RECORD QC INSPECTION ─────────────────────────────────── */}
            {showInspectModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg border max-w-lg w-full p-5 text-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h2 className="font-bold text-base text-gray-900">Record QC Inspection</h2>
                            <button onClick={() => setShowInspectModal(false)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleCreateInspection} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">
                                    Select Production Plan (Completed Stage) *
                                </label>
                                <select
                                    required
                                    value={selectedPlan}
                                    onChange={(e) => {
                                        const pId = e.target.value;
                                        setSelectedPlan(pId);
                                        const found = pendingPlans.find((p) => p._id === pId);
                                        if (found) {
                                            setInspectedQty(found.quantity);
                                            setPassedQty(found.quantity);
                                            setFailedQty(0);
                                        }
                                    }}
                                    className="w-full border p-2 rounded bg-white font-medium"
                                >
                                    <option value="">Select Plan...</option>
                                    {pendingPlans.map((p) => (
                                        <option key={p._id} value={p._id}>
                                            Plan #{p.productionOrderNumber} — {p.product?.name} ({p.quantity} units)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Inspected Qty *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={inspectedQty}
                                        onChange={(e) => setInspectedQty(e.target.value)}
                                        className="w-full border p-1.5 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Passed Qty *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={passedQty}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setPassedQty(val);
                                            setFailedQty(Math.max(0, inspectedQty - val));
                                        }}
                                        className="w-full border p-1.5 rounded text-emerald-700 font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Failed Qty</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={failedQty}
                                        onChange={(e) => setFailedQty(e.target.value)}
                                        className="w-full border p-1.5 rounded text-red-600 font-semibold"
                                    />
                                </div>
                            </div>

                            {/* 4 Inspection Parameters */}
                            <div className="bg-gray-50 p-2.5 rounded border space-y-2">
                                <span className="font-semibold text-gray-800 block">4 Quality Test Metrics</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex justify-between items-center bg-white p-1.5 rounded border">
                                        <span>Visual Check:</span>
                                        <select
                                            value={visual}
                                            onChange={(e) => setVisual(e.target.value)}
                                            className="border rounded text-[11px] p-0.5"
                                        >
                                            <option value="pass">Pass</option>
                                            <option value="fail">Fail</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-1.5 rounded border">
                                        <span>Dimensions:</span>
                                        <select
                                            value={dimensions}
                                            onChange={(e) => setDimensions(e.target.value)}
                                            className="border rounded text-[11px] p-0.5"
                                        >
                                            <option value="pass">Pass</option>
                                            <option value="fail">Fail</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-1.5 rounded border">
                                        <span>Weight Check:</span>
                                        <select
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            className="border rounded text-[11px] p-0.5"
                                        >
                                            <option value="pass">Pass</option>
                                            <option value="fail">Fail</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-1.5 rounded border">
                                        <span>Finish / Polish:</span>
                                        <select
                                            value={finish}
                                            onChange={(e) => setFinish(e.target.value)}
                                            className="border rounded text-[11px] p-0.5"
                                        >
                                            <option value="pass">Pass</option>
                                            <option value="fail">Fail</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Overall QC Verdict *</label>
                                <select
                                    value={qcStatus}
                                    onChange={(e) => setQcStatus(e.target.value)}
                                    className="w-full border p-2 rounded bg-white font-semibold"
                                >
                                    <option value="passed">PASSED (Creates Finished Goods Batch & Moves Order to Ready for Dispatch)</option>
                                    <option value="rework_required">REWORK REQUIRED (Reverts Order to In Production for Shop Floor Fixes)</option>
                                    <option value="failed">FAILED / REJECTED (Defective Scrap)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Inspector Remarks</label>
                                <input
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Tested against engineering blueprint..."
                                    className="w-full border p-1.5 rounded"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowInspectModal(false)}
                                    className="px-3 py-1.5 border rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                                >
                                    Confirm Inspection
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
