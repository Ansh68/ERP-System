import Product from "../models/product.model.js";
import RawMaterial from "../models/rawMaterial.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─── CREATE PRODUCT ───────────────────────────────────────────────────────────
export const createProduct = asyncHandler(async (req, res) => {
    const { productCode, name, category, description, unitSellingPrice, bom } = req.body;

    if (!productCode || !name || !category || unitSellingPrice === undefined) {
        throw new ApiError(400, "productCode, name, category, and unitSellingPrice are required");
    }

    const existing = await Product.findOne({ productCode: productCode.toUpperCase() });
    if (existing) {
        throw new ApiError(409, `Product code '${productCode}' already exists`);
    }

    // Validate BOM — each rawMaterial ref must exist and quantity must be > 0
    if (bom && bom.length > 0) {
        for (const item of bom) {
            if (!item.rawMaterial || !item.quantity) {
                throw new ApiError(400, "Each BOM item must have rawMaterial and quantity");
            }
            const material = await RawMaterial.findById(item.rawMaterial);
            if (!material) {
                throw new ApiError(404, `Raw material '${item.rawMaterial}' not found`);
            }
            // Auto-fill unit from the raw material for display
            item.unit = material.unit;
        }
    }

    const product = await Product.create({
        productCode,
        name,
        category,
        description,
        unitSellingPrice,
        bom: bom || [],
        createdBy: req.user._id,
    });

    // Populate BOM with raw material details before sending response
    await product.populate("bom.rawMaterial", "materialCode name unit");

    return res
        .status(201)
        .json(new ApiResponse(201, product, "Product created successfully"));
});

// ─── GET ALL PRODUCTS ─────────────────────────────────────────────────────────
export const getAllProducts = asyncHandler(async (req, res) => {
    const { search, category, isActive, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (search) {
        filter.$text = { $search: search };
    }
    if (category) {
        filter.category = { $regex: category, $options: "i" };
    }
    if (isActive !== undefined) {
        filter.isActive = isActive === "true";
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
        Product.find(filter)
            .populate("bom.rawMaterial", "materialCode name unit currentStock")
            .populate("createdBy", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Product.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            products,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Products fetched successfully")
    );
});

// ─── GET PRODUCT BY ID ────────────────────────────────────────────────────────
export const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate("bom.rawMaterial", "materialCode name unit currentStock reservedQuantity unitPrice")
        .populate("createdBy", "name email");

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched successfully"));
});

// ─── UPDATE PRODUCT ───────────────────────────────────────────────────────────
export const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Check for duplicate productCode if it's being changed
    if (req.body.productCode && req.body.productCode.toUpperCase() !== product.productCode) {
        const duplicate = await Product.findOne({ productCode: req.body.productCode.toUpperCase() });
        if (duplicate) {
            throw new ApiError(409, "Product code already in use");
        }
    }

    // Validate new BOM if provided
    if (req.body.bom && req.body.bom.length > 0) {
        for (const item of req.body.bom) {
            if (!item.rawMaterial || !item.quantity) {
                throw new ApiError(400, "Each BOM item must have rawMaterial and quantity");
            }
            const material = await RawMaterial.findById(item.rawMaterial);
            if (!material) {
                throw new ApiError(404, `Raw material '${item.rawMaterial}' not found`);
            }
            item.unit = material.unit;
        }
    }

    const allowedFields = [
        "name", "category", "description", "unitSellingPrice",
        "bom", "isActive", "productCode",
    ];

    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            product[field] = req.body[field];
        }
    });

    await product.save();
    await product.populate("bom.rawMaterial", "materialCode name unit");

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product updated successfully"));
});

// ─── GET PRODUCT CATEGORIES (distinct) ───────────────────────────────────────
export const getCategories = asyncHandler(async (req, res) => {
    const categories = await Product.distinct("category");
    return res
        .status(200)
        .json(new ApiResponse(200, categories, "Categories fetched"));
});

// ─── MRP PREVIEW — Calculate raw material needs for a given quantity ──────────
export const calculateMRP = asyncHandler(async (req, res) => {
    const { quantity } = req.query;

    if (!quantity || Number(quantity) <= 0) {
        throw new ApiError(400, "quantity query param is required and must be > 0");
    }

    const product = await Product.findById(req.params.id)
        .populate("bom.rawMaterial", "materialCode name unit currentStock reservedQuantity unitPrice");

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (!product.bom || product.bom.length === 0) {
        throw new ApiError(400, "This product has no BOM defined");
    }

    const qty = Number(quantity);

    const mrpResult = product.bom.map((item) => {
        const required = item.quantity * qty;
        const available = Math.max(0, item.rawMaterial.currentStock - item.rawMaterial.reservedQuantity);
        const shortage = Math.max(0, required - available);

        return {
            rawMaterial: {
                _id: item.rawMaterial._id,
                materialCode: item.rawMaterial.materialCode,
                name: item.rawMaterial.name,
                unit: item.rawMaterial.unit,
            },
            quantityPerUnit: item.quantity,
            requiredQuantity: required,
            availableQuantity: available,
            shortage,
            hasShortage: shortage > 0,
        };
    });

    const hasAnyShortage = mrpResult.some((r) => r.hasShortage);

    return res.status(200).json(
        new ApiResponse(200, {
            product: { _id: product._id, productCode: product.productCode, name: product.name },
            orderQuantity: qty,
            mrp: mrpResult,
            canFulfillFromProduction: !hasAnyShortage,
        }, "MRP calculation complete")
    );
});
