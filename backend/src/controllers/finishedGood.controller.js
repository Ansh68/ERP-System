import FinishedGood from "../models/finishedGood.model.js";
import Product from "../models/product.model.js";
import InventoryTransaction from "../models/inventoryTransaction.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─── CREATE FINISHED GOODS BATCH ──────────────────────────────────────────────
export const createFinishedGood = asyncHandler(async (req, res) => {
    const {
        product,
        batchNumber,
        quantity,
        manufacturingDate,
        expiryDate,
        warehouse,
        locationRack,
    } = req.body;

    if (!product || !batchNumber || quantity === undefined) {
        throw new ApiError(400, "product, batchNumber, and quantity are required");
    }

    const prodExists = await Product.findById(product);
    if (!prodExists) {
        throw new ApiError(404, "Product not found");
    }

    const batchExists = await FinishedGood.findOne({ batchNumber: batchNumber.toUpperCase() });
    if (batchExists) {
        throw new ApiError(409, `Batch number '${batchNumber}' already exists`);
    }

    const finishedGood = await FinishedGood.create({
        product,
        batchNumber,
        quantity,
        manufacturingDate: manufacturingDate || Date.now(),
        expiryDate,
        warehouse,
        locationRack,
    });

    // Record inventory transaction
    await InventoryTransaction.create({
        transactionType: "production",
        itemType: "FinishedGood",
        finishedGood: finishedGood._id,
        product,
        quantity: Number(quantity),
        previousBalance: 0,
        newBalance: Number(quantity),
        referenceType: "Manual",
        remarks: `Initial stock for batch ${batchNumber}`,
        performedBy: req.user._id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, finishedGood, "Finished goods batch created successfully"));
});

// ─── GET ALL FINISHED GOODS ───────────────────────────────────────────────────
export const getAllFinishedGoods = asyncHandler(async (req, res) => {
    const { product, search, warehouse, page = 1, limit = 10 } = req.query;

    const filter = { isActive: true };

    if (product) {
        filter.product = product;
    }
    if (warehouse) {
        filter.warehouse = warehouse;
    }
    if (search) {
        filter.batchNumber = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [batches, total] = await Promise.all([
        FinishedGood.find(filter)
            .populate("product", "productCode name category unitSellingPrice")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        FinishedGood.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            batches,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Finished goods batches fetched successfully")
    );
});

// ─── GET FINISHED GOOD BY ID ──────────────────────────────────────────────────
export const getFinishedGoodById = asyncHandler(async (req, res) => {
    const batch = await FinishedGood.findById(req.params.id)
        .populate("product", "productCode name category unitSellingPrice bom");

    if (!batch) {
        throw new ApiError(404, "Finished goods batch not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, batch, "Finished goods batch fetched successfully"));
});

// ─── ADJUST FINISHED GOODS QUANTITY ───────────────────────────────────────────
export const adjustFinishedGoodStock = asyncHandler(async (req, res) => {
    const { adjustment, reason } = req.body;

    if (adjustment === undefined || adjustment === 0) {
        throw new ApiError(400, "adjustment value is required and cannot be 0");
    }

    const batch = await FinishedGood.findById(req.params.id);
    if (!batch) {
        throw new ApiError(404, "Finished goods batch not found");
    }

    const previousBalance = batch.quantity;
    const newBalance = previousBalance + Number(adjustment);

    if (newBalance < batch.reservedQuantity) {
        throw new ApiError(
            400,
            `Cannot reduce quantity below reserved quantity (${batch.reservedQuantity}). Current: ${batch.quantity}`
        );
    }

    batch.quantity = newBalance;
    await batch.save();

    await InventoryTransaction.create({
        transactionType: "adjustment",
        itemType: "FinishedGood",
        finishedGood: batch._id,
        product: batch.product,
        quantity: Number(adjustment),
        previousBalance,
        newBalance,
        referenceType: "Manual",
        remarks: reason || "Manual stock adjustment",
        performedBy: req.user._id,
    });

    return res.status(200).json(
        new ApiResponse(200, {
            batchNumber: batch.batchNumber,
            previousQuantity: previousBalance,
            adjustment: Number(adjustment),
            newQuantity: batch.quantity,
            availableQuantity: batch.availableQuantity,
        }, "Finished goods stock adjusted successfully")
    );
});
