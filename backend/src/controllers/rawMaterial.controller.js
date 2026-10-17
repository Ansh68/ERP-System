import RawMaterial from "../models/rawMaterial.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─── CREATE RAW MATERIAL ──────────────────────────────────────────────────────
export const createRawMaterial = asyncHandler(async (req, res) => {
    const {
        materialCode,
        name,
        description,
        unit,
        currentStock,
        minimumStockLevel,
        reorderLevel,
        unitPrice,
        warehouse,
    } = req.body;

    if (!materialCode || !name || !unit || unitPrice === undefined) {
        throw new ApiError(400, "materialCode, name, unit, and unitPrice are required");
    }

    const existing = await RawMaterial.findOne({ materialCode: materialCode.toUpperCase() });
    if (existing) {
        throw new ApiError(409, `Material code '${materialCode}' already exists`);
    }

    const rawMaterial = await RawMaterial.create({
        materialCode,
        name,
        description,
        unit,
        currentStock: currentStock || 0,
        minimumStockLevel: minimumStockLevel || 0,
        reorderLevel: reorderLevel || 0,
        unitPrice,
        warehouse,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, rawMaterial, "Raw material created successfully"));
});

// ─── GET ALL RAW MATERIALS ────────────────────────────────────────────────────
export const getAllRawMaterials = asyncHandler(async (req, res) => {
    const { search, isActive, lowStock, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (search) {
        filter.$text = { $search: search };
    }
    if (isActive !== undefined) {
        filter.isActive = isActive === "true";
    }
    // Filter only materials at or below minimum stock level
    if (lowStock === "true") {
        filter.$expr = { $lte: ["$currentStock", "$minimumStockLevel"] };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [materials, total] = await Promise.all([
        RawMaterial.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        RawMaterial.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            materials,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Raw materials fetched successfully")
    );
});

// ─── GET LOW STOCK MATERIALS ──────────────────────────────────────────────────
export const getLowStockMaterials = asyncHandler(async (req, res) => {
    const materials = await RawMaterial.find({
        isActive: true,
        $expr: { $lte: ["$currentStock", "$minimumStockLevel"] },
    }).sort({ currentStock: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, { materials, count: materials.length }, "Low stock materials fetched"));
});

// ─── GET RAW MATERIAL BY ID ───────────────────────────────────────────────────
export const getRawMaterialById = asyncHandler(async (req, res) => {
    const material = await RawMaterial.findById(req.params.id);

    if (!material) {
        throw new ApiError(404, "Raw material not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, material, "Raw material fetched successfully"));
});

// ─── UPDATE RAW MATERIAL ──────────────────────────────────────────────────────
export const updateRawMaterial = asyncHandler(async (req, res) => {
    const material = await RawMaterial.findById(req.params.id);

    if (!material) {
        throw new ApiError(404, "Raw material not found");
    }

    // materialCode change → check for duplicate
    if (req.body.materialCode && req.body.materialCode.toUpperCase() !== material.materialCode) {
        const duplicate = await RawMaterial.findOne({
            materialCode: req.body.materialCode.toUpperCase(),
        });
        if (duplicate) {
            throw new ApiError(409, "Material code already in use");
        }
    }

    const allowedFields = [
        "name", "description", "unit", "minimumStockLevel",
        "reorderLevel", "unitPrice", "warehouse", "isActive", "materialCode",
    ];

    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            material[field] = req.body[field];
        }
    });

    await material.save();

    return res
        .status(200)
        .json(new ApiResponse(200, material, "Raw material updated successfully"));
});

// ─── ADJUST STOCK ─────────────────────────────────────────────────────────────
// Used for purchase additions or manual corrections
export const adjustStock = asyncHandler(async (req, res) => {
    const { adjustment, reason } = req.body;

    if (adjustment === undefined || adjustment === 0) {
        throw new ApiError(400, "adjustment value is required and cannot be 0");
    }

    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
        throw new ApiError(404, "Raw material not found");
    }

    const newStock = material.currentStock + Number(adjustment);
    if (newStock < 0) {
        throw new ApiError(400, `Adjustment would make stock negative. Current stock: ${material.currentStock}`);
    }

    material.currentStock = newStock;
    await material.save();

    return res.status(200).json(
        new ApiResponse(200, {
            materialCode: material.materialCode,
            name: material.name,
            previousStock: material.currentStock - Number(adjustment),
            adjustment: Number(adjustment),
            currentStock: material.currentStock,
            availableQuantity: material.availableQuantity,
            reason: reason || "Manual adjustment",
        }, "Stock adjusted successfully")
    );
});
