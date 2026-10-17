import SalesOrder from "../models/salesOrder.model.js";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import RawMaterial from "../models/rawMaterial.model.js";
import FinishedGood from "../models/finishedGood.model.js";
import InventoryTransaction from "../models/inventoryTransaction.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Helper: Generate unique Sales Order Number (SO-YYYYMMDD-XXXX)
const generateOrderNumber = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `SO-${dateStr}-${randomSuffix}`;
};

// ─── 1. CREATE SALES ORDER ───────────────────────────────────────────────────
export const createSalesOrder = asyncHandler(async (req, res) => {
    const { customer, items, expectedDeliveryDate, priority, remarks } = req.body;

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, "Customer and at least one item are required");
    }

    if (!expectedDeliveryDate) {
        throw new ApiError(400, "expectedDeliveryDate is required");
    }

    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
        throw new ApiError(404, "Customer not found");
    }
    if (!customerDoc.isActive) {
        throw new ApiError(400, "Cannot create order for an inactive customer");
    }

    // Validate products and compute pricing
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
        if (!item.product || !item.quantity || Number(item.quantity) <= 0) {
            throw new ApiError(400, "Each item must have a valid product and quantity > 0");
        }

        const productDoc = await Product.findById(item.product);
        if (!productDoc) {
            throw new ApiError(404, `Product '${item.product}' not found`);
        }
        if (!productDoc.isActive) {
            throw new ApiError(400, `Product '${productDoc.name}' is inactive`);
        }

        const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : productDoc.unitSellingPrice;
        const totalPrice = unitPrice * Number(item.quantity);
        totalAmount += totalPrice;

        validatedItems.push({
            product: productDoc._id,
            quantity: Number(item.quantity),
            unitPrice,
            totalPrice,
            fulfillmentSource: "pending",
        });
    }

    let orderNumber = await generateOrderNumber();
    // Safety check for unique order number collision
    while (await SalesOrder.findOne({ orderNumber })) {
        orderNumber = await generateOrderNumber();
    }

    const order = await SalesOrder.create({
        orderNumber,
        customer,
        items: validatedItems,
        totalAmount,
        expectedDeliveryDate,
        priority: priority || "medium",
        remarks,
        status: "draft",
        statusHistory: [
            {
                status: "draft",
                changedBy: req.user._id,
                changedAt: new Date(),
                note: "Order created in draft status",
            },
        ],
        createdBy: req.user._id,
    });

    await order.populate("customer", "companyName contactPerson email phone");
    await order.populate("items.product", "productCode name category");

    return res
        .status(201)
        .json(new ApiResponse(201, order, "Sales order created successfully"));
});

// ─── 2. GET ALL SALES ORDERS ──────────────────────────────────────────────────
export const getAllSalesOrders = asyncHandler(async (req, res) => {
    const { status, customer, priority, search, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (customer) filter.customer = customer;
    if (priority) filter.priority = priority;
    if (search) {
        filter.orderNumber = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
        SalesOrder.find(filter)
            .populate("customer", "companyName contactPerson email phone")
            .populate("items.product", "productCode name unitSellingPrice")
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        SalesOrder.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            orders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Sales orders fetched successfully")
    );
});

// ─── 3. GET SALES ORDER BY ID ─────────────────────────────────────────────────
export const getSalesOrderById = asyncHandler(async (req, res) => {
    const order = await SalesOrder.findById(req.params.id)
        .populate("customer")
        .populate("items.product")
        .populate("statusHistory.changedBy", "name email role")
        .populate("createdBy", "name email role")
        .populate("inventoryValidation.reservedRawMaterials.rawMaterial", "materialCode name unit")
        .populate("inventoryValidation.shortages.rawMaterial", "materialCode name unit");

    if (!order) {
        throw new ApiError(404, "Sales order not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Sales order fetched successfully"));
});

// ─── 4. UPDATE SALES ORDER (Draft only) ─────────────────────────────────────────
export const updateSalesOrder = asyncHandler(async (req, res) => {
    const order = await SalesOrder.findById(req.params.id);

    if (!order) {
        throw new ApiError(404, "Sales order not found");
    }

    if (order.status !== "draft") {
        throw new ApiError(400, `Cannot update order in '${order.status}' status. Only draft orders can be edited.`);
    }

    const { items, expectedDeliveryDate, priority, remarks } = req.body;

    if (expectedDeliveryDate) order.expectedDeliveryDate = expectedDeliveryDate;
    if (priority) order.priority = priority;
    if (remarks !== undefined) order.remarks = remarks;

    if (items && Array.isArray(items) && items.length > 0) {
        let totalAmount = 0;
        const validatedItems = [];

        for (const item of items) {
            const productDoc = await Product.findById(item.product);
            if (!productDoc || !productDoc.isActive) {
                throw new ApiError(400, `Invalid or inactive product '${item.product}'`);
            }

            const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : productDoc.unitSellingPrice;
            const totalPrice = unitPrice * Number(item.quantity);
            totalAmount += totalPrice;

            validatedItems.push({
                product: productDoc._id,
                quantity: Number(item.quantity),
                unitPrice,
                totalPrice,
                fulfillmentSource: "pending",
            });
        }

        order.items = validatedItems;
        order.totalAmount = totalAmount;
    }

    await order.save();
    await order.populate("items.product", "productCode name category");

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Sales order updated successfully"));
});

// ─── 5. CANCEL SALES ORDER & RELEASE RESERVATIONS ──────────────────────────────
export const cancelSalesOrder = asyncHandler(async (req, res) => {
    const order = await SalesOrder.findById(req.params.id);

    if (!order) {
        throw new ApiError(404, "Sales order not found");
    }

    const nonCancellableStatuses = ["dispatched", "delivered", "cancelled"];
    if (nonCancellableStatuses.includes(order.status)) {
        throw new ApiError(400, `Cannot cancel order with status '${order.status}'`);
    }

    // 1. Release reserved finished goods if any
    if (order.inventoryValidation?.reservedFinishedGoods?.length > 0) {
        for (const rfg of order.inventoryValidation.reservedFinishedGoods) {
            const batch = await FinishedGood.findOne({ batchNumber: rfg.batchNumber });
            if (batch) {
                batch.reservedQuantity = Math.max(0, batch.reservedQuantity - rfg.quantity);
                await batch.save();
            }
        }
    }

    // 2. Release reserved raw materials if any
    if (order.inventoryValidation?.reservedRawMaterials?.length > 0) {
        for (const rrm of order.inventoryValidation.reservedRawMaterials) {
            const rm = await RawMaterial.findById(rrm.rawMaterial);
            if (rm) {
                rm.reservedQuantity = Math.max(0, rm.reservedQuantity - rrm.quantity);
                await rm.save();
            }
        }
    }

    order.status = "cancelled";
    order.statusHistory.push({
        status: "cancelled",
        changedBy: req.user._id,
        changedAt: new Date(),
        note: req.body.reason || "Order cancelled by user. All reserved inventory released.",
    });

    await order.save();

    return res.status(200).json(
        new ApiResponse(200, order, "Sales order cancelled and reserved materials released successfully")
    );
});

// ─── 6. APPROVE ORDER & AUTOMATIC INVENTORY/MRP VALIDATION ───────────────────
// Core ERP Lifecycle Step:
// 1. Check Finished Goods:
//    - If all items in stock → Reserve FG → Skip Production → status = "ready_for_dispatch"
// 2. Otherwise:
//    - Generate Production Requirement → Calculate BOM (MRP) → Reserve Raw Materials → status = "production_planned"
export const approveAndValidateOrder = asyncHandler(async (req, res) => {
    const order = await SalesOrder.findById(req.params.id).populate({
        path: "items.product",
        populate: { path: "bom.rawMaterial" },
    });

    if (!order) {
        throw new ApiError(404, "Sales order not found");
    }

    if (order.status !== "draft") {
        throw new ApiError(400, `Only draft orders can be approved. Current status: '${order.status}'`);
    }

    // Step A: Inspect Finished Goods availability across batches
    let canFulfillEntireOrderFromFG = true;
    const fgAllocations = []; // { product, batch, quantity }

    for (const item of order.items) {
        const batches = await FinishedGood.find({
            product: item.product._id,
            isActive: true,
        }).sort({ manufacturingDate: 1 }); // FIFO allocation

        let requiredQty = item.quantity;
        let allocatedForItem = 0;

        for (const batch of batches) {
            const availableInBatch = Math.max(0, batch.quantity - batch.reservedQuantity);
            if (availableInBatch > 0) {
                const take = Math.min(availableInBatch, requiredQty - allocatedForItem);
                fgAllocations.push({
                    product: item.product._id,
                    batch,
                    quantity: take,
                });
                allocatedForItem += take;

                if (allocatedForItem >= requiredQty) break;
            }
        }

        if (allocatedForItem < requiredQty) {
            canFulfillEntireOrderFromFG = false;
        }
    }

    // ─── PATH 1: Finished Goods Available → Reserve & Skip to Ready for Dispatch ───
    if (canFulfillEntireOrderFromFG) {
        const reservedFGSummary = [];

        for (const alloc of fgAllocations) {
            alloc.batch.reservedQuantity += alloc.quantity;
            await alloc.batch.save();

            reservedFGSummary.push({
                product: alloc.product,
                batchNumber: alloc.batch.batchNumber,
                quantity: alloc.quantity,
            });
        }

        // Mark items fulfilled from finished goods
        order.items.forEach((item) => {
            item.fulfillmentSource = "finished_goods";
        });

        order.inventoryValidation = {
            checkedAt: new Date(),
            isFinishedGoodsSufficient: true,
            reservedFinishedGoods: reservedFGSummary,
            isProductionRequired: false,
            reservedRawMaterials: [],
            shortages: [],
        };

        order.status = "ready_for_dispatch";
        order.statusHistory.push({
            status: "approved",
            changedBy: req.user._id,
            changedAt: new Date(),
            note: "Order approved.",
        });
        order.statusHistory.push({
            status: "ready_for_dispatch",
            changedBy: req.user._id,
            changedAt: new Date(),
            note: "Inventory check passed: 100% finished goods in stock. Reserved FG batches and skipped production.",
        });

        await order.save();

        return res.status(200).json(
            new ApiResponse(200, order, "Order approved and fulfilled from existing Finished Goods stock (Ready for Dispatch)")
        );
    }

    // ─── PATH 2: Production Required → MRP Calculation & Raw Material Reservation ───
    // Calculate aggregated raw materials required via Product BOM
    const rawMaterialNeeds = new Map(); // rawMaterialId -> { rawMaterialDoc, totalNeeded }

    for (const item of order.items) {
        item.fulfillmentSource = "production";
        const product = item.product;

        if (!product.bom || product.bom.length === 0) {
            throw new ApiError(
                400,
                `Cannot plan production: Product '${product.name}' has no BOM (Bill of Materials) defined.`
            );
        }

        for (const bomItem of product.bom) {
            const rmId = bomItem.rawMaterial._id.toString();
            const neededForThisItem = bomItem.quantity * item.quantity;

            if (rawMaterialNeeds.has(rmId)) {
                rawMaterialNeeds.get(rmId).totalNeeded += neededForThisItem;
            } else {
                rawMaterialNeeds.set(rmId, {
                    rawMaterial: bomItem.rawMaterial,
                    totalNeeded: neededForThisItem,
                });
            }
        }
    }

    const reservedRMList = [];
    const shortagesList = [];

    // Check availability and reserve raw materials
    for (const [rmId, need] of rawMaterialNeeds.entries()) {
        const rm = await RawMaterial.findById(rmId);
        const available = Math.max(0, rm.currentStock - rm.reservedQuantity);
        const shortage = Math.max(0, need.totalNeeded - available);
        const toReserve = Math.min(available, need.totalNeeded);

        if (toReserve > 0) {
            rm.reservedQuantity += toReserve;
            await rm.save();

            reservedRMList.push({
                rawMaterial: rm._id,
                materialCode: rm.materialCode,
                quantity: toReserve,
            });

            // Log inventory transaction for material reservation
            await InventoryTransaction.create({
                transactionType: "material_issue",
                itemType: "RawMaterial",
                rawMaterial: rm._id,
                quantity: toReserve,
                previousBalance: rm.currentStock,
                newBalance: rm.currentStock, // Stock unchanged, reserved qty increased
                referenceType: "SalesOrder",
                referenceId: order._id,
                referenceNumber: order.orderNumber,
                remarks: `Material reserved for Sales Order ${order.orderNumber}`,
                performedBy: req.user._id,
            });
        }

        if (shortage > 0) {
            shortagesList.push({
                rawMaterial: rm._id,
                materialCode: rm.materialCode,
                name: rm.name,
                requiredQuantity: need.totalNeeded,
                availableQuantity: available,
                shortage,
            });
        }
    }

    order.inventoryValidation = {
        checkedAt: new Date(),
        isFinishedGoodsSufficient: false,
        reservedFinishedGoods: [],
        isProductionRequired: true,
        reservedRawMaterials: reservedRMList,
        shortages: shortagesList,
    };

    order.status = "production_planned";
    order.statusHistory.push({
        status: "approved",
        changedBy: req.user._id,
        changedAt: new Date(),
        note: "Order approved.",
    });
    order.statusHistory.push({
        status: "production_planned",
        changedBy: req.user._id,
        changedAt: new Date(),
        note: shortagesList.length > 0
            ? `Production planned with material shortages on ${shortagesList.length} items. Raw materials reserved.`
            : "Production planned: all raw materials reserved successfully.",
    });

    await order.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            order,
            shortagesList.length > 0
                ? "Order approved & moved to Production Planned with Raw Material shortages noted"
                : "Order approved & moved to Production Planned with all Raw Materials reserved"
        )
    );
});
