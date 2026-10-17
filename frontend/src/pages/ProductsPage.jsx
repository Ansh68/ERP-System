import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import {
    Package,
    Search,
    Plus,
    Filter,
    Boxes,
    Sparkles,
    CheckCircle2,
    AlertTriangle,
    Eye,
    Edit3,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    X,
    RotateCw,
    Layers,
    DollarSign,
    Calculator,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/Dialog";
import { Skeleton } from "../components/ui/Skeleton";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    // Modal state: Create Product & BOM
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [productCode, setProductCode] = useState("");
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Office Chairs");
    const [unitPrice, setUnitPrice] = useState("");
    const [description, setDescription] = useState("");
    const [bomItems, setBomItems] = useState([{ rawMaterial: "", quantity: 1 }]);

    // Modal state: View / Edit Product Details
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editBomItems, setEditBomItems] = useState([]);
    const [editLoading, setEditLoading] = useState(false);

    // Modal state: MRP Simulator
    const [mrpProduct, setMrpProduct] = useState(null);
    const [mrpQuantity, setMrpQuantity] = useState(50);
    const [mrpResult, setMrpResult] = useState(null);
    const [mrpLoading, setMrpLoading] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (search.trim()) params.search = search.trim();
            if (categoryFilter) params.category = categoryFilter;

            const res = await apiClient.get("/products", { params });
            if (res.data?.success) {
                setProducts(res.data.data.products);
                setPagination(res.data.data.pagination);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const fetchMetadata = async () => {
        try {
            const [catRes, rmRes] = await Promise.all([
                apiClient.get("/products/categories"),
                apiClient.get("/raw-materials?limit=100"),
            ]);
            if (catRes.data?.success) setCategories(catRes.data.data);
            if (rmRes.data?.success) setRawMaterials(rmRes.data.data.materials);
        } catch (err) {
            console.error("Failed to load metadata", err);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [page, categoryFilter]);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const handleAddBomRow = (isEdit = false) => {
        if (isEdit) {
            setEditBomItems([...editBomItems, { rawMaterial: "", quantity: 1 }]);
        } else {
            setBomItems([...bomItems, { rawMaterial: "", quantity: 1 }]);
        }
    };

    const handleRemoveBomRow = (index, isEdit = false) => {
        if (isEdit) {
            setEditBomItems(editBomItems.filter((_, i) => i !== index));
        } else {
            setBomItems(bomItems.filter((_, i) => i !== index));
        }
    };

    const handleBomChange = (index, field, value, isEdit = false) => {
        if (isEdit) {
            const updated = [...editBomItems];
            updated[index][field] = value;
            setEditBomItems(updated);
        } else {
            const updated = [...bomItems];
            updated[index][field] = value;
            setBomItems(updated);
        }
    };

    // Open detail modal for clicked product
    const handleViewProduct = (prod) => {
        setSelectedProduct(prod);
        setIsEditing(false);
        setEditForm({
            name: prod.name || "",
            category: prod.category || "Office Chairs",
            unitSellingPrice: prod.unitSellingPrice || 0,
            description: prod.description || "",
        });
        setEditBomItems(
            prod.bom?.map((b) => ({
                rawMaterial: b.rawMaterial?._id || b.rawMaterial || "",
                quantity: b.quantity || 1,
            })) || []
        );
    };

    // Create Product & BOM
    const handleCreateProduct = async (e) => {
        e.preventDefault();

        if (!productCode.trim() || productCode.trim().length < 2) {
            toast.error("Product Code must be at least 2 characters long");
            return;
        }

        if (!name.trim() || name.trim().length < 2) {
            toast.error("Product Name must be at least 2 characters long");
            return;
        }

        if (isNaN(unitPrice) || Number(unitPrice) < 0) {
            toast.error("Unit selling price cannot be negative");
            return;
        }

        const validBom = bomItems.filter((b) => b.rawMaterial && Number(b.quantity) > 0);
        if (bomItems.length > 0 && validBom.length !== bomItems.length) {
            toast.error("Each BOM item must specify a raw material and quantity > 0");
            return;
        }

        setCreateLoading(true);
        const actionToast = toast.loading("Saving product & BOM recipe...");

        try {
            const payload = {
                productCode: productCode.trim().toUpperCase(),
                name: name.trim(),
                category: category.trim(),
                unitSellingPrice: Number(unitPrice),
                description: description ? description.trim() : undefined,
                bom: validBom.map((b) => ({
                    rawMaterial: b.rawMaterial,
                    quantity: Number(b.quantity),
                })),
            };

            await apiClient.post("/products", payload);
            toast.success("Product & BOM created successfully!", { id: actionToast });
            setShowCreateModal(false);
            setProductCode("");
            setName("");
            setUnitPrice("");
            setDescription("");
            setBomItems([{ rawMaterial: "", quantity: 1 }]);
            fetchProducts();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create product", { id: actionToast });
        } finally {
            setCreateLoading(false);
        }
    };

    // Update Product Details & BOM
    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;

        if (!editForm.name.trim() || editForm.name.trim().length < 2) {
            toast.error("Product Name must be at least 2 characters long");
            return;
        }

        if (isNaN(editForm.unitSellingPrice) || Number(editForm.unitSellingPrice) < 0) {
            toast.error("Unit selling price cannot be negative");
            return;
        }

        const validBom = editBomItems.filter((b) => b.rawMaterial && Number(b.quantity) > 0);

        setEditLoading(true);
        const actionToast = toast.loading("Updating product & BOM...");

        try {
            const payload = {
                name: editForm.name.trim(),
                category: editForm.category.trim(),
                unitSellingPrice: Number(editForm.unitSellingPrice),
                description: editForm.description ? editForm.description.trim() : undefined,
                bom: validBom.map((b) => ({
                    rawMaterial: b.rawMaterial,
                    quantity: Number(b.quantity),
                })),
            };

            const res = await apiClient.patch(`/products/${selectedProduct._id}`, payload);
            toast.success("Product & BOM updated successfully!", { id: actionToast });
            setIsEditing(false);
            if (res.data?.data) {
                setSelectedProduct(res.data.data);
            }
            fetchProducts();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update product", { id: actionToast });
        } finally {
            setEditLoading(false);
        }
    };

    // Run MRP Simulation
    const handleRunMRP = async (product, qty) => {
        setMrpProduct(product);
        setMrpLoading(true);
        setMrpResult(null);
        try {
            const res = await apiClient.get(`/products/${product._id}/mrp?quantity=${qty}`);
            if (res.data?.success) {
                setMrpResult(res.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to calculate MRP simulation");
        } finally {
            setMrpLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading tracking-tight">
                            Products & Bill of Materials (BOM)
                        </h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 font-medium">
                            {pagination.total || products.length} Finished SKUs
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-body mt-0.5">
                        Finished goods catalog, multi-tier BOM ingredient recipes, and live MRP requirement simulation
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-xl gap-2 font-heading"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Product & BOM</span>
                    </Button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <Card className="rounded-2xl">
                <div className="p-3.5 sm:p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Search Input */}
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
                            <div className="relative flex-1">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Search by product code or name..."
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

                    {/* Category Filter Tabs Strip (Vantus style) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-heading">
                        <button
                            onClick={() => {
                                setCategoryFilter("");
                                setPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer font-medium ${
                                categoryFilter === ""
                                    ? "bg-sky-500 text-white font-semibold shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                            }`}
                        >
                            All Categories
                        </button>
                        {categories.map((c) => (
                            <button
                                key={c}
                                onClick={() => {
                                    setCategoryFilter(c);
                                    setPage(1);
                                }}
                                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer font-medium ${
                                    categoryFilter === c
                                        ? "bg-sky-500 text-white font-semibold shadow-xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                                }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Products Table */}
            <Card className="rounded-2xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-body">
                            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-3 font-semibold font-heading">Product SKU & Code</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Category</th>
                                    <th className="px-5 py-3 font-semibold font-heading">Unit Selling Price</th>
                                    <th className="px-5 py-3 font-semibold font-heading">BOM Ingredients</th>
                                    <th className="px-5 py-3 text-right font-semibold font-heading">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={5} className="px-5 py-3.5">
                                                <Skeleton className="h-5 w-full rounded" />
                                            </td>
                                        </tr>
                                    ))
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                                            No products found matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((p) => (
                                        <tr
                                            key={p._id}
                                            onClick={() => handleViewProduct(p)}
                                            className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8.5 w-8.5 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                                                        {p.productCode ? p.productCode.slice(0, 3) : "PRD"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-semibold text-slate-900 group-hover:text-sky-600 font-heading block truncate">
                                                            {p.name}
                                                        </span>
                                                        <span className="text-[11px] font-mono text-slate-400 block">
                                                            {p.productCode}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Badge variant="slate" className="text-[10px]">
                                                    {p.category}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-slate-900 font-heading text-sm">
                                                {formatCurrency(p.unitSellingPrice)}
                                            </td>
                                            <td className="px-5 py-3.5 max-w-sm">
                                                <div className="flex flex-wrap gap-1">
                                                    {p.bom?.slice(0, 3).map((b, i) => (
                                                        <span
                                                            key={i}
                                                            className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10.5px] border border-slate-200/60 font-body"
                                                        >
                                                            {b.rawMaterial?.name || "Material"}: <strong className="font-semibold">{b.quantity} {b.unit || b.rawMaterial?.unit}</strong>
                                                        </span>
                                                    ))}
                                                    {p.bom?.length > 3 && (
                                                        <span className="text-[10px] text-slate-400 self-center">
                                                            +{p.bom.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewProduct(p)}
                                                        className="h-7 px-2 text-[11px] rounded-lg text-slate-600 hover:text-sky-600"
                                                    >
                                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                                        Recipe
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRunMRP(p, mrpQuantity)}
                                                        className="h-7 px-2.5 text-[11px] rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 font-heading"
                                                    >
                                                        <Calculator className="h-3.5 w-3.5 mr-1 text-sky-600" />
                                                        MRP Sim
                                                    </Button>
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
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-body">
                            <span>
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} products)
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

            {/* ─── MODAL: CREATE PRODUCT & BOM ─────────────────────────────────── */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent onClose={() => setShowCreateModal(false)} className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>New Product & BOM Recipe</DialogTitle>
                        <DialogDescription>
                            Define a finished product and its bill of materials recipe per manufactured unit
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateProduct} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="createProdCode">Product SKU Code *</Label>
                                <Input
                                    id="createProdCode"
                                    required
                                    value={productCode}
                                    onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                                    placeholder="PRD-CHAIR-101"
                                    className="uppercase font-mono text-xs"
                                />
                            </div>
                            <div>
                                <Label htmlFor="createCategory">Category *</Label>
                                <Input
                                    id="createCategory"
                                    required
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="Office Chairs"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="createProdName">Product Name *</Label>
                            <Input
                                id="createProdName"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ergonomic Executive Mesh Chair"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="createUnitPrice">Unit Selling Price (₹) *</Label>
                                <Input
                                    id="createUnitPrice"
                                    type="number"
                                    min="0"
                                    required
                                    value={unitPrice}
                                    onChange={(e) => setUnitPrice(e.target.value)}
                                    placeholder="4500"
                                    className="font-heading font-semibold"
                                />
                            </div>
                            <div>
                                <Label htmlFor="createDesc">Description</Label>
                                <Input
                                    id="createDesc"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Commercial grade task chair..."
                                />
                            </div>
                        </div>

                        {/* BOM Recipe Builder */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="mb-0">Bill of Materials (BOM) — Components per 1 unit</Label>
                                <button
                                    type="button"
                                    onClick={() => handleAddBomRow(false)}
                                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 font-heading cursor-pointer"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Add Raw Material</span>
                                </button>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {bomItems.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <select
                                            required
                                            value={item.rawMaterial}
                                            onChange={(e) => handleBomChange(index, "rawMaterial", e.target.value, false)}
                                            className="flex-1 h-9 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-body text-slate-900 focus:border-sky-500 focus:outline-none"
                                        >
                                            <option value="">Select Raw Material Component...</option>
                                            {rawMaterials.map((rm) => (
                                                <option key={rm._id} value={rm._id}>
                                                    {rm.name} ({rm.materialCode}) — [{rm.unit}]
                                                </option>
                                            ))}
                                        </select>
                                        <Input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            required
                                            value={item.quantity}
                                            onChange={(e) => handleBomChange(index, "quantity", e.target.value, false)}
                                            className="w-24 h-9 text-xs"
                                            placeholder="Qty / unit"
                                        />
                                        {bomItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBomRow(index, false)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                                title="Remove Component"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
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
                                {createLoading ? "Saving..." : "Save Product & BOM"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── MODAL: VIEW & UPDATE PRODUCT DOSSIER ───────────────────────── */}
            {selectedProduct && (
                <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
                    <DialogContent onClose={() => setSelectedProduct(null)} className="max-w-2xl">
                        <DialogHeader>
                            <div className="flex items-center justify-between pr-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold font-mono">
                                        PRD
                                    </div>
                                    <div>
                                        <DialogTitle>{selectedProduct.name}</DialogTitle>
                                        <DialogDescription>
                                            SKU: <span className="font-mono font-semibold">{selectedProduct.productCode}</span> • Category: {selectedProduct.category}
                                        </DialogDescription>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10.5px] text-slate-400 block font-medium">Selling Price</span>
                                    <span className="text-lg font-bold text-slate-900 font-heading">
                                        {formatCurrency(selectedProduct.unitSellingPrice)}
                                    </span>
                                </div>
                            </div>
                        </DialogHeader>

                        {!isEditing ? (
                            <div className="space-y-4 text-xs font-body">
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-heading mb-2">
                                        Bill of Materials (BOM) Component Recipe
                                    </h4>
                                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                                        <table className="w-full text-xs text-left font-body">
                                            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                                <tr>
                                                    <th className="p-2.5 font-semibold font-heading">Ingredient Raw Material</th>
                                                    <th className="p-2.5 font-semibold font-heading">Code</th>
                                                    <th className="p-2.5 font-semibold font-heading">Qty per Unit</th>
                                                    <th className="p-2.5 font-semibold font-heading">Available Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedProduct.bom?.map((b, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="p-2.5 font-medium text-slate-800">
                                                            {b.rawMaterial?.name || "Raw Material"}
                                                        </td>
                                                        <td className="p-2.5 font-mono text-slate-500">
                                                            {b.rawMaterial?.materialCode || "—"}
                                                        </td>
                                                        <td className="p-2.5 font-semibold text-slate-900">
                                                            {b.quantity} {b.unit || b.rawMaterial?.unit}
                                                        </td>
                                                        <td className="p-2.5 text-slate-700">
                                                            {b.rawMaterial?.currentStock !== undefined ? `${b.rawMaterial.currentStock} ${b.rawMaterial.unit || ""}` : "In Stock"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRunMRP(selectedProduct, mrpQuantity)}
                                        className="rounded-xl mr-auto font-heading gap-1.5"
                                    >
                                        <Calculator className="h-3.5 w-3.5 text-sky-600" />
                                        <span>Test in MRP Simulator</span>
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSelectedProduct(null)}
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
                                        <span>Edit Product</span>
                                    </Button>
                                </DialogFooter>
                            </div>
                        ) : (
                            /* Edit Mode */
                            <form onSubmit={handleUpdateProduct} className="space-y-3.5">
                                <div>
                                    <Label htmlFor="editProdName">Product Name *</Label>
                                    <Input
                                        id="editProdName"
                                        required
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="editProdCat">Category *</Label>
                                        <Input
                                            id="editProdCat"
                                            required
                                            value={editForm.category}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="editProdPrice">Selling Price (₹) *</Label>
                                        <Input
                                            id="editProdPrice"
                                            type="number"
                                            min="0"
                                            required
                                            value={editForm.unitSellingPrice}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, unitSellingPrice: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Edit BOM items */}
                                <div className="pt-2 border-t border-slate-100 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="mb-0">BOM Recipe Items</Label>
                                        <button
                                            type="button"
                                            onClick={() => handleAddBomRow(true)}
                                            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 font-heading cursor-pointer"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            <span>Add Ingredient</span>
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {editBomItems.map((item, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <select
                                                    required
                                                    value={item.rawMaterial}
                                                    onChange={(e) => handleBomChange(index, "rawMaterial", e.target.value, true)}
                                                    className="flex-1 h-9 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-body text-slate-900 focus:border-sky-500 focus:outline-none"
                                                >
                                                    <option value="">Select Material...</option>
                                                    {rawMaterials.map((rm) => (
                                                        <option key={rm._id} value={rm._id}>
                                                            {rm.name} ({rm.materialCode})
                                                        </option>
                                                    ))}
                                                </select>
                                                <Input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    required
                                                    value={item.quantity}
                                                    onChange={(e) => handleBomChange(index, "quantity", e.target.value, true)}
                                                    className="w-24 h-9 text-xs"
                                                />
                                                {editBomItems.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveBomRow(index, true)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
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
                                        {editLoading ? "Saving..." : "Save Recipe Changes"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            )}

            {/* ─── MODAL: MRP SIMULATOR PREVIEW ─────────────────────────────────── */}
            {mrpProduct && (
                <Dialog open={!!mrpProduct} onOpenChange={() => setMrpProduct(null)}>
                    <DialogContent onClose={() => setMrpProduct(null)} className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-sky-500" />
                                <span>Material Requirement Planning (MRP) Engine</span>
                            </DialogTitle>
                            <DialogDescription>
                                Simulate manufacturing order batch size for <strong className="text-slate-800">{mrpProduct.name}</strong> ({mrpProduct.productCode})
                            </DialogDescription>
                        </DialogHeader>

                        {/* Order Quantity Input Bar */}
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-body">
                            <span className="font-medium text-slate-600 font-heading">Simulate Target Batch Quantity:</span>
                            <Input
                                type="number"
                                min="1"
                                value={mrpQuantity}
                                onChange={(e) => setMrpQuantity(e.target.value)}
                                className="w-28 h-8 text-xs font-bold text-center"
                            />
                            <Button
                                size="sm"
                                onClick={() => handleRunMRP(mrpProduct, mrpQuantity)}
                                className="h-8 rounded-xl font-heading text-xs"
                            >
                                Calculate MRP
                            </Button>
                        </div>

                        {/* MRP Results */}
                        {mrpLoading ? (
                            <div className="py-8 text-center text-xs text-slate-400">
                                Running BOM explosion calculation...
                            </div>
                        ) : mrpResult ? (
                            <div className="space-y-3 pt-1">
                                <div
                                    className={`p-3 rounded-xl text-xs font-body flex items-center gap-2.5 ${
                                        mrpResult.canFulfillFromProduction
                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                                            : "bg-rose-50 text-rose-800 border border-rose-200/80"
                                    }`}
                                >
                                    {mrpResult.canFulfillFromProduction ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                            <span>
                                                <strong>Feasible Run:</strong> All required raw materials are currently in stock to manufacture <strong>{mrpResult.orderQuantity} units</strong>!
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                                            <span>
                                                <strong>Procurement Alert:</strong> Material shortages detected. Reorder required prior to shopfloor release!
                                            </span>
                                        </>
                                    )}
                                </div>

                                <div className="border border-slate-100 rounded-xl overflow-hidden">
                                    <table className="w-full text-xs text-left font-body">
                                        <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100">
                                            <tr>
                                                <th className="p-2.5 font-semibold font-heading">Material Component</th>
                                                <th className="p-2.5 font-semibold font-heading">Per Unit</th>
                                                <th className="p-2.5 font-semibold font-heading">Batch Requirement</th>
                                                <th className="p-2.5 font-semibold font-heading">Available Stock</th>
                                                <th className="p-2.5 font-semibold font-heading">Shortage</th>
                                                <th className="p-2.5 font-semibold font-heading">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {mrpResult.mrp?.map((item, idx) => (
                                                <tr key={idx} className={item.hasShortage ? "bg-rose-50/30" : ""}>
                                                    <td className="p-2.5 font-medium text-slate-800">
                                                        {item.rawMaterial.name} (<span className="font-mono text-[11px] text-slate-500">{item.rawMaterial.materialCode}</span>)
                                                    </td>
                                                    <td className="p-2.5 text-slate-600">
                                                        {item.quantityPerUnit} {item.rawMaterial.unit}
                                                    </td>
                                                    <td className="p-2.5 font-bold text-slate-900 font-heading">
                                                        {item.requiredQuantity} {item.rawMaterial.unit}
                                                    </td>
                                                    <td className="p-2.5 text-slate-700">
                                                        {item.availableQuantity} {item.rawMaterial.unit}
                                                    </td>
                                                    <td className="p-2.5 font-bold font-heading text-rose-600">
                                                        {item.shortage > 0 ? `${item.shortage} ${item.rawMaterial.unit}` : "—"}
                                                    </td>
                                                    <td className="p-2.5">
                                                        <Badge
                                                            variant={item.hasShortage ? "danger" : "success"}
                                                            className="text-[10px]"
                                                        >
                                                            {item.hasShortage ? "Shortage" : "Available"}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}

                        <DialogFooter>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setMrpProduct(null)}
                                className="rounded-xl"
                            >
                                Close Simulator
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
