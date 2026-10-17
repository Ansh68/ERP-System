import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    // Create Product Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [productCode, setProductCode] = useState("");
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Office Chairs");
    const [unitPrice, setUnitPrice] = useState("");
    const [description, setDescription] = useState("");
    const [bomItems, setBomItems] = useState([{ rawMaterial: "", quantity: 1 }]);

    // MRP Simulator State
    const [selectedProductForMrp, setSelectedProductForMrp] = useState(null);
    const [mrpQuantity, setMrpQuantity] = useState(10);
    const [mrpResult, setMrpResult] = useState(null);
    const [mrpLoading, setMrpLoading] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (search) params.search = search;
            if (categoryFilter) params.category = categoryFilter;

            const res = await apiClient.get("/products", { params });
            if (res.data?.success) {
                setProducts(res.data.data.products);
                setPagination(res.data.data.pagination);
            }
        } catch (err) {
            console.error("Failed to load products", err);
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

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    };

    const handleAddBomRow = () => {
        setBomItems([...bomItems, { rawMaterial: "", quantity: 1 }]);
    };

    const handleRemoveBomRow = (index) => {
        setBomItems(bomItems.filter((_, i) => i !== index));
    };

    const handleBomChange = (index, field, value) => {
        const updated = [...bomItems];
        updated[index][field] = value;
        setBomItems(updated);
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();

        if (!productCode.trim() || productCode.trim().length < 2) {
            alert("Product Code must be at least 2 characters long");
            return;
        }

        if (!name.trim() || name.trim().length < 2) {
            alert("Product Name must be at least 2 characters long");
            return;
        }

        if (isNaN(unitPrice) || Number(unitPrice) < 0) {
            alert("Unit selling price cannot be negative");
            return;
        }

        const validBom = bomItems.filter((b) => b.rawMaterial && Number(b.quantity) > 0);
        if (bomItems.length > 0 && validBom.length !== bomItems.length) {
            alert("Each BOM line item must have a raw material selected and quantity greater than 0");
            return;
        }

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
            alert("Product & BOM created successfully!");
            setShowCreateModal(false);
            // Reset
            setProductCode("");
            setName("");
            setUnitPrice("");
            setDescription("");
            setBomItems([{ rawMaterial: "", quantity: 1 }]);
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create product");
        }
    };

    // ─── ACTION: RUN MRP PREVIEW SIMULATION ────────────────────────────────────
    const handleCalculateMRP = async (product, qty) => {
        setSelectedProductForMrp(product);
        setMrpLoading(true);
        setMrpResult(null);
        try {
            const res = await apiClient.get(`/products/${product._id}/mrp?quantity=${qty}`);
            if (res.data?.success) {
                setMrpResult(res.data.data);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to calculate MRP");
        } finally {
            setMrpLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Products & Bill of Materials (BOM)</h1>
                    <p className="text-xs text-gray-500">Finished goods catalog, component recipes, and MRP simulation</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                >
                    + Add Product & BOM
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3 rounded border border-gray-200 flex flex-wrap items-center gap-3 text-xs">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search product code or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none w-64"
                    />
                    <button type="submit" className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded font-medium">
                        Search
                    </button>
                </form>

                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Category:</span>
                    <select
                        value={categoryFilter}
                        onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-2 py-1.5 border border-gray-300 rounded bg-white"
                    >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded border border-gray-200 overflow-x-auto text-xs">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                        <tr>
                            <th className="p-3">Product Code</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Selling Price</th>
                            <th className="p-3">BOM Recipe (Raw Materials Needed per Unit)</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="p-4 text-center text-gray-500">
                                    Loading products...
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-4 text-center text-gray-500">
                                    No products found.
                                </td>
                            </tr>
                        ) : (
                            products.map((p) => (
                                <tr key={p._id} className="hover:bg-gray-50/50">
                                    <td className="p-3 font-mono font-medium text-gray-900">{p.productCode}</td>
                                    <td className="p-3 font-medium">{p.name}</td>
                                    <td className="p-3 text-gray-600">{p.category}</td>
                                    <td className="p-3 font-semibold text-emerald-700">₹{p.unitSellingPrice}</td>
                                    <td className="p-3 max-w-md">
                                        <div className="flex flex-wrap gap-1">
                                            {p.bom?.map((b, i) => (
                                                <span
                                                    key={i}
                                                    className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-700 border border-gray-200"
                                                >
                                                    {b.rawMaterial?.name || "Material"}: <strong>{b.quantity} {b.unit}</strong>
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => handleCalculateMRP(p, mrpQuantity)}
                                            className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded text-xs font-medium"
                                        >
                                            MRP Simulator
                                        </button>
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
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} products)
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

            {/* ─── MODAL: CREATE PRODUCT & BOM ─────────────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg border max-w-xl w-full p-5 text-sm space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h2 className="font-bold text-base text-gray-900">New Product & BOM</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Product Code *</label>
                                    <input
                                        required
                                        value={productCode}
                                        onChange={(e) => setProductCode(e.target.value)}
                                        placeholder="PRD-CHAIR-101"
                                        className="w-full border p-2 rounded uppercase font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Category *</label>
                                    <input
                                        required
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="Office Chairs"
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Product Name *</label>
                                <input
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ergonomic Executive Chair"
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Unit Selling Price (₹) *</label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={unitPrice}
                                    onChange={(e) => setUnitPrice(e.target.value)}
                                    placeholder="4500"
                                    className="w-full border p-2 rounded font-semibold"
                                />
                            </div>

                            {/* BOM Recipe Builder */}
                            <div className="pt-2 border-t space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="font-semibold text-gray-800">
                                        Bill of Materials (BOM) — Components per 1 finished unit
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddBomRow}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        + Add Raw Material
                                    </button>
                                </div>
                                {bomItems.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <select
                                            required
                                            value={item.rawMaterial}
                                            onChange={(e) => handleBomChange(index, "rawMaterial", e.target.value)}
                                            className="flex-1 border p-1.5 rounded text-xs bg-white"
                                        >
                                            <option value="">Select Raw Material Component...</option>
                                            {rawMaterials.map((rm) => (
                                                <option key={rm._id} value={rm._id}>
                                                    {rm.name} ({rm.materialCode}) — [{rm.unit}]
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            required
                                            value={item.quantity}
                                            onChange={(e) => handleBomChange(index, "quantity", e.target.value)}
                                            className="w-24 border p-1.5 rounded text-xs"
                                            placeholder="Qty / unit"
                                        />
                                        {bomItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBomRow(index)}
                                                className="text-red-500 hover:text-red-700 text-xs px-1"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                ))}
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
                                    Save Product & BOM
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── MODAL: MRP SIMULATOR PREVIEW ─────────────────────────────────── */}
            {selectedProductForMrp && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg border max-w-2xl w-full p-5 text-sm space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start border-b pb-2">
                            <div>
                                <h2 className="font-bold text-base text-gray-900">
                                    MRP Calculation Engine: {selectedProductForMrp.name}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Simulate material requirement planning for order batches
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedProductForMrp(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Order Quantity Input */}
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded text-xs">
                            <span className="font-medium text-gray-700">Simulate Order Quantity:</span>
                            <input
                                type="number"
                                min="1"
                                value={mrpQuantity}
                                onChange={(e) => setMrpQuantity(e.target.value)}
                                className="w-24 border p-1 rounded font-semibold text-center"
                            />
                            <button
                                onClick={() => handleCalculateMRP(selectedProductForMrp, mrpQuantity)}
                                className="px-3 py-1 bg-purple-600 text-white rounded font-medium hover:bg-purple-700"
                            >
                                Calculate Requirements
                            </button>
                        </div>

                        {/* MRP Results Table */}
                        {mrpLoading ? (
                            <div className="p-4 text-center text-gray-500 text-xs">Calculating BOM requirements...</div>
                        ) : mrpResult ? (
                            <div className="space-y-3">
                                <div
                                    className={`p-2.5 rounded text-xs font-semibold ${
                                        mrpResult.canFulfillFromProduction
                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                            : "bg-red-50 text-red-800 border border-red-200"
                                    }`}
                                >
                                    {mrpResult.canFulfillFromProduction
                                        ? `✅ Sufficient Stock: All raw materials available to manufacture ${mrpResult.orderQuantity} units!`
                                        : `⚠️ Raw Material Shortages Detected: Procurement needed before production!`}
                                </div>

                                <table className="w-full text-xs text-left border">
                                    <thead className="bg-gray-50 text-gray-600 border-b">
                                        <tr>
                                            <th className="p-2">Material</th>
                                            <th className="p-2">Per Unit</th>
                                            <th className="p-2">Required Total</th>
                                            <th className="p-2">Available Stock</th>
                                            <th className="p-2">Shortage</th>
                                            <th className="p-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {mrpResult.mrp?.map((item, idx) => (
                                            <tr key={idx} className={item.hasShortage ? "bg-red-50/40" : ""}>
                                                <td className="p-2 font-medium">
                                                    {item.rawMaterial.name} ({item.rawMaterial.materialCode})
                                                </td>
                                                <td className="p-2">
                                                    {item.quantityPerUnit} {item.rawMaterial.unit}
                                                </td>
                                                <td className="p-2 font-semibold">
                                                    {item.requiredQuantity} {item.rawMaterial.unit}
                                                </td>
                                                <td className="p-2">
                                                    {item.availableQuantity} {item.rawMaterial.unit}
                                                </td>
                                                <td className="p-2 font-bold text-red-600">
                                                    {item.shortage > 0 ? `${item.shortage} ${item.rawMaterial.unit}` : "-"}
                                                </td>
                                                <td className="p-2">
                                                    <span
                                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                                            item.hasShortage
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-emerald-100 text-emerald-700"
                                                        }`}
                                                    >
                                                        {item.hasShortage ? "SHORTAGE" : "OK"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}

                        <div className="flex justify-end pt-2 border-t">
                            <button
                                onClick={() => setSelectedProductForMrp(null)}
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
