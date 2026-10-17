import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import {
    Boxes,
    Search,
    Plus,
    AlertTriangle,
    CheckCircle2,
    RotateCw,
    Edit3,
    Eye,
    TrendingUp,
    TrendingDown,
    SlidersHorizontal,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Package,
    ArrowRight,
    X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/Dialog";
import { Skeleton } from "../components/ui/Skeleton";

export default function RawMaterialsPage() {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    // Modal state: Create Material
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createForm, setCreateForm] = useState({
        materialCode: "",
        name: "",
        category: "Metals & Hardware",
        unit: "pcs",
        unitPrice: "",
        currentStock: 0,
        minStock: 0,
        reorderLevel: 0,
        warehouse: "Warehouse Bay A",
    });

    // Modal state: View / Edit Material Details
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);

    // Modal state: Stock Adjustment
    const [adjustMaterial, setAdjustMaterial] = useState(null);
    const [adjustType, setAdjustType] = useState("add"); // "add" or "reduce"
    const [adjustQty, setAdjustQty] = useState("");
    const [adjustReason, setAdjustReason] = useState("purchase");
    const [adjustNotes, setAdjustNotes] = useState("");
    const [adjustLoading, setAdjustLoading] = useState(false);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 12 };
            if (search.trim()) params.search = search.trim();
            if (lowStockOnly) params.lowStock = "true";

            const res = await apiClient.get("/raw-materials", { params });
            if (res.data?.success) {
                setMaterials(res.data.data.materials);
                setPagination(res.data.data.pagination);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load materials");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, [page, lowStockOnly]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchMaterials();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    // Open detail modal for clicked material
    const handleViewMaterial = (mat) => {
        setSelectedMaterial(mat);
        setIsEditing(false);
        setEditForm({
            name: mat.name || "",
            category: mat.category || "Metals & Hardware",
            unit: mat.unit || "pcs",
            unitPrice: mat.unitPrice || 0,
            minimumStockLevel: mat.minimumStockLevel || 0,
            reorderLevel: mat.reorderLevel || 0,
            warehouse: mat.warehouse || "Warehouse Bay A",
        });
    };

    // Create Raw Material
    const handleCreateMaterial = async (e) => {
        e.preventDefault();

        if (!createForm.materialCode.trim() || createForm.materialCode.trim().length < 2) {
            toast.error("Material Code must be at least 2 characters long");
            return;
        }

        if (!createForm.name.trim() || createForm.name.trim().length < 2) {
            toast.error("Material Name must be at least 2 characters long");
            return;
        }

        if (isNaN(createForm.unitPrice) || Number(createForm.unitPrice) < 0) {
            toast.error("Unit price cannot be negative");
            return;
        }

        if (Number(createForm.currentStock) < 0 || Number(createForm.minStock) < 0 || Number(createForm.reorderLevel) < 0) {
            toast.error("Stock levels cannot be negative");
            return;
        }

        setCreateLoading(true);
        const actionToast = toast.loading("Registering raw material...");

        try {
            const payload = {
                materialCode: createForm.materialCode.trim().toUpperCase(),
                name: createForm.name.trim(),
                unit: createForm.unit,
                unitPrice: Number(createForm.unitPrice),
                currentStock: Number(createForm.currentStock),
                minimumStockLevel: Number(createForm.minStock),
                reorderLevel: Number(createForm.reorderLevel),
                warehouse: createForm.warehouse.trim() || "Warehouse Bay A",
            };

            await apiClient.post("/raw-materials", payload);
            toast.success("Raw material created successfully!", { id: actionToast });
            setShowCreateModal(false);
            setCreateForm({
                materialCode: "",
                name: "",
                category: "Metals & Hardware",
                unit: "pcs",
                unitPrice: "",
                currentStock: 0,
                minStock: 0,
                reorderLevel: 0,
                warehouse: "Warehouse Bay A",
            });
            fetchMaterials();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create raw material", { id: actionToast });
        } finally {
            setCreateLoading(false);
        }
    };

    // Update Material Details
    const handleUpdateMaterial = async (e) => {
        e.preventDefault();
        if (!selectedMaterial) return;

        if (!editForm.name.trim() || editForm.name.trim().length < 2) {
            toast.error("Material Name must be at least 2 characters long");
            return;
        }

        if (isNaN(editForm.unitPrice) || Number(editForm.unitPrice) < 0) {
            toast.error("Unit price cannot be negative");
            return;
        }

        setEditLoading(true);
        const actionToast = toast.loading("Updating raw material...");

        try {
            const payload = {
                name: editForm.name.trim(),
                unitPrice: Number(editForm.unitPrice),
                minimumStockLevel: Number(editForm.minimumStockLevel),
                reorderLevel: Number(editForm.reorderLevel),
                warehouse: editForm.warehouse ? editForm.warehouse.trim() : undefined,
            };

            const res = await apiClient.patch(`/raw-materials/${selectedMaterial._id}`, payload);
            toast.success("Raw material updated successfully!", { id: actionToast });
            setIsEditing(false);
            if (res.data?.data) {
                setSelectedMaterial(res.data.data);
            }
            fetchMaterials();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update material", { id: actionToast });
        } finally {
            setEditLoading(false);
        }
    };

    // Stock Adjustment
    const handleAdjustStock = async (e) => {
        e.preventDefault();
        if (!adjustMaterial) return;

        const qtyNum = Number(adjustQty);
        if (isNaN(qtyNum) || qtyNum <= 0) {
            toast.error("Please enter a valid positive quantity to adjust");
            return;
        }

        const signedQty = adjustType === "add" ? qtyNum : -qtyNum;

        setAdjustLoading(true);
        const actionToast = toast.loading("Adjusting physical warehouse stock...");

        try {
            const payload = {
                adjustment: signedQty,
                reason: `${adjustReason.replace("_", " ")}: ${adjustNotes.trim() || "Warehouse audit"}`,
            };

            const res = await apiClient.post(`/raw-materials/${adjustMaterial._id}/adjust-stock`, payload);
            toast.success(res.data?.message || "Stock adjusted successfully!", { id: actionToast });
            setAdjustMaterial(null);
            setAdjustQty("");
            setAdjustNotes("");
            fetchMaterials();
            if (selectedMaterial && selectedMaterial._id === adjustMaterial._id) {
                const refreshed = await apiClient.get(`/raw-materials/${adjustMaterial._id}`);
                if (refreshed.data?.data) setSelectedMaterial(refreshed.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to adjust stock", { id: actionToast });
        } finally {
            setAdjustLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading tracking-tight">
                            Raw Materials Inventory
                        </h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 font-medium">
                            {pagination.total || materials.length} Items Stocked
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-body mt-0.5">
                        Manage raw materials, monitor minimum stock thresholds, and log stock adjustments
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-xl gap-2 font-heading"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Raw Material</span>
                    </Button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <Card className="rounded-2xl">
                <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
                        <div className="relative flex-1">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search by material code or name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9.5 text-xs rounded-xl"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="rounded-xl font-heading">
                            Search
                        </Button>
                    </form>

                    {/* Stock Level Filter Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-heading">
                        <button
                            onClick={() => {
                                setLowStockOnly(false);
                                setPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                                !lowStockOnly
                                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            All Materials
                        </button>
                        <button
                            onClick={() => {
                                setLowStockOnly(true);
                                setPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                                lowStockOnly
                                    ? "bg-rose-50 text-rose-700 shadow-2xs font-semibold border border-rose-200/60"
                                    : "text-slate-500 hover:text-rose-600"
                            }`}
                        >
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                            <span>Low Stock Only</span>
                        </button>
                    </div>
                </div>
            </Card>

            {/* Materials Table */}
            <Card className="rounded-2xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-body">
                            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-3 font-semibold font-heading">Material & Code</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Unit</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Cost Price</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Stock Level</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Reserved</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Available</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Warehouse Bay</th>
                                    <th className="px-5 py-3 text-right font-semibold font-heading">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    [...Array(6)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={8} className="px-5 py-3.5">
                                                <Skeleton className="h-5 w-full rounded" />
                                            </td>
                                        </tr>
                                    ))
                                ) : materials.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                                            No raw materials found matching filter.
                                        </td>
                                    </tr>
                                ) : (
                                    materials.map((m) => {
                                        const isLow = m.currentStock <= m.minimumStockLevel;
                                        const avail = m.availableQuantity !== undefined ? m.availableQuantity : m.currentStock - (m.reservedQuantity || 0);

                                        return (
                                            <tr
                                                key={m._id}
                                                onClick={() => handleViewMaterial(m)}
                                                className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                                                    isLow ? "bg-rose-50/20" : ""
                                                }`}
                                            >
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                                                            {m.materialCode ? m.materialCode.slice(0, 3) : "RM"}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-semibold text-slate-900 group-hover:text-sky-600 font-heading block truncate">
                                                                {m.name}
                                                            </span>
                                                            <span className="text-[11px] font-mono text-slate-400 block">
                                                                {m.materialCode}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 uppercase font-mono text-slate-500">
                                                    {m.unit}
                                                </td>
                                                <td className="px-5 py-3.5 font-semibold text-slate-800 font-heading">
                                                    {formatCurrency(m.unitPrice)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`font-bold font-heading text-sm ${isLow ? "text-rose-600" : "text-slate-900"}`}>
                                                            {m.currentStock}
                                                        </span>
                                                        {isLow && (
                                                            <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold uppercase">
                                                                Low
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10.5px] text-slate-400 block">
                                                        Min: {m.minimumStockLevel}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 font-medium text-amber-700">
                                                    {m.reservedQuantity || 0}
                                                </td>
                                                <td className="px-5 py-3.5 font-semibold text-emerald-700 font-heading">
                                                    {avail}
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-600">
                                                    {m.warehouse || "Bay A"}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewMaterial(m)}
                                                            className="h-7 px-2 text-[11px] rounded-lg text-slate-600 hover:text-sky-600"
                                                        >
                                                            <Eye className="h-3.5 w-3.5 mr-1" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setAdjustMaterial(m);
                                                                setAdjustType("add");
                                                                setAdjustQty("");
                                                            }}
                                                            className="h-7 px-2 text-[11px] rounded-lg border-slate-200 hover:border-sky-300"
                                                        >
                                                            Adjust Stock
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
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-body">
                            <span>
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
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

            {/* ─── MODAL: CREATE RAW MATERIAL ─────────────────────────────────── */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent onClose={() => setShowCreateModal(false)} className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Raw Material</DialogTitle>
                        <DialogDescription>
                            Create a new warehouse inventory item with minimum thresholds and unit valuation
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateMaterial} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="createMatCode">Material Code *</Label>
                                <Input
                                    id="createMatCode"
                                    required
                                    value={createForm.materialCode}
                                    onChange={(e) =>
                                        setCreateForm({ ...createForm, materialCode: e.target.value.toUpperCase() })
                                    }
                                    placeholder="RM-STL-01"
                                    className="uppercase font-mono text-xs"
                                />
                            </div>
                            <div>
                                <Label htmlFor="createMatUnit">Unit of Measure *</Label>
                                <select
                                    id="createMatUnit"
                                    value={createForm.unit}
                                    onChange={(e) => setCreateForm({ ...createForm, unit: e.target.value })}
                                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-body text-slate-900 focus:border-sky-500 focus:outline-none"
                                >
                                    <option value="pcs">Pieces (pcs)</option>
                                    <option value="meter">Meters (meter)</option>
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="ltr">Liters (ltr)</option>
                                    <option value="box">Boxes (box)</option>
                                    <option value="roll">Rolls (roll)</option>
                                    <option value="set">Sets (set)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="createMatName">Material Description *</Label>
                            <Input
                                id="createMatName"
                                required
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                placeholder="Steel Tube 25mm Round Profile"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="createMatPrice">Unit Cost Price (₹) *</Label>
                                <Input
                                    id="createMatPrice"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={createForm.unitPrice}
                                    onChange={(e) => setCreateForm({ ...createForm, unitPrice: e.target.value })}
                                    placeholder="85.00"
                                />
                            </div>
                            <div>
                                <Label htmlFor="createMatStock">Initial Stock Level</Label>
                                <Input
                                    id="createMatStock"
                                    type="number"
                                    min="0"
                                    value={createForm.currentStock}
                                    onChange={(e) => setCreateForm({ ...createForm, currentStock: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="createMinStock">Min Stock Level (Alert)</Label>
                                <Input
                                    id="createMinStock"
                                    type="number"
                                    min="0"
                                    value={createForm.minStock}
                                    onChange={(e) => setCreateForm({ ...createForm, minStock: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="createReorder">Reorder Threshold</Label>
                                <Input
                                    id="createReorder"
                                    type="number"
                                    min="0"
                                    value={createForm.reorderLevel}
                                    onChange={(e) => setCreateForm({ ...createForm, reorderLevel: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="createWarehouse">Warehouse Location / Bay</Label>
                            <Input
                                id="createWarehouse"
                                value={createForm.warehouse}
                                onChange={(e) => setCreateForm({ ...createForm, warehouse: e.target.value })}
                                placeholder="Warehouse Bay A - Metals"
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
                                {createLoading ? "Saving..." : "Save Raw Material"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── MODAL: VIEW & UPDATE MATERIAL DETAILS ─────────────────────── */}
            {selectedMaterial && (
                <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
                    <DialogContent onClose={() => setSelectedMaterial(null)} className="max-w-lg">
                        <DialogHeader>
                            <div className="flex items-center justify-between pr-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold font-mono">
                                        RM
                                    </div>
                                    <div>
                                        <DialogTitle>{selectedMaterial.name}</DialogTitle>
                                        <DialogDescription>
                                            Code: <span className="font-mono font-semibold">{selectedMaterial.materialCode}</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                                <Badge
                                    variant={selectedMaterial.currentStock <= selectedMaterial.minimumStockLevel ? "danger" : "success"}
                                >
                                    {selectedMaterial.currentStock <= selectedMaterial.minimumStockLevel ? "Low Stock" : "In Stock"}
                                </Badge>
                            </div>
                        </DialogHeader>

                        {!isEditing ? (
                            <div className="space-y-4 text-xs font-body">
                                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[11px] text-slate-400 block font-medium">Unit Price</span>
                                        <span className="text-slate-900 font-bold font-heading text-base">
                                            {formatCurrency(selectedMaterial.unitPrice)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 block font-medium">Total Stock Valuation</span>
                                        <span className="text-emerald-700 font-bold font-heading text-base">
                                            {formatCurrency(selectedMaterial.currentStock * selectedMaterial.unitPrice)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 block font-medium">Current Stock</span>
                                        <span className="text-slate-800 font-bold font-heading text-sm">
                                            {selectedMaterial.currentStock} {selectedMaterial.unit}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 block font-medium">Available (Unreserved)</span>
                                        <span className="text-emerald-600 font-bold font-heading text-sm">
                                            {selectedMaterial.availableQuantity !== undefined
                                                ? selectedMaterial.availableQuantity
                                                : selectedMaterial.currentStock - (selectedMaterial.reservedQuantity || 0)}{" "}
                                            {selectedMaterial.unit}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2.5">
                                    <div className="p-3 rounded-xl border border-slate-100 bg-white text-center">
                                        <span className="text-[10.5px] text-slate-400 block uppercase font-heading">
                                            Reserved
                                        </span>
                                        <span className="text-sm font-bold text-amber-700 font-heading mt-0.5 block">
                                            {selectedMaterial.reservedQuantity || 0}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl border border-slate-100 bg-white text-center">
                                        <span className="text-[10.5px] text-slate-400 block uppercase font-heading">
                                            Min Level
                                        </span>
                                        <span className="text-sm font-bold text-slate-700 font-heading mt-0.5 block">
                                            {selectedMaterial.minimumStockLevel}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl border border-slate-100 bg-white text-center">
                                        <span className="text-[10.5px] text-slate-400 block uppercase font-heading">
                                            Reorder At
                                        </span>
                                        <span className="text-sm font-bold text-slate-700 font-heading mt-0.5 block">
                                            {selectedMaterial.reorderLevel}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl border border-slate-100 bg-white flex items-center justify-between text-xs text-slate-600">
                                    <span>Warehouse Bay:</span>
                                    <span className="font-semibold text-slate-800">{selectedMaterial.warehouse || "Bay A"}</span>
                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setAdjustMaterial(selectedMaterial);
                                            setAdjustType("add");
                                            setAdjustQty("");
                                        }}
                                        className="rounded-xl mr-auto"
                                    >
                                        Adjust Stock
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSelectedMaterial(null)}
                                        className="rounded-xl"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                        className="rounded-xl font-heading gap-1.5"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" />
                                        <span>Edit Material</span>
                                    </Button>
                                </DialogFooter>
                            </div>
                        ) : (
                            /* Edit Mode */
                            <form onSubmit={handleUpdateMaterial} className="space-y-3.5">
                                <div>
                                    <Label htmlFor="editMatName">Material Name *</Label>
                                    <Input
                                        id="editMatName"
                                        required
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="editMatPrice">Unit Price (₹) *</Label>
                                        <Input
                                            id="editMatPrice"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={editForm.unitPrice}
                                            onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="editMatWarehouse">Warehouse Bay</Label>
                                        <Input
                                            id="editMatWarehouse"
                                            value={editForm.warehouse}
                                            onChange={(e) => setEditForm({ ...editForm, warehouse: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="editMinStock">Minimum Stock Level</Label>
                                        <Input
                                            id="editMinStock"
                                            type="number"
                                            min="0"
                                            value={editForm.minimumStockLevel}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, minimumStockLevel: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="editReorder">Reorder Threshold</Label>
                                        <Input
                                            id="editReorder"
                                            type="number"
                                            min="0"
                                            value={editForm.reorderLevel}
                                            onChange={(e) => setEditForm({ ...editForm, reorderLevel: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setIsEditing(false)}
                                        className="rounded-xl"
                                    >
                                        Cancel Edit
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={editLoading}
                                        size="sm"
                                        className="rounded-xl font-heading"
                                    >
                                        {editLoading ? "Saving..." : "Save Changes"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            )}

            {/* ─── MODAL: ADJUST WAREHOUSE STOCK ─────────────────────────────── */}
            {adjustMaterial && (
                <Dialog open={!!adjustMaterial} onOpenChange={() => setAdjustMaterial(null)}>
                    <DialogContent onClose={() => setAdjustMaterial(null)} className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Adjust Warehouse Stock</DialogTitle>
                            <DialogDescription>
                                {adjustMaterial.name} (<span className="font-mono">{adjustMaterial.materialCode}</span>)
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleAdjustStock} className="space-y-4">
                            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs font-body">
                                <span className="text-slate-500">Current Warehouse Stock:</span>
                                <span className="font-bold text-slate-900 font-heading text-sm">
                                    {adjustMaterial.currentStock} {adjustMaterial.unit}
                                </span>
                            </div>

                            {/* Adjustment Type Segmented Control */}
                            <div>
                                <Label>Adjustment Direction *</Label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-heading">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustType("add")}
                                        className={`py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                            adjustType === "add"
                                                ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                                                : "text-slate-500 hover:text-slate-800"
                                        }`}
                                    >
                                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                                        <span>Add Stock (+)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustType("reduce")}
                                        className={`py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                            adjustType === "reduce"
                                                ? "bg-white text-rose-700 shadow-2xs font-semibold"
                                                : "text-slate-500 hover:text-slate-800"
                                        }`}
                                    >
                                        <TrendingDown className="h-4 w-4 text-rose-600" />
                                        <span>Reduce Stock (-)</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="adjustQuantity">Quantity ({adjustMaterial.unit}) *</Label>
                                <Input
                                    id="adjustQuantity"
                                    type="number"
                                    min="1"
                                    required
                                    value={adjustQty}
                                    onChange={(e) => setAdjustQty(e.target.value)}
                                    placeholder="e.g. 50"
                                    className="font-mono text-sm"
                                />
                            </div>

                            <div>
                                <Label htmlFor="adjustReason">Adjustment Reason Category</Label>
                                <select
                                    id="adjustReason"
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-body text-slate-900 focus:border-sky-500 focus:outline-none"
                                >
                                    <option value="purchase">Supplier Purchase Received</option>
                                    <option value="material_issue">Material Issued to Shopfloor</option>
                                    <option value="adjustment">Cycle Count Audit Adjustment</option>
                                    <option value="return">Customer Return / Excess Returned</option>
                                    <option value="scrap">Damaged / Scrap Write-off</option>
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="adjustNotes">Audit Reference / Note</Label>
                                <Input
                                    id="adjustNotes"
                                    value={adjustNotes}
                                    onChange={(e) => setAdjustNotes(e.target.value)}
                                    placeholder="PO #1084 / Inspection report ref..."
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setAdjustMaterial(null)}
                                    className="rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={adjustLoading}
                                    size="sm"
                                    className="rounded-xl font-heading"
                                >
                                    {adjustLoading ? "Applying..." : "Apply Adjustment"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
