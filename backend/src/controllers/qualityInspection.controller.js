import QualityInspection from "../models/qualityInspection.model.js";
import ProductionPlan from "../models/productionPlan.model.js";
import SalesOrder from "../models/salesOrder.model.js";
import FinishedGood from "../models/finishedGood.model.js";
import InventoryTransaction from "../models/inventoryTransaction.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Helper: Generate Inspection Number (QC-YYYYMMDD-XXXX)
const generateInspectionNumber = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `QC-${dateStr}-${randomSuffix}`;
};

// Helper: Generate Finished Goods Batch Number
const generateBatchNumber = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `BATCH-${dateStr}-${randomSuffix}`;
};

// ─── 1. CREATE QUALITY INSPECTION ─────────────────────────────────────────────
export const createQualityInspection = asyncHandler(async (req, res) => {
    const {
        productionPlan: planId,
        inspectedQuantity,
        passedQuantity,
        failedQuantity,
        parameters,
        status,
        remarks,
    } = req.body;

    if (!planId || inspectedQuantity === undefined || passedQuantity === undefined || !status) {
        throw new ApiError(
            400,
            "productionPlan, inspectedQuantity, passedQuantity, and status are required"
        );
    }

    const plan = await ProductionPlan.findById(planId).populate("product");
    if (!plan) {
        throw new ApiError(404, "Production plan not found");
    }

    const salesOrder = await SalesOrder.findById(plan.salesOrder);
    if (!salesOrder) {
        throw new ApiError(404, "Linked sales order not found");
    }

    let inspectionNumber = await generateInspectionNumber();
    while (await QualityInspection.findOne({ inspectionNumber })) {
        inspectionNumber = await generateInspectionNumber();
    }

    let generatedBatchNumber = null;

    // ─── CASE 1: QC PASSED ────────────────────────────────────────────────────
    if (status === "passed") {
        if (Number(passedQuantity) <= 0) {
            throw new ApiError(400, "passedQuantity must be > 0 when status is 'passed'");
        }

        generatedBatchNumber = generateBatchNumber();

        // 1. Create Finished Goods Batch for the passed items
        const newBatch = await FinishedGood.create({
            product: plan.product._id,
            batchNumber: generatedBatchNumber,
            quantity: Number(passedQuantity),
            reservedQuantity: Number(passedQuantity), // Reserved specifically for this sales order
            manufacturingDate: plan.endDate || new Date(),
            warehouse: "Main FG Warehouse",
        });

        // 2. Record Inventory Transaction for newly produced finished goods
        await InventoryTransaction.create({
            transactionType: "production",
            itemType: "FinishedGood",
            finishedGood: newBatch._id,
            product: plan.product._id,
            quantity: Number(passedQuantity),
            previousBalance: 0,
            newBalance: Number(passedQuantity),
            referenceType: "ProductionPlan",
            referenceId: plan._id,
            referenceNumber: plan.productionOrderNumber,
            remarks: `Produced and QC-passed from Production Order ${plan.productionOrderNumber}`,
            performedBy: req.user._id,
        });

        // 3. Update Sales Order to ready_for_dispatch
        salesOrder.status = "ready_for_dispatch";
        if (!salesOrder.inventoryValidation) salesOrder.inventoryValidation = {};
        if (!salesOrder.inventoryValidation.reservedFinishedGoods) {
            salesOrder.inventoryValidation.reservedFinishedGoods = [];
        }

        salesOrder.inventoryValidation.reservedFinishedGoods.push({
            product: plan.product._id,
            batchNumber: generatedBatchNumber,
            quantity: Number(passedQuantity),
        });

        salesOrder.statusHistory.push({
            status: "ready_for_dispatch",
            changedBy: req.user._id,
            changedAt: new Date(),
            note: `Quality Inspection passed (${passedQuantity} units passed). Finished Goods batch ${generatedBatchNumber} received and reserved. Order ready for dispatch.`,
        });

        await salesOrder.save();
    }

    // ─── CASE 2: QC REWORK REQUIRED ───────────────────────────────────────────
    else if (status === "rework_required") {
        plan.stage = "manufacturing";
        plan.stageHistory.push({
            stage: "manufacturing",
            timestamp: new Date(),
            updatedBy: req.user._id,
            remarks: `QC inspection determined rework required: ${remarks || "Returning to manufacturing"}`,
        });
        await plan.save();

        salesOrder.status = "in_production";
        salesOrder.statusHistory.push({
            status: "in_production",
            changedBy: req.user._id,
            changedAt: new Date(),
            note: `Quality inspection required rework. Order moved back to In Production.`,
        });
        await salesOrder.save();
    }

    // ─── CASE 3: QC FAILED ────────────────────────────────────────────────────
    else if (status === "failed") {
        salesOrder.statusHistory.push({
            status: salesOrder.status,
            changedBy: req.user._id,
            changedAt: new Date(),
            note: `Quality inspection failed (${failedQuantity || 0} units rejected): ${remarks || "Products failed QC parameters"}.`,
        });
        await salesOrder.save();
    }

    const inspection = await QualityInspection.create({
        inspectionNumber,
        productionPlan: plan._id,
        salesOrder: salesOrder._id,
        product: plan.product._id,
        inspectedQuantity: Number(inspectedQuantity),
        passedQuantity: Number(passedQuantity),
        failedQuantity: Number(failedQuantity) || 0,
        parameters: parameters || {},
        status,
        generatedBatchNumber,
        remarks,
        inspector: req.user._id,
        inspectionDate: new Date(),
    });

    await inspection.populate("product", "productCode name category");
    await inspection.populate("inspector", "name email role");

    return res
        .status(201)
        .json(new ApiResponse(201, inspection, `Quality inspection recorded with status '${status}'`));
});

// ─── 2. GET ALL QUALITY INSPECTIONS ───────────────────────────────────────────
export const getAllQualityInspections = asyncHandler(async (req, res) => {
    const { status, product, salesOrder, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (product) filter.product = product;
    if (salesOrder) filter.salesOrder = salesOrder;

    const skip = (Number(page) - 1) * Number(limit);

    const [inspections, total] = await Promise.all([
        QualityInspection.find(filter)
            .populate("product", "productCode name category")
            .populate("salesOrder", "orderNumber status expectedDeliveryDate")
            .populate("productionPlan", "productionOrderNumber machine shift")
            .populate("inspector", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        QualityInspection.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            inspections,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Quality inspections fetched successfully")
    );
});

// ─── 3. GET QUALITY INSPECTION BY ID ──────────────────────────────────────────
export const getQualityInspectionById = asyncHandler(async (req, res) => {
    const inspection = await QualityInspection.findById(req.params.id)
        .populate("product")
        .populate("salesOrder")
        .populate("productionPlan")
        .populate("inspector", "name email role");

    if (!inspection) {
        throw new ApiError(404, "Quality inspection not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, inspection, "Quality inspection fetched successfully"));
});
