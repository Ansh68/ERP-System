import ProductionPlan from "../models/productionPlan.model.js";
import SalesOrder from "../models/salesOrder.model.js";
import Product from "../models/product.model.js";
import RawMaterial from "../models/rawMaterial.model.js";
import InventoryTransaction from "../models/inventoryTransaction.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Helper: Generate unique Production Order Number (PRD-YYYYMMDD-XXXX)
const generateProductionOrderNumber = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `PRD-${dateStr}-${randomSuffix}`;
};

// ─── 1. CREATE PRODUCTION PLAN ────────────────────────────────────────────────
export const createProductionPlan = asyncHandler(async (req, res) => {
    const {
        salesOrder,
        product,
        quantity,
        machine,
        shift,
        operator,
        supervisor,
        startDate,
        endDate,
        remarks,
    } = req.body;

    if (!salesOrder || !product || !quantity || !machine || !supervisor || !startDate || !endDate) {
        throw new ApiError(
            400,
            "salesOrder, product, quantity, machine, supervisor, startDate, and endDate are required"
        );
    }

    const orderDoc = await SalesOrder.findById(salesOrder);
    if (!orderDoc) {
        throw new ApiError(404, "Sales order not found");
    }

    const allowedOrderStatuses = ["production_planned", "in_production"];
    if (!allowedOrderStatuses.includes(orderDoc.status)) {
        throw new ApiError(
            400,
            `Cannot create production plan for order in '${orderDoc.status}' status. Must be 'production_planned'.`
        );
    }

    const productDoc = await Product.findById(product).populate("bom.rawMaterial");
    if (!productDoc) {
        throw new ApiError(404, "Product not found");
    }

    if (!productDoc.bom || productDoc.bom.length === 0) {
        throw new ApiError(400, `Product '${productDoc.name}' has no BOM defined.`);
    }

    let productionOrderNumber = await generateProductionOrderNumber();
    while (await ProductionPlan.findOne({ productionOrderNumber })) {
        productionOrderNumber = await generateProductionOrderNumber();
    }

    const plan = await ProductionPlan.create({
        productionOrderNumber,
        salesOrder,
        product,
        quantity: Number(quantity),
        machine,
        shift: shift || "morning",
        operator,
        supervisor,
        startDate,
        endDate,
        remarks,
        stage: "planned",
        stageHistory: [
            {
                stage: "planned",
                timestamp: new Date(),
                updatedBy: req.user._id,
                remarks: "Production plan created and scheduled",
            },
        ],
        createdBy: req.user._id,
    });

    await plan.populate("product", "productCode name category");
    await plan.populate("supervisor", "name email");

    return res
        .status(201)
        .json(new ApiResponse(201, plan, "Production plan created successfully"));
});

// ─── 2. GET ALL PRODUCTION PLANS ──────────────────────────────────────────────
export const getAllProductionPlans = asyncHandler(async (req, res) => {
    const { stage, product, salesOrder, machine, shift, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (stage) filter.stage = stage;
    if (product) filter.product = product;
    if (salesOrder) filter.salesOrder = salesOrder;
    if (machine) filter.machine = { $regex: machine, $options: "i" };
    if (shift) filter.shift = shift;

    const skip = (Number(page) - 1) * Number(limit);

    const [plans, total] = await Promise.all([
        ProductionPlan.find(filter)
            .populate("product", "productCode name category")
            .populate("salesOrder", "orderNumber expectedDeliveryDate priority status")
            .populate("supervisor", "name email role")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        ProductionPlan.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            plans,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Production plans fetched successfully")
    );
});

// ─── 3. GET PRODUCTION PLAN BY ID ─────────────────────────────────────────────
export const getProductionPlanById = asyncHandler(async (req, res) => {
    const plan = await ProductionPlan.findById(req.params.id)
        .populate({
            path: "product",
            populate: { path: "bom.rawMaterial", select: "materialCode name unit currentStock" },
        })
        .populate("salesOrder")
        .populate("supervisor", "name email role")
        .populate("stageHistory.updatedBy", "name email")
        .populate("createdBy", "name email");

    if (!plan) {
        throw new ApiError(404, "Production plan not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, plan, "Production plan fetched successfully"));
});

// ─── 4. UPDATE PRODUCTION PLAN DETAILS ────────────────────────────────────────
export const updateProductionPlan = asyncHandler(async (req, res) => {
    const plan = await ProductionPlan.findById(req.params.id);

    if (!plan) {
        throw new ApiError(404, "Production plan not found");
    }

    if (["completed", "cancelled"].includes(plan.stage)) {
        throw new ApiError(400, `Cannot edit production plan in '${plan.stage}' stage.`);
    }

    const allowedFields = ["machine", "shift", "operator", "supervisor", "startDate", "endDate", "remarks"];

    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            plan[field] = req.body[field];
        }
    });

    await plan.save();

    return res
        .status(200)
        .json(new ApiResponse(200, plan, "Production plan updated successfully"));
});

// ─── 5. UPDATE PRODUCTION STAGE & EXECUTION TRACKING ──────────────────────────
// Stages: planned → material_issued → manufacturing → assembly → packaging → completed
export const updateProductionStage = asyncHandler(async (req, res) => {
    const { stage, producedQuantity, rejectedQuantity, operator, remarks } = req.body;

    const validStages = [
        "material_issued",
        "manufacturing",
        "assembly",
        "packaging",
        "completed",
        "cancelled",
    ];

    if (!stage || !validStages.includes(stage)) {
        throw new ApiError(
            400,
            `Invalid stage. Must be one of: ${validStages.join(", ")}`
        );
    }

    const plan = await ProductionPlan.findById(req.params.id).populate({
        path: "product",
        populate: { path: "bom.rawMaterial" },
    });

    if (!plan) {
        throw new ApiError(404, "Production plan not found");
    }

    if (plan.stage === "completed" || plan.stage === "cancelled") {
        throw new ApiError(400, `Production plan is already '${plan.stage}'`);
    }

    const salesOrder = await SalesOrder.findById(plan.salesOrder);

    // ─── STAGE: MATERIAL ISSUED ───────────────────────────────────────────────
    // Deduct actual raw materials from stock and mark order as in_production
    if (stage === "material_issued" && !plan.materialsIssued) {
        const bom = plan.product.bom;

        for (const bomItem of bom) {
            const neededQty = bomItem.quantity * plan.quantity;
            const rm = await RawMaterial.findById(bomItem.rawMaterial._id);

            if (rm) {
                const prevStock = rm.currentStock;
                rm.currentStock = Math.max(0, rm.currentStock - neededQty);
                rm.reservedQuantity = Math.max(0, rm.reservedQuantity - neededQty);
                await rm.save();

                await InventoryTransaction.create({
                    transactionType: "material_issue",
                    itemType: "RawMaterial",
                    rawMaterial: rm._id,
                    quantity: -neededQty,
                    previousBalance: prevStock,
                    newBalance: rm.currentStock,
                    referenceType: "ProductionPlan",
                    referenceId: plan._id,
                    referenceNumber: plan.productionOrderNumber,
                    remarks: `Materials issued for Production Plan ${plan.productionOrderNumber}`,
                    performedBy: req.user._id,
                });
            }
        }

        plan.materialsIssued = true;

        if (salesOrder && salesOrder.status === "production_planned") {
            salesOrder.status = "in_production";
            salesOrder.statusHistory.push({
                status: "in_production",
                changedBy: req.user._id,
                changedAt: new Date(),
                note: `Materials issued for production order ${plan.productionOrderNumber}. Manufacturing commenced.`,
            });
            await salesOrder.save();
        }
    }

    // ─── STAGE: COMPLETED ─────────────────────────────────────────────────────
    // Production completed → Advance SalesOrder to quality_check!
    if (stage === "completed") {
        const finalProduced = producedQuantity !== undefined ? Number(producedQuantity) : plan.quantity;
        const finalRejected = rejectedQuantity !== undefined ? Number(rejectedQuantity) : 0;

        plan.producedQuantity = finalProduced;
        plan.rejectedQuantity = finalRejected;

        if (salesOrder && salesOrder.status === "in_production") {
            salesOrder.status = "quality_check";
            salesOrder.statusHistory.push({
                status: "quality_check",
                changedBy: req.user._id,
                changedAt: new Date(),
                note: `Production completed (${finalProduced} produced, ${finalRejected} rejected). Forwarded to Quality Inspection.`,
            });
            await salesOrder.save();
        }
    }

    // Update ongoing stage quantities and operator if provided
    if (producedQuantity !== undefined) plan.producedQuantity = Number(producedQuantity);
    if (rejectedQuantity !== undefined) plan.rejectedQuantity = Number(rejectedQuantity);
    if (operator) plan.operator = operator;

    plan.stage = stage;
    plan.stageHistory.push({
        stage,
        timestamp: new Date(),
        updatedBy: req.user._id,
        producedQuantity: plan.producedQuantity,
        rejectedQuantity: plan.rejectedQuantity,
        remarks: remarks || `Moved to ${stage} stage`,
    });

    await plan.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            plan,
            `Production stage successfully updated to '${stage}'`
        )
    );
});
