import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Eye,
    Layers,
    FileCheck2,
    PackageCheck,
    Activity,
    Sliders,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Skeleton } from "../components/ui/Skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/Dialog";

export default function QualityControlPage() {
    const [inspections, setInspections] = useState([]);
    const [pendingPlans, setPendingPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Create Inspection Modal
    const [showInspectModal, setShowInspectModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [inspectedQty, setInspectedQty] = useState(10);
    const [passedQty, setPassedQty] = useState(10);
    const [failedQty, setFailedQty] = useState(0);
    const [visual, setVisual] = useState("pass");
    const [dimensions, setDimensions] = useState("pass");
    const [weight, setWeight] = useState("pass");
    const [finish, setFinish] = useState("pass");
    const [qcStatus, setQcStatus] = useState("passed");
    const [remarks, setRemarks] = useState("");

    // View Dossier Modal
    const [selectedInspection, setSelectedInspection] = useState(null);

    const fetchInspections = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (statusFilter && statusFilter !== "all") {
                params.status = statusFilter;
            }

            const res = await apiClient.get("/quality-inspections", { params });
            if (res.data?.success) {
                setInspections(res.data.data.inspections || []);
                setPagination(res.data.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load inspections");
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingPlans = async () => {
        try {
            const res = await apiClient.get("/production-plans?stage=completed&limit=50");
            if (res.data?.success) {
                setPendingPlans(res.data.data.plans || []);
            }
        } catch (err) {
            console.error("Failed to load pending plans", err);
        }
    };

    useEffect(() => {
        fetchInspections();
    }, [page, statusFilter]);

    useEffect(() => {
        fetchPendingPlans();
    }, []);

    // Quick start inspection for a pending plan
    const handleQuickInspect = (plan) => {
        setSelectedPlanId(plan._id);
        const qty = plan.producedQuantity || plan.quantity || 10;
        setInspectedQty(qty);
        setPassedQty(qty);
        setFailedQty(0);
        setVisual("pass");
        setDimensions("pass");
        setWeight("pass");
        setFinish("pass");
        setQcStatus("passed");
        setRemarks(`QC inspection for completed run ${plan.planNumber}`);
        setShowInspectModal(true);
    };

    const handleCreateInspection = async (e) => {
        e.preventDefault();

        if (!selectedPlanId) {
            toast.error("Please select a pending production plan to inspect");
            return;
        }

        const insp = Number(inspectedQty);
        const pass = Number(passedQty);
        const fail = Number(failedQty);

        if (isNaN(insp) || insp < 1) {
            toast.error("Inspected quantity must be at least 1");
            return;
        }

        if (isNaN(pass) || pass < 0 || isNaN(fail) || fail < 0) {
            toast.error("Passed and Failed quantities cannot be negative");
            return;
        }

        if (pass + fail > insp) {
            toast.error("Sum of passed and failed units cannot exceed total inspected quantity");
            return;
        }

        setCreateLoading(true);
        const loadToast = toast.loading("Submitting QC inspection and generating FG batch...");
        try {
            const payload = {
                productionPlan: selectedPlanId,
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
                remarks: remarks ? remarks.trim() : "Standard 4-point QC protocol completed",
            };

            const res = await apiClient.post("/quality-inspections", payload);
            toast.success(res.data?.message || "Quality inspection certified successfully!", { id: loadToast });
            setShowInspectModal(false);
            fetchInspections();
            fetchPendingPlans();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit quality inspection", { id: loadToast });
        } finally {
            setCreateLoading(false);
        }
    };

    // Client-side search filter
    const filteredInspections = inspections.filter((qc) => {
        if (!searchTerm.trim()) return true;
        const s = searchTerm.toLowerCase();
        return (
            qc.inspectionNumber?.toLowerCase().includes(s) ||
            qc.product?.name?.toLowerCase().includes(s) ||
            qc.salesOrder?.orderNumber?.toLowerCase().includes(s) ||
            qc.generatedBatchNumber?.toLowerCase().includes(s) ||
            qc.inspector?.name?.toLowerCase().includes(s)
        );
    });

    // KPI Metrics calculation
    const totalCount = pagination.total || inspections.length;
    const passedCount = inspections.filter((i) => i.status === "passed").length;
    const reworkCount = inspections.filter((i) => i.status === "rework_required").length;
    const rejectedCount = inspections.filter((i) => i.status === "rejected").length;
    const totalInspectedUnits = inspections.reduce((a, b) => a + (b.inspectedQuantity || 0), 0);
    const totalPassedUnits = inspections.reduce((a, b) => a + (b.passedQuantity || 0), 0);
    const firstPassYield = totalInspectedUnits > 0
        ? ((totalPassedUnits / totalInspectedUnits) * 100).toFixed(1)
        : "100.0";

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading tracking-tight">
                            Quality Control (QC) Station
                        </h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-medium font-heading">
                            {totalCount} Reports
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-body mt-0.5">
                        4-point metric certification, finished goods batch generation, and dispatch readiness
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => {
                            if (pendingPlans.length > 0) {
                                handleQuickInspect(pendingPlans[0]);
                            } else {
                                setSelectedPlanId("");
                                setShowInspectModal(true);
                            }
                        }}
                        className="rounded-xl gap-2 font-heading"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Record QC Inspection</span>
                    </Button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <Card className="rounded-2xl p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium font-heading">First-Pass Yield</span>
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-emerald-700 font-heading">{firstPassYield}%</span>
                        <span className="text-xs text-slate-400 font-body">{totalPassedUnits.toLocaleString()} passed</span>
                    </div>
                </Card>

                <Card className="rounded-2xl p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium font-heading">Passed Batches</span>
                        <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 font-heading">{passedCount}</span>
                        <span className="text-xs text-emerald-600 font-medium font-body">Ready for Dispatch</span>
                    </div>
                </Card>

                <Card className="rounded-2xl p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium font-heading">Awaiting Inspection</span>
                        <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 font-heading">{pendingPlans.length}</span>
                        <span className="text-xs text-amber-600 font-medium font-body">Completed Runs</span>
                    </div>
                </Card>

                <Card className="rounded-2xl p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium font-heading">Rework / Rejected</span>
                        <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-rose-700 font-heading">{reworkCount + rejectedCount}</span>
                        <span className="text-xs text-slate-400 font-body">{rejectedCount} scrap</span>
                    </div>
                </Card>
            </div>

            {/* Pending QC Queue Banner */}
            {pendingPlans.length > 0 && (
                <Card className="rounded-2xl border-amber-200/70 bg-amber-50/30 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-900 font-heading">
                                    {pendingPlans.length} Production Batch{pendingPlans.length > 1 ? "es" : ""} Awaiting Quality Clearance
                                </h3>
                                <p className="text-[11px] text-slate-500 font-body">
                                    Completed manufacturing batches ready for 4-point verification & FG inventory release
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                            {pendingPlans.slice(0, 3).map((plan) => (
                                <button
                                    key={plan._id}
                                    type="button"
                                    onClick={() => handleQuickInspect(plan)}
                                    className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-xs font-heading font-medium text-amber-900 hover:bg-amber-100/70 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                                >
                                    <span>{plan.planNumber}</span>
                                    <span className="text-[10px] text-amber-700">({plan.producedQuantity || plan.quantity} pcs)</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>
            )}

            {/* Filter & Search Bar */}
            <Card className="rounded-2xl">
                <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search by QC #, product, order, batch, or inspector..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9.5 text-xs rounded-xl"
                        />
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/80 rounded-xl text-xs font-heading">
                        {[
                            { key: "all", label: "All Inspections" },
                            { key: "passed", label: "Passed" },
                            { key: "rework_required", label: "Rework Required" },
                            { key: "rejected", label: "Rejected" },
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

            {/* Inspections Table */}
            <Card className="rounded-2xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-body">
                            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-3 font-semibold font-heading">Inspection #</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Product & Order</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Passed / Inspected</th>
                                    <th className="px-5 py-3 font-semibold font-heading">FG Batch Number</th>
                                    <th className="px-5 py-3 font-semibold font-heading">4 Parameters</th>
                                    <th className="px-5 py-3 font-semibold font-heading">QC Status</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Inspector</th>
                                    <th className="px-5 py-3 text-right font-semibold font-heading">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={8} className="px-5 py-3.5">
                                                <Skeleton className="h-5 w-full rounded" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredInspections.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                                            No quality inspection reports found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInspections.map((qc) => {
                                        const passRate = qc.inspectedQuantity > 0
                                            ? Math.round((qc.passedQuantity / qc.inspectedQuantity) * 100)
                                            : 100;

                                        return (
                                            <tr
                                                key={qc._id}
                                                onClick={() => setSelectedInspection(qc)}
                                                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                            >
                                                {/* Inspection # */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 font-heading">
                                                            <ShieldCheck className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-slate-900 group-hover:text-sky-600 font-heading block">
                                                                {qc.inspectionNumber}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">
                                                                {new Date(qc.createdAt || Date.now()).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Product & Order */}
                                                <td className="px-5 py-3.5">
                                                    <span className="font-medium text-slate-800 block truncate max-w-[160px]">
                                                        {qc.product?.name || "Product"}
                                                    </span>
                                                    <span className="text-[11px] font-mono text-sky-600 block">
                                                        {qc.salesOrder?.orderNumber || "Linked SO"}
                                                    </span>
                                                </td>

                                                {/* Passed / Inspected */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-emerald-700 font-heading">
                                                            {qc.passedQuantity}
                                                        </span>
                                                        <span className="text-slate-400">/</span>
                                                        <span className="text-slate-600">
                                                            {qc.inspectedQuantity} pcs
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            ({passRate}%)
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* FG Batch */}
                                                <td className="px-5 py-3.5 font-mono text-xs">
                                                    {qc.generatedBatchNumber ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-medium text-[11px]">
                                                            {qc.generatedBatchNumber}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>

                                                {/* 4 Parameters */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1 font-mono text-[10px]">
                                                        <span className={`px-1.5 py-0.5 rounded font-semibold ${qc.parameters?.visualInspection === "pass" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`} title="Visual Inspection">
                                                            V:{qc.parameters?.visualInspection === "pass" ? "P" : "F"}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded font-semibold ${qc.parameters?.dimensions === "pass" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`} title="Dimensional Accuracy">
                                                            D:{qc.parameters?.dimensions === "pass" ? "P" : "F"}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded font-semibold ${qc.parameters?.weight === "pass" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`} title="Weight Verification">
                                                            W:{qc.parameters?.weight === "pass" ? "P" : "F"}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded font-semibold ${qc.parameters?.finish === "pass" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`} title="Surface Finish">
                                                            F:{qc.parameters?.finish === "pass" ? "P" : "F"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* QC Status */}
                                                <td className="px-5 py-3.5">
                                                    <Badge
                                                        variant={
                                                            qc.status === "passed"
                                                                ? "success"
                                                                : qc.status === "rework_required"
                                                                ? "amber"
                                                                : "destructive"
                                                        }
                                                        className="text-[10px]"
                                                    >
                                                        {qc.status?.replace("_", " ").toUpperCase()}
                                                    </Badge>
                                                </td>

                                                {/* Inspector */}
                                                <td className="px-5 py-3.5 text-slate-600">
                                                    <span className="block truncate max-w-[120px]">
                                                        {qc.inspector?.name || "QC Inspector"}
                                                    </span>
                                                </td>

                                                {/* Action */}
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSelectedInspection(qc)}
                                                            className="h-7 px-2 text-[11px] rounded-lg text-slate-500 hover:text-slate-900"
                                                        >
                                                            Dossier
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
                                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} reports)
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

            {/* ─── MODAL 1: VIEW INSPECTION DOSSIER ──────────────────────────────── */}
            {selectedInspection && (
                <Dialog open={!!selectedInspection} onOpenChange={() => setSelectedInspection(null)}>
                    <DialogContent className="max-w-lg rounded-2xl p-6">
                        <DialogHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-base font-bold text-slate-900 font-heading">
                                            {selectedInspection.inspectionNumber}
                                        </DialogTitle>
                                        <Badge
                                            variant={
                                                selectedInspection.status === "passed"
                                                    ? "success"
                                                    : selectedInspection.status === "rework_required"
                                                    ? "amber"
                                                    : "destructive"
                                            }
                                        >
                                            {selectedInspection.status?.replace("_", " ").toUpperCase()}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 font-body mt-0.5">
                                        Product: {selectedInspection.product?.name}
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 my-2 text-xs font-body">
                            {/* Summary Card */}
                            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-center">
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">INSPECTED</span>
                                    <span className="text-base font-bold text-slate-900 font-heading">
                                        {selectedInspection.inspectedQuantity} pcs
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">PASSED</span>
                                    <span className="text-base font-bold text-emerald-700 font-heading">
                                        {selectedInspection.passedQuantity} pcs
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-heading">FAILED</span>
                                    <span className="text-base font-bold text-rose-700 font-heading">
                                        {selectedInspection.failedQuantity || 0} pcs
                                    </span>
                                </div>
                            </div>

                            {/* Generated Batch Info */}
                            {selectedInspection.generatedBatchNumber && (
                                <div className="p-3 bg-sky-50/50 border border-sky-100 rounded-xl flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] text-sky-800 font-semibold block font-heading">
                                            GENERATED FINISHED GOODS BATCH
                                        </span>
                                        <span className="font-mono text-xs font-bold text-sky-900">
                                            {selectedInspection.generatedBatchNumber}
                                        </span>
                                    </div>
                                    <Badge variant="sky">Ready for Shipping</Badge>
                                </div>
                            )}

                            {/* 4 Parameters Breakdown */}
                            <div>
                                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-2 font-heading">
                                    4-Point Inspection Checklist
                                </span>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {[
                                        { label: "Visual Inspection", value: selectedInspection.parameters?.visualInspection },
                                        { label: "Dimensional Accuracy", value: selectedInspection.parameters?.dimensions },
                                        { label: "Weight Verification", value: selectedInspection.parameters?.weight },
                                        { label: "Surface Finish", value: selectedInspection.parameters?.finish },
                                    ].map((item, i) => {
                                        const isPass = item.value === "pass";
                                        return (
                                            <div
                                                key={i}
                                                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                                    isPass
                                                        ? "bg-emerald-50/50 border-emerald-200/70 text-emerald-900"
                                                        : "bg-rose-50/50 border-rose-200/70 text-rose-900"
                                                }`}
                                            >
                                                <span className="font-medium text-[11px]">{item.label}</span>
                                                <span className="font-bold text-[10px] uppercase font-heading">
                                                    {isPass ? "PASS" : "FAIL"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Linked Order & Inspector */}
                            <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Sales Order</span>
                                    <span className="font-mono font-medium text-slate-800">
                                        {selectedInspection.salesOrder?.orderNumber || "Direct Production"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Inspecting Officer</span>
                                    <span className="font-medium text-slate-800">
                                        {selectedInspection.inspector?.name || "QC Department"}
                                    </span>
                                </div>
                            </div>

                            {/* Remarks */}
                            {selectedInspection.remarks && (
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Inspector Remarks</span>
                                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs mt-1">
                                        {selectedInspection.remarks}
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                variant="secondary"
                                onClick={() => setSelectedInspection(null)}
                                className="rounded-xl w-full"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* ─── MODAL 2: RECORD QC INSPECTION MODAL ───────────────────────────── */}
            {showInspectModal && (
                <Dialog open={showInspectModal} onOpenChange={setShowInspectModal}>
                    <DialogContent className="max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 font-heading">
                                Record Quality Inspection
                            </DialogTitle>
                            <p className="text-xs text-slate-500 font-body">
                                Certify manufacturing run output, assess checklist metrics, and create FG inventory batch
                            </p>
                        </DialogHeader>

                        <form onSubmit={handleCreateInspection} className="space-y-4 mt-3 text-xs font-body">
                            <div>
                                <Label className="text-xs font-heading">Production Run (Completed Stage) *</Label>
                                <select
                                    value={selectedPlanId}
                                    onChange={(e) => {
                                        const pId = e.target.value;
                                        setSelectedPlanId(pId);
                                        const p = pendingPlans.find((x) => x._id === pId);
                                        if (p) {
                                            const qty = p.producedQuantity || p.quantity || 10;
                                            setInspectedQty(qty);
                                            setPassedQty(qty);
                                            setFailedQty(0);
                                        }
                                    }}
                                    className="w-full mt-1 h-9 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                                    required
                                >
                                    <option value="">Select Completed Production Run</option>
                                    {pendingPlans.map((p) => (
                                        <option key={p._id} value={p._id}>
                                            {p.planNumber} — {p.product?.name} ({p.producedQuantity || p.quantity} pcs)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5">
                                <div>
                                    <Label className="text-xs font-heading">Inspected Qty *</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={inspectedQty}
                                        onChange={(e) => setInspectedQty(e.target.value)}
                                        className="mt-1 h-9 rounded-xl text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-heading">Passed Qty *</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={passedQty}
                                        onChange={(e) => {
                                            const p = Number(e.target.value);
                                            setPassedQty(e.target.value);
                                            if (!isNaN(p) && p <= Number(inspectedQty)) {
                                                setFailedQty(Number(inspectedQty) - p);
                                            }
                                        }}
                                        className="mt-1 h-9 rounded-xl text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-heading">Failed Qty</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={failedQty}
                                        onChange={(e) => setFailedQty(e.target.value)}
                                        className="mt-1 h-9 rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            {/* 4-Parameter Checklist */}
                            <div>
                                <Label className="text-xs font-heading block mb-2">4-Point Quality Metrics</Label>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {[
                                        { label: "Visual Inspection", state: visual, set: setVisual },
                                        { label: "Dimensions", state: dimensions, set: setDimensions },
                                        { label: "Weight Verification", state: weight, set: setWeight },
                                        { label: "Surface Finish", state: finish, set: setFinish },
                                    ].map((metric, i) => (
                                        <div
                                            key={i}
                                            className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
                                        >
                                            <span className="font-medium text-slate-800 text-[11px]">{metric.label}</span>
                                            <div className="flex items-center gap-1 font-heading text-[10px]">
                                                <button
                                                    type="button"
                                                    onClick={() => metric.set("pass")}
                                                    className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                                                        metric.state === "pass"
                                                            ? "bg-emerald-600 text-white shadow-2xs"
                                                            : "bg-white text-slate-500 border border-slate-200"
                                                    }`}
                                                >
                                                    Pass
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => metric.set("fail")}
                                                    className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                                                        metric.state === "fail"
                                                            ? "bg-rose-600 text-white shadow-2xs"
                                                            : "bg-white text-slate-500 border border-slate-200"
                                                    }`}
                                                >
                                                    Fail
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-heading">Overall Outcome *</Label>
                                <select
                                    value={qcStatus}
                                    onChange={(e) => setQcStatus(e.target.value)}
                                    className="w-full mt-1 h-9 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                                >
                                    <option value="passed">Passed (Approves Batch & Ready for Dispatch)</option>
                                    <option value="rework_required">Rework Required (Returns to Assembly)</option>
                                    <option value="rejected">Rejected (Scrap Batch)</option>
                                </select>
                            </div>

                            <div>
                                <Label className="text-xs font-heading">Inspector Notes & Observations</Label>
                                <Input
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="e.g. Dimensions calibrated to ±0.05mm tolerance"
                                    className="mt-1 h-9 rounded-xl text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowInspectModal(false)}
                                    className="rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createLoading}
                                    className="rounded-xl font-heading"
                                >
                                    {createLoading ? "Certifying..." : "Submit Inspection"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
