import InventoryTransaction from "../models/inventoryTransaction.model.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─── GET ALL INVENTORY TRANSACTIONS ───────────────────────────────────────────
export const getAllInventoryTransactions = asyncHandler(async (req, res) => {
    const {
        transactionType,
        itemType,
        rawMaterial,
        product,
        page = 1,
        limit = 20,
    } = req.query;

    const filter = {};

    if (transactionType) filter.transactionType = transactionType;
    if (itemType) filter.itemType = itemType;
    if (rawMaterial) filter.rawMaterial = rawMaterial;
    if (product) filter.product = product;

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
        InventoryTransaction.find(filter)
            .populate("rawMaterial", "materialCode name unit")
            .populate("product", "productCode name")
            .populate("finishedGood", "batchNumber")
            .populate("performedBy", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        InventoryTransaction.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            transactions,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Inventory transactions fetched successfully")
    );
});
