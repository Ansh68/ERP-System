import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import {
    Layers,
    Plus,
    Search,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Wrench,
    Calendar,
    User,
    Edit3,
    X,
    Cpu,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Boxes,
    FileText,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Skeleton } from "../components/ui/Skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/Dialog";

const STAGES = [
    { key: "planned", label: "Planned", color: "bg-slate-100 text-slate-700 border-slate-200" },
    { key: "material_issued", label: "Material Issued", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { key: "manufacturing", label: "Manufacturing", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { key: "assembly", label: "Assembly", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { key: "packaging", label: "Packaging", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    { key: "completed", label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { key: "cancelled", label: "Cancelled", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

const STAGE_ORDER = ["planned", "material_issued", "manufacturing", "assembly", "packaging", "completed"];

export default function ProductionPage() {
    const [plans, setPlans] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stageFilter, setStageFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    // Schedule Plan Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createForm, setCreateForm] = useState({
        salesOrder: "",
        product: "",
        quantity: 10,
        machine: "CNC Mill Line 01",
        shift: "morning",
        operator: "Vikram Rathore",
        supervisor: "",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        remarks: "High precision batch setup",
    });

    // Advance Stage Modal
    const [advanceModalPlan, setAdvanceModalPlan] = useState(null);
    const [advanceLoading, setAdvanceLoading] = useState(false);
    const [advanceForm, setAdvanceForm] = useState({
        stage: "material_issued",
        producedQuantity: "",
        rejectedQuantity: 0,
        remarks: "",
    });

    // Plan Dossier / Detail Modal
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [dossierTab, setDossierTab] = useState("overview"); // "overview" | "edit"
    const [editForm, setEditForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (stageFilter && stageFilter !== "all") {
                params.stage = stageFilter;
            }

            const res = await apiClient.get("/production-plans", { params });
            if (res.data?.success) {
                setPlans(res.data.data.plans || []);
                setPagination(res.data.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load production plans");
        } finally {
            setLoading(false);
        }
    };

    const fetchMetadata = async () => {
        try {
            const [ordersRes, prodRes, usersRes] = await Promise.all([
                apiClient.get("/orders?limit=50").catch(() => ({ data: { success: false } })),
                apiClient.get("/products?limit=100").catch(() => ({ data: { success: false } })),
                apiClient.get("/auth/users").catch(() => ({ data: { success: false } })),
            ]);
            if (ordersRes.data?.success) setOrders(ordersRes.data.data.orders || []);
            if (prodRes.data?.success) setProducts(prodRes.data.data.products || []);
            if (usersRes.data?.success) setUsers(usersRes.data.data || []);
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

    // Open detail dossier modal for clicked plan
    const handleViewPlan = async (plan) => {
        setSelectedPlan(plan);
        setDossierTab("overview");
        setEditForm({
            machine: plan.machine || "",
            shift: plan.shift || "morning",
            operator: plan.operator || "",
            supervisor: plan.supervisor?._id || "",
            startDate: plan.startDate ? new Date(plan.startDate).toISOString().slice(0, 10) : "",
            endDate: plan.endDate ? new Date(plan.endDate).toISOString().slice(0, 10) : "",
            remarks: plan.remarks || "",
        });
    };

    // Open advance stage modal
    const handleOpenAdvance = (plan, e) => {
        if (e) e.stopPropagation();
        setAdvanceModalPlan(plan);

        // Pick logical next stage
        const currentIndex = STAGE_ORDER.indexOf(plan.stage);
        const nextStageKey = currentIndex >= 0 && currentIndex < STAGE_ORDER.length - 1
            ? STAGE_ORDER[currentIndex + 1]
            : "completed";

        setAdvanceForm({
            stage: nextStageKey,
            producedQuantity: plan.producedQuantity || plan.quantity,
            rejectedQuantity: plan.rejectedQuantity || 0,
            remarks: "",
        });
    };

    // Submit advance stage
    const handleSubmitAdvance = async (e) => {
        e.preventDefault();
        if (!advanceModalPlan) return;

        const pQty = Number(advanceForm.producedQuantity);
        const rQty = Number(advanceForm.rejectedQuantity || 0);

        if (isNaN(pQty) || pQty < 0) {
            toast.error("Produced quantity cannot be negative");
            return;
        }

        if (isNaN(rQty) || rQty < 0) {
            toast.error("Rejected quantity cannot be negative");
            return;
        }

        setAdvanceLoading(true);
        const loadToast = toast.loading(`Advancing to ${advanceForm.stage.replace("_", " ")}...`);
        try {
            const payload = {
                stage: advanceForm.stage,
                producedQuantity: pQty,
                rejectedQuantity: rQty,
                remarks: advanceForm.remarks ? advanceForm.remarks.trim() : undefined,
            };

            const res = await apiClient.post(`/production-plans/${advanceModalPlan._id}/update-stage`, payload);
            toast.success(res.data?.message || `Stage updated to ${advanceForm.stage}`, { id: loadToast });
            setAdvanceModalPlan(null);
            if (selectedPlan && selectedPlan._id === advanceModalPlan._id) {
                // Refresh dossier
                const updated = await apiClient.get(`/production-plans/${advanceModalPlan._id}`);
                if (updated.data?.success) setSelectedPlan(updated.data.data);
            }
            fetchPlans();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update production stage", { id: loadToast });
        } finally {
            setAdvanceLoading(false);
        }
    };

    // Submit update plan details (PATCH /production-plans/:id)
    const handleSavePlanDetails = async (e) => {
        e.preventDefault();
        if (!selectedPlan) return;

        setEditLoading(true);
        const saveToast = toast.loading("Saving plan details...");
        try {
            const payload = {
                machine: editForm.machine?.trim(),
                shift: editForm.shift,
                operator: editForm.operator?.trim(),
                supervisor: editForm.supervisor || undefined,
                startDate: editForm.startDate || undefined,
                endDate: editForm.endDate || undefined,
                remarks: editForm.remarks?.trim(),
            };

            const res = await apiClient.patch(`/production-plans/${selectedPlan._id}`, payload);
            toast.success(res.data?.message || "Plan updated successfully!", { id: saveToast });
            setSelectedPlan(res.data.data);
            setDossierTab("overview");
            fetchPlans();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update plan details", { id: saveToast });
        } finally {
            setEditLoading(false);
        }
    };

    // Submit schedule new plan
    const handleCreatePlan = async (e) => {
        e.preventDefault();

        if (!createForm.salesOrder) {
            toast.error("Please select an approved sales order");
            return;
        }

        if (!createForm.product) {
            toast.error("Please select a product");
            return;
        }

        if (isNaN(createForm.quantity) || Number(createForm.quantity) < 1) {
            toast.error("Production target quantity must be at least 1");
            return;
        }

        if (createForm.operator && !/^[a-zA-Z\s]{2,50}$/.test(createForm.operator.trim())) {
            toast.error("Operator name must contain only letters and spaces (2-50 characters)");
            return;
        }

        setCreateLoading(true);
        const actionToast = toast.loading("Scheduling production plan...");
        try {
            const payload = {
                salesOrder: createForm.salesOrder,
                product: createForm.product,
                quantity: Number(createForm.quantity),
                machine: createForm.machine?.trim() || "Assembly Line 1",
                shift: createForm.shift,
                operator: createForm.operator?.trim() || undefined,
                supervisor: createForm.supervisor || (users[0]?._id || undefined),
                startDate: createForm.startDate || new Date(),
                endDate: createForm.endDate || new Date(Date.now() + 3 * 86400000),
                remarks: createForm.remarks?.trim() || undefined,
            };

            await apiClient.post("/production-plans", payload);
            toast.success("Production plan scheduled successfully!", { id: actionToast });
            setShowCreateModal(false);
            setCreateForm({
                salesOrder: "",
                product: "",
                quantity: 10,
                machine: "CNC Mill Line 01",
                shift: "morning",
                operator: "Vikram Rathore",
                supervisor: "",
                startDate: new Date().toISOString().slice(0, 10),
                endDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
                remarks: "High precision batch setup",
            });
            fetchPlans();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create production plan", { id: actionToast });
        } finally {
            setCreateLoading(false);
        }
    };

    // Filter plans by search term client-side
    const filteredPlans = plans.filter((p) => {
        if (!searchTerm.trim()) return true;
        const s = searchTerm.toLowerCase();
        return (
            p.planNumber?.toLowerCase().includes(s) ||
            p.product?.name?.toLowerCase().includes(s) ||
            p.product?.productCode?.toLowerCase().includes(s) ||
            p.machine?.toLowerCase().includes(s) ||
            p.operator?.toLowerCase().includes(s) ||
            p.salesOrder?.orderNumber?.toLowerCase().includes(s)
        );
    });

    // KPI Metrics calculation
    const totalPlansCount = pagination.total || plans.length;
    const completedCount = plans.filter((p) => p.stage === "completed").length;
    const inProgressCount = plans.filter((p) => ["material_issued", "manufacturing", "assembly", "packaging"].includes(p.stage)).length;
    const totalProduced = plans.reduce((acc, p) => acc + (p.producedQuantity || 0), 0);
    const totalRejected = plans.reduce((acc, p) => acc + (p.rejectedQuantity || 0), 0);
    const rejectionRate = totalProduced + totalRejected > 0
        ? ((totalRejected / (totalProduced + totalRejected)) * 100).toFixed(1)
        : "0.0";

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading tracking-tight">
                            Production Planning & Shop Floor
                        </h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 font-medium font-heading">
                            {totalPlansCount} Total Runs
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-body mt-0.5">
                        6-stage manufacturing progression, raw material allocation, and machine shift management
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-xl gap-2 font-heading"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Schedule Production Run</span>
                    </Button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <Card className="rounded-2xl p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium font-heading">Active In-Flight</span>
                        <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Cpu className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 font-heading">{inProgressCount}</span>
                        <span className="text-xs text-amber-600 font-medium font-body">On Shop Floor</span>
                    </div>
                </Card>

                <Card className="rounded-2xl p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium font-heading">Completed Batches</span>
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 font-heading">{completedCount}</span>
                        <span className="text-xs text-emerald-600 font-medium font-body">Ready for QC</span>
                    </div>
                </Card>

                <Card className="rounded-2xl p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium font-heading">Produced Units</span>
                        <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                            <Boxes className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 font-heading">{totalProduced.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 font-body">pcs</span>
                    </div>
                </Card>

                <Card className="rounded-2xl p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium font-heading">Scrap / Rejection</span>
                        <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 font-heading">{rejectionRate}%</span>
                        <span className="text-xs text-slate-500 font-body">{totalRejected} units</span>
                    </div>
                </Card>
            </div>

            {/* Filter & Search Bar */}
            <Card className="rounded-2xl">
                <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search by plan #, product, machine, operator, or order..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9.5 text-xs rounded-xl"
                        />
                    </div>

                    {/* Stage Filter Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/80 rounded-xl text-xs font-heading">
                        <button
                            type="button"
                            onClick={() => { setStageFilter("all"); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                stageFilter === "all"
                                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            All Stages
                        </button>
                        {STAGES.map((s) => (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => { setStageFilter(s.key); setPage(1); }}
                                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap capitalize ${
                                    stageFilter === s.key
                                        ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Production Plans Table */}
            <Card className="rounded-2xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-body">
                            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-3 font-semibold font-heading">Plan & Product</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Linked Sales Order</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Target / Produced</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Machine & Shift</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Operator</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Current Stage</th>
                                    <th className="px-5 py-3 text-right font-semibold font-heading">Action</th>
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
                                ) : filteredPlans.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                                            No production plans found for the selected criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPlans.map((plan) => {
                                        const stageObj = STAGES.find((s) => s.key === plan.stage) || { label: plan.stage, color: "bg-slate-100 text-slate-700 border-slate-200" };
                                        const canAdvance = !["completed", "cancelled"].includes(plan.stage);

                                        return (
                                            <tr
                                                key={plan._id}
                                                onClick={() => handleViewPlan(plan)}
                                                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                            >
                                                {/* Plan & Product */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs shrink-0 font-heading">
                                                            <Wrench className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-semibold text-slate-900 group-hover:text-sky-600 font-heading block truncate">
                                                                {plan.planNumber || "PP-RUN"}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 block truncate font-mono">
                                                                {plan.product?.name || plan.product?.productCode || "Custom Part"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Linked Order */}
                                                <td className="px-5 py-3.5 font-mono text-slate-600">
                                                    {plan.salesOrder?.orderNumber ? (
                                                        <span className="text-sky-600 font-medium">
                                                            {plan.salesOrder.orderNumber}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">Stock Buffer</span>
                                                    )}
                                                </td>

                                                {/* Target / Produced */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-900 font-heading">
                                                            {plan.producedQuantity || 0}
                                                        </span>
                                                        <span className="text-slate-400">/</span>
                                                        <span className="text-slate-500 font-medium">
                                                            {plan.quantity} pcs
                                                        </span>
                                                    </div>
                                                    {plan.rejectedQuantity > 0 && (
                                                        <span className="text-[10px] text-rose-600 font-medium block">
                                                            +{plan.rejectedQuantity} rejected
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Machine & Shift */}
                                                <td className="px-5 py-3.5 text-slate-700">
                                                    <span className="font-medium block truncate max-w-[140px]">
                                                        {plan.machine || "Assembly Line"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 capitalize block">
                                                        {plan.shift} shift
                                                    </span>
                                                </td>

                                                {/* Operator */}
                                                <td className="px-5 py-3.5 text-slate-600">
                                                    <span className="block truncate max-w-[120px]">
                                                        {plan.operator || "Shop Floor Team"}
                                                    </span>
                                                </td>

                                                {/* Stage Badge */}
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${stageObj.color} font-heading`}>
                                                        {stageObj.label}
                                                    </span>
                                                </td>

                                                {/* Action */}
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                        {canAdvance && (
                                                            <Button
                                                                size="sm"
                                                                onClick={(e) => handleOpenAdvance(plan, e)}
                                                                className="h-7 px-2.5 text-[11px] rounded-lg font-heading gap-1"
                                                            >
                                                                <span>Advance</span>
                                                                <ArrowRight className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewPlan(plan)}
                                                            className="h-7 px-2 text-[11px] rounded-lg text-slate-500 hover:text-slate-900"
                                                        >
                                                            Details
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
                                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} runs)
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

            {/* ─── MODAL 1: PLAN DETAIL & DOSSIER (CLICK-TO-VIEW & EDIT) ────────── */}
            {selectedPlan && (
                <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
                        <DialogHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-lg font-bold text-slate-900 font-heading">
                                            {selectedPlan.planNumber}
                                        </DialogTitle>
                                        <Badge variant={selectedPlan.stage === "completed" ? "success" : "sky"}>
                                            {selectedPlan.stage?.replace("_", " ").toUpperCase()}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 font-body mt-0.5">
                                        Product: {selectedPlan.product?.name} ({selectedPlan.product?.productCode})
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Lifecycle Stepper */}
                        <div className="my-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/70">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-3 font-heading">
                                6-Stage Manufacturing Pipeline
                            </span>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[10px] font-heading">
                                {STAGE_ORDER.map((stageKey, idx) => {
                                    const currentIndex = STAGE_ORDER.indexOf(selectedPlan.stage);
                                    const isDone = currentIndex >= idx;
                                    const isCurrent = selectedPlan.stage === stageKey;

                                    return (
                                        <div
                                            key={stageKey}
                                            className={`p-2 rounded-lg border transition-all ${
                                                isCurrent
                                                    ? "bg-sky-50 border-sky-400 text-sky-800 font-bold shadow-2xs"
                                                    : isDone
                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium"
                                                    : "bg-white border-slate-200 text-slate-400"
                                            }`}
                                        >
                                            <div className="flex items-center justify-center mb-1">
                                                {isDone ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                ) : (
                                                    <Clock className="h-3.5 w-3.5 text-slate-300" />
                                                )}
                                            </div>
                                            <span className="capitalize block truncate">
                                                {stageKey.replace("_", " ")}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Segmented Tabs: Overview vs Edit */}
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setDossierTab("overview")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-heading transition-colors ${
                                    dossierTab === "overview"
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-500 hover:text-slate-900"
                                }`}
                            >
                                Overview & Logs
                            </button>
                            <button
                                type="button"
                                onClick={() => setDossierTab("edit")}
                                disabled={["completed", "cancelled"].includes(selectedPlan.stage)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-heading transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                    dossierTab === "edit"
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-500 hover:text-slate-900"
                                }`}
                            >
                                Edit Plan Setup
                            </button>
                        </div>

                        {dossierTab === "overview" ? (
                            <div className="space-y-4 text-xs font-body">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Target Quantity</span>
                                        <span className="font-semibold text-slate-900 text-sm font-heading">
                                            {selectedPlan.quantity} units
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Produced Units</span>
                                        <span className="font-semibold text-emerald-600 text-sm font-heading">
                                            {selectedPlan.producedQuantity || 0} units
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Scrap / Rejected</span>
                                        <span className="font-semibold text-rose-600 text-sm font-heading">
                                            {selectedPlan.rejectedQuantity || 0} units
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Machine Allocation</span>
                                        <span className="font-medium text-slate-800">
                                            {selectedPlan.machine || "Assembly Line"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Shift</span>
                                        <span className="font-medium text-slate-800 capitalize">
                                            {selectedPlan.shift}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Operator</span>
                                        <span className="font-medium text-slate-800">
                                            {selectedPlan.operator || "Shop Floor Team"}
                                        </span>
                                    </div>
                                </div>

                                {/* Linked Sales Order */}
                                {selectedPlan.salesOrder && (
                                    <div className="p-3 bg-sky-50/50 border border-sky-100 rounded-xl">
                                        <span className="text-[11px] font-semibold text-sky-800 block mb-1 font-heading">
                                            Linked Sales Order
                                        </span>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-mono font-medium text-sky-900">
                                                {selectedPlan.salesOrder.orderNumber || "SO-ORDER"}
                                            </span>
                                            <span className="text-slate-500 capitalize">
                                                Status: {selectedPlan.salesOrder.status?.replace("_", " ")}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Stage Progression History Timeline */}
                                <div>
                                    <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-2 font-heading">
                                        Audit & Stage Progression History
                                    </span>
                                    {selectedPlan.stageHistory && selectedPlan.stageHistory.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedPlan.stageHistory.map((h, i) => (
                                                <div
                                                    key={i}
                                                    className="p-2.5 rounded-lg border border-slate-100 bg-white flex items-start justify-between text-[11px]"
                                                >
                                                    <div>
                                                        <span className="font-semibold capitalize text-slate-900 font-heading">
                                                            {h.stage?.replace("_", " ")}
                                                        </span>
                                                        {h.remarks && (
                                                            <p className="text-slate-500 text-[10px] mt-0.5">
                                                                Note: {h.remarks}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right text-[10px] text-slate-400">
                                                        <span>{new Date(h.timestamp || Date.now()).toLocaleDateString()}</span>
                                                        {h.updatedBy?.name && (
                                                            <span className="block text-slate-500">{h.updatedBy.name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No transition history recorded yet.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSavePlanDetails} className="space-y-3.5 text-xs font-body">
                                <div>
                                    <Label className="text-xs">Machine / Workstation</Label>
                                    <Input
                                        value={editForm.machine}
                                        onChange={(e) => setEditForm({ ...editForm, machine: e.target.value })}
                                        className="mt-1 h-9 rounded-xl text-xs"
                                        placeholder="e.g. CNC Mill Line 02"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Shift</Label>
                                        <select
                                            value={editForm.shift}
                                            onChange={(e) => setEditForm({ ...editForm, shift: e.target.value })}
                                            className="w-full mt-1 h-9 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                                        >
                                            <option value="morning">Morning</option>
                                            <option value="evening">Evening</option>
                                            <option value="night">Night</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Operator Name</Label>
                                        <Input
                                            value={editForm.operator}
                                            onChange={(e) => setEditForm({ ...editForm, operator: e.target.value })}
                                            className="mt-1 h-9 rounded-xl text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Start Date</Label>
                                        <Input
                                            type="date"
                                            value={editForm.startDate}
                                            onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                                            className="mt-1 h-9 rounded-xl text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Target End Date</Label>
                                        <Input
                                            type="date"
                                            value={editForm.endDate}
                                            onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                                            className="mt-1 h-9 rounded-xl text-xs"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Supervisor</Label>
                                    <select
                                        value={editForm.supervisor}
                                        onChange={(e) => setEditForm({ ...editForm, supervisor: e.target.value })}
                                        className="w-full mt-1 h-9 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                                    >
                                        <option value="">Select Supervisor</option>
                                        {users.map((u) => (
                                            <option key={u._id} value={u._id}>
                                                {u.name} ({u.role?.replace("_", " ")})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs">Remarks / Setup Notes</Label>
                                    <Input
                                        value={editForm.remarks}
                                        onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                                        className="mt-1 h-9 rounded-xl text-xs"
                                    />
                                </div>
                                <div className="pt-2 flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setDossierTab("overview")}
                                        className="rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={editLoading} className="rounded-xl font-heading">
                                        {editLoading ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        )}

                        <DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            {!["completed", "cancelled"].includes(selectedPlan.stage) && (
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        const p = selectedPlan;
                                        setSelectedPlan(null);
                                        handleOpenAdvance(p);
                                    }}
                                    className="rounded-xl font-heading gap-1.5"
                                >
                                    <span>Advance Stage</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedPlan(null)}
                                className="rounded-xl ml-auto"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* ─── MODAL 2: ADVANCE STAGE MODAL ─────────────────────────────────── */}
            {advanceModalPlan && (
                <Dialog open={!!advanceModalPlan} onOpenChange={() => setAdvanceModalPlan(null)}>
                    <DialogContent className="max-w-md rounded-2xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 font-heading">
                                Advance Production Run
                            </DialogTitle>
                            <p className="text-xs text-slate-500 font-body">
                                Plan: <span className="font-mono font-medium text-slate-800">{advanceModalPlan.planNumber}</span> ({advanceModalPlan.product?.name})
                            </p>
                        </DialogHeader>

                        <form onSubmit={handleSubmitAdvance} className="space-y-4 mt-3 text-xs font-body">
                            <div>
                                <Label className="text-xs font-heading">Next Stage</Label>
                                <select
                                    value={advanceForm.stage}
                                    onChange={(e) => setAdvanceForm({ ...advanceForm, stage: e.target.value })}
                                    className="w-full mt-1 h-9 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                                >
                                    <option value="material_issued">Material Issued (Allocates Stock)</option>
                                    <option value="manufacturing">Manufacturing (Machining / Cutting)</option>
                                    <option value="assembly">Assembly (Component Fitment)</option>
                                    <option value="packaging">Packaging (Box & Label)</option>
                                    <option value="completed">Completed (Triggers QC Inspection)</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-heading">Produced Quantity</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={advanceForm.producedQuantity}
                                        onChange={(e) => setAdvanceForm({ ...advanceForm, producedQuantity: e.target.value })}
                                        className="mt-1 h-9 rounded-xl text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-heading">Scrap / Rejected Qty</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={advanceForm.rejectedQuantity}
                                        onChange={(e) => setAdvanceForm({ ...advanceForm, rejectedQuantity: e.target.value })}
                                        className="mt-1 h-9 rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-heading">Notes / Shift Remarks</Label>
                                <Input
                                    value={advanceForm.remarks}
                                    onChange={(e) => setAdvanceForm({ ...advanceForm, remarks: e.target.value })}
                                    placeholder="e.g. Dimensions calibrated, zero defect run"
                                    className="mt-1 h-9 rounded-xl text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setAdvanceModalPlan(null)}
                                    className="rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={advanceLoading}
                                    className="rounded-xl font-heading"
                                >
                                    {advanceLoading ? "Updating..." : "Confirm Stage"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* ─── MODAL 3: SCHEDULE NEW PRODUCTION PLAN ────────────────────────── */}
            {showCreateModal && (
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent className="max-w-xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 font-heading">
                                Schedule New Production Run
                            </DialogTitle>
                            <p className="text-xs text-slate-500 font-body">
                                Bind an approved sales order to a bill of materials and assign shop floor capacity
                            </p>
                        </DialogHeader>

                        <form onSubmit={handleCreatePlan} className="space-y-3.5 mt-3 text-xs font-body">
                            <div>
                                <Label className="text-xs font-heading">Sales Order Reference *</Label>
                                <select
                                    value={createForm.salesOrder}
                                    onChange={(e) => {
                                        const orderId = e.target.value;
                                        const sel = orders.find((o) => o._id === orderId);
                                        setCreateForm({
                                            ...createForm,
                                            salesOrder: orderId,
                                            product: sel?.items?.[0]?.product?._id || sel?.items?.[0]?.product || createForm.product,
                                            quantity: sel?.items?.[0]?.quantity || createForm.quantity,
                                        });
                                    }}
                                    className="w-full mt-1 h-9 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                                    required
                                >
                                    <option value="">Select Sales Order</option>
                                    {orders.map((o) => (
                                        <option key={o._id} value={o._id}>
                                            {o.orderNumber} — {o.customer?.companyName || "Client"} ({o.status?.replace("_", " ")})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-heading">Product *</Label>
                                    <select
                                        value={createForm.product}
                                        onChange={(e) => setCreateForm({ ...createForm, product: e.target.value })}
                                        className="w-full mt-1 h-9 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                                        required
                                    >
                                        <option value="">Select Product</option>
                                        {products.map((p) => (
                                            <option key={p._id} value={p._id}>
                                                {p.name} ({p.productCode})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-heading">Target Quantity *</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={createForm.quantity}
                                        onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
                                        className="mt-1 h-9 rounded-xl text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-heading">Machine / Line</Label>
                                    <Input
                                        value={createForm.machine}
                                        onChange={(e) => setCreateForm({ ...createForm, machine: e.target.value })}
                                        placeholder="e.g. CNC Mill Line 01"
                                        className="mt-1 h-9 rounded-xl text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-heading">Shift</Label>
                                    <select
                                        value={createForm.shift}
                                        onChange={(e) => setCreateForm({ ...createForm, shift: e.target.value })}
                                        className="w-full mt-1 h-9 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                                    >
                                        <option value="morning">Morning Shift</option>
                                        <option value="evening">Evening Shift</option>
                                        <option value="night">Night Shift</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-heading">Operator Name</Label>
                                    <Input
                                        value={createForm.operator}
                                        onChange={(e) => setCreateForm({ ...createForm, operator: e.target.value })}
                                        placeholder="e.g. Vikram Rathore"
                                        className="mt-1 h-9 rounded-xl text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-heading">Supervisor</Label>
                                    <select
                                        value={createForm.supervisor}
                                        onChange={(e) => setCreateForm({ ...createForm, supervisor: e.target.value })}
                                        className="w-full mt-1 h-9 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                                    >
                                        <option value="">Select Supervisor</option>
                                        {users.map((u) => (
                                            <option key={u._id} value={u._id}>
                                                {u.name} ({u.role?.replace("_", " ")})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-heading">Planned Start</Label>
                                    <Input
                                        type="date"
                                        value={createForm.startDate}
                                        onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                                        className="mt-1 h-9 rounded-xl text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-heading">Planned Completion</Label>
                                    <Input
                                        type="date"
                                        value={createForm.endDate}
                                        onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                                        className="mt-1 h-9 rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-heading">Remarks / Execution Instructions</Label>
                                <Input
                                    value={createForm.remarks}
                                    onChange={(e) => setCreateForm({ ...createForm, remarks: e.target.value })}
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
                                    {createLoading ? "Scheduling..." : "Schedule Plan"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
