import Dispatch from "../models/dispatch.model.js";
import SalesOrder from "../models/salesOrder.model.js";
import FinishedGood from "../models/finishedGood.model.js";
import InventoryTransaction from "../models/inventoryTransaction.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    generateTrackingNumber,
    createInitialCarrierEvents,
    getNextCarrierSimulationEvent,
} from "../services/carrier.service.js";

// Helper: Generate Dispatch Number (DSP-YYYYMMDD-XXXX)
const generateDispatchNumber = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `DSP-${dateStr}-${randomSuffix}`;
};

// Helper: Generate Invoice Number (INV-YYYYMMDD-XXXX)
const generateInvoiceNumber = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `INV-${dateStr}-${randomSuffix}`;
};

// ─── 1. CREATE DISPATCH (Shipment Planning & Inventory Decrement) ──────────────
export const createDispatch = asyncHandler(async (req, res) => {
    const {
        salesOrder: orderId,
        vehicle,
        driver,
        courier = "FloData Express",
        remarks,
    } = req.body;

    if (!orderId) {
        throw new ApiError(400, "salesOrder reference is required");
    }

    if (driver) {
        if (driver.name && !/^[a-zA-Z\s]{2,50}$/.test(driver.name.trim())) {
            throw new ApiError(400, "Driver name must contain only letters and spaces (2-50 characters)");
        }
        if (driver.phone && !/^\d{10}$/.test(String(driver.phone).trim())) {
            throw new ApiError(400, "Driver phone number must be exactly 10 digits");
        }
    }

    const order = await SalesOrder.findById(orderId)
        .populate("customer")
        .populate("items.product");

    if (!order) {
        throw new ApiError(404, "Sales order not found");
    }

    if (order.status !== "ready_for_dispatch") {
        throw new ApiError(
            400,
            `Cannot dispatch order with status '${order.status}'. Status must be 'ready_for_dispatch'.`
        );
    }

    let dispatchNumber = await generateDispatchNumber();
    while (await Dispatch.findOne({ dispatchNumber })) {
        dispatchNumber = await generateDispatchNumber();
    }

    let invoiceNumber = await generateInvoiceNumber();
    while (await Dispatch.findOne({ invoiceNumber })) {
        invoiceNumber = await generateInvoiceNumber();
    }

    const trackingNumber = generateTrackingNumber(courier);
    const destCity = order.customer.shippingAddress?.city || "Customer City";
    const initialEvents = createInitialCarrierEvents(courier, "Mumbai", destCity);

    // ─── DECREMENT FINISHED GOODS INVENTORY & LOG TRANSACTIONS ────────────────
    const dispatchItems = [];

    for (const item of order.items) {
        let remainingToDeduct = item.quantity;

        // Check if specific batch was recorded during QC or validation
        const reservedBatches = order.inventoryValidation?.reservedFinishedGoods?.filter(
            (r) => r.product.toString() === item.product._id.toString()
        ) || [];

        if (reservedBatches.length > 0) {
            for (const rfg of reservedBatches) {
                const batch = await FinishedGood.findOne({ batchNumber: rfg.batchNumber });
                if (batch && remainingToDeduct > 0) {
                    const deduct = Math.min(batch.quantity, remainingToDeduct);
                    const prevBalance = batch.quantity;

                    batch.quantity = Math.max(0, batch.quantity - deduct);
                    batch.reservedQuantity = Math.max(0, batch.reservedQuantity - deduct);
                    await batch.save();

                    await InventoryTransaction.create({
                        transactionType: "dispatch",
                        itemType: "FinishedGood",
                        finishedGood: batch._id,
                        product: item.product._id,
                        quantity: -deduct,
                        previousBalance: prevBalance,
                        newBalance: batch.quantity,
                        referenceType: "Dispatch",
                        referenceNumber: dispatchNumber,
                        remarks: `Shipped via Dispatch ${dispatchNumber} (Tracking: ${trackingNumber})`,
                        performedBy: req.user._id,
                    });

                    dispatchItems.push({
                        product: item.product._id,
                        batchNumber: batch.batchNumber,
                        quantity: deduct,
                    });

                    remainingToDeduct -= deduct;
                }
            }
        } else {
            // Fallback: Deduct from available batches FIFO
            const batches = await FinishedGood.find({
                product: item.product._id,
                quantity: { $gt: 0 },
            }).sort({ manufacturingDate: 1 });

            for (const batch of batches) {
                if (remainingToDeduct <= 0) break;
                const deduct = Math.min(batch.quantity, remainingToDeduct);
                const prevBalance = batch.quantity;

                batch.quantity = Math.max(0, batch.quantity - deduct);
                batch.reservedQuantity = Math.max(0, batch.reservedQuantity - deduct);
                await batch.save();

                await InventoryTransaction.create({
                    transactionType: "dispatch",
                    itemType: "FinishedGood",
                    finishedGood: batch._id,
                    product: item.product._id,
                    quantity: -deduct,
                    previousBalance: prevBalance,
                    newBalance: batch.quantity,
                    referenceType: "Dispatch",
                    referenceNumber: dispatchNumber,
                    remarks: `Shipped via Dispatch ${dispatchNumber}`,
                    performedBy: req.user._id,
                });

                dispatchItems.push({
                    product: item.product._id,
                    batchNumber: batch.batchNumber,
                    quantity: deduct,
                });

                remainingToDeduct -= deduct;
            }
        }
    }

    const dispatch = await Dispatch.create({
        dispatchNumber,
        salesOrder: order._id,
        customer: order.customer._id,
        invoiceNumber,
        items: dispatchItems.length > 0 ? dispatchItems : order.items.map((i) => ({
            product: i.product._id,
            quantity: i.quantity,
        })),
        vehicle,
        driver,
        courier,
        trackingNumber,
        shippingAddress: order.customer.shippingAddress || {},
        status: "in_transit",
        carrierEvents: initialEvents,
        dispatchedBy: req.user._id,
        remarks,
    });

    // Advance SalesOrder status to "dispatched"
    order.status = "dispatched";
    order.statusHistory.push({
        status: "dispatched",
        changedBy: req.user._id,
        changedAt: new Date(),
        note: `Order dispatched. Dispatch #: ${dispatchNumber}, Invoice #: ${invoiceNumber}, Tracking: ${trackingNumber} (${courier}). Inventory decremented.`,
    });
    await order.save();

    await dispatch.populate("customer", "companyName contactPerson email phone");
    await dispatch.populate("items.product", "productCode name");

    return res.status(201).json(
        new ApiResponse(
            201,
            dispatch,
            `Order dispatched successfully. Tracking Number: ${trackingNumber}`
        )
    );
});

// ─── 2. GET ALL DISPATCHES ────────────────────────────────────────────────────
export const getAllDispatches = asyncHandler(async (req, res) => {
    const { status, courier, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (courier) filter.courier = courier;
    if (search) {
        filter.$or = [
            { dispatchNumber: { $regex: search, $options: "i" } },
            { trackingNumber: { $regex: search, $options: "i" } },
            { invoiceNumber: { $regex: search, $options: "i" } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [dispatches, total] = await Promise.all([
        Dispatch.find(filter)
            .populate("customer", "companyName contactPerson email phone")
            .populate("salesOrder", "orderNumber totalAmount priority")
            .populate("items.product", "productCode name")
            .populate("dispatchedBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Dispatch.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            dispatches,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Dispatches fetched successfully")
    );
});

// ─── 3. GET DISPATCH BY ID ────────────────────────────────────────────────────
export const getDispatchById = asyncHandler(async (req, res) => {
    const dispatch = await Dispatch.findById(req.params.id)
        .populate("customer")
        .populate("salesOrder")
        .populate("items.product")
        .populate("dispatchedBy", "name email role");

    if (!dispatch) {
        throw new ApiError(404, "Dispatch record not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, dispatch, "Dispatch details fetched successfully"));
});

// ─── 4. TRACK SHIPMENT (Public or Protected Carrier Milestone Lookup) ──────────
export const trackShipment = asyncHandler(async (req, res) => {
    const { trackingNumber } = req.params;

    const dispatch = await Dispatch.findOne({ trackingNumber })
        .populate("customer", "companyName shippingAddress")
        .populate("salesOrder", "orderNumber expectedDeliveryDate")
        .populate("items.product", "productCode name");

    if (!dispatch) {
        throw new ApiError(404, `No shipment found with tracking number '${trackingNumber}'`);
    }

    return res.status(200).json(
        new ApiResponse(200, {
            trackingNumber: dispatch.trackingNumber,
            courier: dispatch.courier,
            status: dispatch.status,
            dispatchDate: dispatch.dispatchDate,
            deliveredAt: dispatch.deliveredAt,
            shippingAddress: dispatch.shippingAddress,
            salesOrder: dispatch.salesOrder,
            items: dispatch.items,
            events: dispatch.carrierEvents,
        }, "Shipment tracking details fetched successfully")
    );
});

// ─── 5. SIMULATE CARRIER PROGRESS (Fake Carrier Service Milestone Advance) ────
// in_transit → out_for_delivery → delivered
export const simulateCarrierProgress = asyncHandler(async (req, res) => {
    const dispatch = await Dispatch.findById(req.params.id);

    if (!dispatch) {
        throw new ApiError(404, "Dispatch not found");
    }

    if (dispatch.status === "delivered") {
        return res
            .status(200)
            .json(new ApiResponse(200, dispatch, "Shipment has already been delivered."));
    }

    const destCity = dispatch.shippingAddress?.city || "Destination";
    const update = getNextCarrierSimulationEvent(dispatch.status, destCity);

    if (!update) {
        throw new ApiError(400, `Cannot advance shipment status beyond '${dispatch.status}'`);
    }

    dispatch.status = update.nextStatus;
    dispatch.carrierEvents.push(update.event);

    // If reached delivered state, update SalesOrder too!
    if (update.nextStatus === "delivered") {
        dispatch.deliveredAt = new Date();

        const order = await SalesOrder.findById(dispatch.salesOrder);
        if (order) {
            order.status = "delivered";
            order.statusHistory.push({
                status: "delivered",
                changedBy: req.user._id,
                changedAt: new Date(),
                note: `Shipment confirmed delivered by carrier (${dispatch.courier}, Tracking: ${dispatch.trackingNumber}). Order lifecycle complete.`,
            });
            await order.save();
        }
    }

    await dispatch.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            dispatch,
            `Carrier updated shipment status to '${update.nextStatus}'`
        )
    );
});

// ─── 6. DIRECT DELIVERY CONFIRMATION ──────────────────────────────────────────
export const markOrderAsDelivered = asyncHandler(async (req, res) => {
    const dispatch = await Dispatch.findById(req.params.id);

    if (!dispatch) {
        throw new ApiError(404, "Dispatch not found");
    }

    if (dispatch.status === "delivered") {
        return res
            .status(200)
            .json(new ApiResponse(200, dispatch, "Shipment is already marked as delivered."));
    }

    const now = new Date();
    dispatch.status = "delivered";
    dispatch.deliveredAt = now;
    dispatch.carrierEvents.push({
        status: "delivered",
        location: dispatch.shippingAddress?.city || "Customer Address",
        timestamp: now,
        description: "Package delivered and signed by customer.",
    });

    await dispatch.save();

    const order = await SalesOrder.findById(dispatch.salesOrder);
    if (order) {
        order.status = "delivered";
        order.statusHistory.push({
            status: "delivered",
            changedBy: req.user._id,
            changedAt: now,
            note: `Order marked as delivered by Dispatch Manager. Tracking: ${dispatch.trackingNumber}.`,
        });
        await order.save();
    }

    return res
        .status(200)
        .json(new ApiResponse(200, dispatch, "Shipment and Sales Order marked as Delivered successfully"));
});
