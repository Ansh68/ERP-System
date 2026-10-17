import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export default function RawMaterialsPage() {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    // Create Material Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [materialCode, setMaterialCode] = useState("");
    const [name, setName] = useState("");
    const [unit, setUnit] = useState("pcs");
    const [unitPrice, setUnitPrice] = useState("");
    const [currentStock, setCurrentStock] = useState(0);
    const [minStock, setMinStock] = useState(0);
    const [reorderLevel, setReorderLevel] = useState(0);
    const [warehouse, setWarehouse] = useState("Main Warehouse");

    // Adjust Stock Modal
    const [adjustMaterial, setAdjustMaterial] = useState(null);
    const [adjustmentQty, setAdjustmentQty] = useState("");
    const [adjustReason, setAdjustReason] = useState("");

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 12 };
            if (search) params.search = search;
            if (lowStockOnly) params.lowStock = "true";

            const res = await apiClient.get("/raw-materials", { params });
            if (res.data?.success) {
                setMaterials(res.data.data.materials);
                setPagination(res.data.data.pagination);
            }
        } catch (err) {
            console.error("Failed to load materials", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, [page, lowStockOnly]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchMaterials();
    };

    const handleCreateMaterial = async (e) => {
        e.preventDefault();

        if (!materialCode.trim() || materialCode.trim().length < 2) {
            alert("Material Code must be at least 2 characters long");
            return;
        }

        if (!name.trim() || name.trim().length < 2) {
            alert("Material Name must be at least 2 characters long");
            return;
        }

        if (isNaN(unitPrice) || Number(unitPrice) < 0) {
            alert("Unit price cannot be negative");
            return;
        }

        if (Number(currentStock) < 0 || Number(minStock) < 0 || Number(reorderLevel) < 0) {
            alert("Stock levels cannot be negative");
            return;
        }

        try {
            const payload = {
                materialCode: materialCode.trim().toUpperCase(),
                name: name.trim(),
                unit,
                unitPrice: Number(unitPrice),
                currentStock: Number(currentStock),
                minimumStockLevel: Number(minStock),
                reorderLevel: Number(reorderLevel),
                warehouse: warehouse ? warehouse.trim() : "Main Warehouse",
            };
            await apiClient.post("/raw-materials", payload);
            alert("Raw Material created successfully!");
            setShowCreateModal(false);
            // Reset
            setMaterialCode("");
            setName("");
            setUnitPrice("");
            setCurrentStock(0);
            setMinStock(0);
            setReorderLevel(0);
            fetchMaterials();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create raw material");
        }
    };

    const handleAdjustStock = async (e) => {
        e.preventDefault();
        if (!adjustMaterial) return;

        if (isNaN(adjustmentQty) || Number(adjustmentQty) === 0) {
            alert("Adjustment quantity must be a non-zero number (positive to add, negative to reduce)");
            return;
        }

        try {
            const res = await apiClient.post(`/raw-materials/${adjustMaterial._id}/adjust-stock`, {
                adjustment: Number(adjustmentQty),
                reason: adjustReason.trim() || "Manual test adjustment",
            });
            alert(res.data?.message || "Stock adjusted successfully!");
            setAdjustMaterial(null);
            setAdjustmentQty("");
            setAdjustReason("");
            fetchMaterials();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to adjust stock");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Raw Materials Catalog</h1>
                    <p className="text-xs text-gray-500">Track raw inventory, stock reservations, and adjustments</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                >
                    + Add Raw Material
                </button>
            </div>

            {/* Filter Controls */}
            <div className="bg-white p-3 rounded border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search code or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none w-64"
                    />
                    <button type="submit" className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded font-medium">
                        Search
                    </button>
                </form>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                    <input
                        type="checkbox"
                        checked={lowStockOnly}
                        onChange={(e) => {
                            setLowStockOnly(e.target.checked);
                            setPage(1);
                        }}
                        className="rounded text-red-600"
                    />
                    <span>Show Low Stock Only</span>
                </label>
            </div>

            {/* Materials Table */}
            <div className="bg-white rounded border border-gray-200 overflow-x-auto text-xs">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                        <tr>
                            <th className="p-3">Code</th>
                            <th className="p-3">Material Name</th>
                            <th className="p-3">Unit</th>
                            <th className="p-3">Unit Price</th>
                            <th className="p-3">Current Stock</th>
                            <th className="p-3">Reserved</th>
                            <th className="p-3">Available</th>
                            <th className="p-3">Min Level</th>
                            <th className="p-3">Warehouse</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="10" className="p-4 text-center text-gray-500">
                                    Loading raw materials...
                                </td>
                            </tr>
                        ) : materials.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="p-4 text-center text-gray-500">
                                    No raw materials found.
                                </td>
                            </tr>
                        ) : (
                            materials.map((m) => {
                                const isLow = m.currentStock <= m.minimumStockLevel;
                                return (
                                    <tr key={m._id} className={`hover:bg-gray-50/50 ${isLow ? "bg-red-50/30" : ""}`}>
                                        <td className="p-3 font-mono font-medium text-gray-900">{m.materialCode}</td>
                                        <td className="p-3 font-medium">{m.name}</td>
                                        <td className="p-3 uppercase text-[10px] text-gray-600">{m.unit}</td>
                                        <td className="p-3 font-semibold">₹{m.unitPrice}</td>
                                        <td className="p-3 font-bold">
                                            <span className={isLow ? "text-red-600 font-bold" : ""}>
                                                {m.currentStock}
                                            </span>
                                            {isLow && (
                                                <span className="ml-1 text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-semibold">
                                                    LOW
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-amber-700">{m.reservedQuantity || 0}</td>
                                        <td className="p-3 font-semibold text-emerald-700">
                                            {m.availableQuantity !== undefined ? m.availableQuantity : m.currentStock - (m.reservedQuantity || 0)}
                                        </td>
                                        <td className="p-3 text-gray-500">{m.minimumStockLevel}</td>
                                        <td className="p-3 text-gray-500">{m.warehouse}</td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => setAdjustMaterial(m)}
                                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px]"
                                            >
                                                Adjust Stock
                                            </button>
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
                <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
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

            {/* ─── MODAL: CREATE RAW MATERIAL ─────────────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg border max-w-md w-full p-5 text-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h2 className="font-bold text-base text-gray-900">Add Raw Material</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleCreateMaterial} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Material Code *</label>
                                    <input
                                        required
                                        value={materialCode}
                                        onChange={(e) => setMaterialCode(e.target.value)}
                                        placeholder="RM-STL-01"
                                        className="w-full border p-2 rounded uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Unit *</label>
                                    <select
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        className="w-full border p-2 rounded bg-white"
                                    >
                                        <option value="pcs">pcs</option>
                                        <option value="meter">meter</option>
                                        <option value="kg">kg</option>
                                        <option value="ltr">ltr</option>
                                        <option value="box">box</option>
                                        <option value="roll">roll</option>
                                        <option value="set">set</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Material Name *</label>
                                <input
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Steel Tube 25mm Round"
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Unit Price (₹) *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        placeholder="85.00"
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Initial Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={currentStock}
                                        onChange={(e) => setCurrentStock(e.target.value)}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Min Stock Level</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={minStock}
                                        onChange={(e) => setMinStock(e.target.value)}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Reorder Level</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={reorderLevel}
                                        onChange={(e) => setReorderLevel(e.target.value)}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Warehouse Bay</label>
                                <input
                                    value={warehouse}
                                    onChange={(e) => setWarehouse(e.target.value)}
                                    placeholder="Bay A - Metals"
                                    className="w-full border p-2 rounded"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t">
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
                                    Save Material
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── MODAL: ADJUST STOCK ────────────────────────────────────────── */}
            {adjustMaterial && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg border max-w-sm w-full p-5 text-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <div>
                                <h2 className="font-bold text-base text-gray-900">Adjust Stock</h2>
                                <p className="text-xs text-gray-500">
                                    {adjustMaterial.name} ({adjustMaterial.materialCode})
                                </p>
                            </div>
                            <button onClick={() => setAdjustMaterial(null)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
                            <div className="bg-gray-50 p-2 rounded text-gray-700">
                                Current Stock: <strong>{adjustMaterial.currentStock} {adjustMaterial.unit}</strong>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">
                                    Adjustment Quantity (e.g. +50 for purchase, -10 for scrap)
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={adjustmentQty}
                                    onChange={(e) => setAdjustmentQty(e.target.value)}
                                    placeholder="+50 or -10"
                                    className="w-full border p-2 rounded font-mono font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Reason / Note</label>
                                <input
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="Received supplier shipment #1042"
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button
                                    type="button"
                                    onClick={() => setAdjustMaterial(null)}
                                    className="px-3 py-1.5 border rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Apply Adjustment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
