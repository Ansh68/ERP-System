import SalesOrder from "../models/salesOrder.model.js";
import ProductionPlan from "../models/productionPlan.model.js";
import RawMaterial from "../models/rawMaterial.model.js";
import FinishedGood from "../models/finishedGood.model.js";
import InventoryTransaction from "../models/inventoryTransaction.model.js";
import Dispatch from "../models/dispatch.model.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─── 1. SALES REPORT ──────────────────────────────────────────────────────────
export const getSalesReport = asyncHandler(async (req, res) => {
    const { startDate, endDate, status } = req.query;

    const matchStage = { status: { $ne: "cancelled" } };

    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }
    if (status) {
        matchStage.status = status;
    }

    const [summary, topProducts, topCustomers] = await Promise.all([
        // Summary metrics
        SalesOrder.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" },
                    avgOrderValue: { $avg: "$totalAmount" },
                },
            },
        ]),

        // Top products by revenue and quantity
        SalesOrder.aggregate([
            { $match: matchStage },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    totalQuantity: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: "$items.totalPrice" },
                },
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product",
                },
            },
            { $unwind: "$product" },
            {
                $project: {
                    _id: 1,
                    productCode: "$product.productCode",
                    name: "$product.name",
                    category: "$product.category",
                    totalQuantity: 1,
                    totalRevenue: 1,
                },
            },
        ]),

        // Top customers by total spend
        SalesOrder.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$customer",
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: "$totalAmount" },
                },
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "customers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "customer",
                },
            },
            { $unwind: "$customer" },
            {
                $project: {
                    _id: 1,
                    companyName: "$customer.companyName",
                    contactPerson: "$customer.contactPerson",
                    orderCount: 1,
                    totalSpent: 1,
                },
            },
        ]),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                summary: summary[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
                topProducts,
                topCustomers,
            },
            "Sales report generated successfully"
        )
    );
});

// ─── 2. INVENTORY REPORT ──────────────────────────────────────────────────────
export const getInventoryReport = asyncHandler(async (req, res) => {
    const [rawStats, fgStats, warehouseBreakdown] = await Promise.all([
        // Raw Materials summary
        RawMaterial.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: 1 },
                    totalQuantity: { $sum: "$currentStock" },
                    totalReserved: { $sum: "$reservedQuantity" },
                    totalValuation: { $sum: { $multiply: ["$currentStock", "$unitPrice"] } },
                },
            },
        ]),

        // Finished Goods summary
        FinishedGood.aggregate([
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "productDoc",
                },
            },
            { $unwind: "$productDoc" },
            {
                $group: {
                    _id: null,
                    totalBatches: { $sum: 1 },
                    totalUnits: { $sum: "$quantity" },
                    totalReserved: { $sum: "$reservedQuantity" },
                    totalValuation: {
                        $sum: { $multiply: ["$quantity", "$productDoc.unitSellingPrice"] },
                    },
                },
            },
        ]),

        // Warehouse-wise breakdown
        RawMaterial.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: "$warehouse",
                    itemCount: { $sum: 1 },
                    totalStock: { $sum: "$currentStock" },
                    valuation: { $sum: { $multiply: ["$currentStock", "$unitPrice"] } },
                },
            },
        ]),
    ]);

    const rawSummary = rawStats[0] || { totalItems: 0, totalQuantity: 0, totalValuation: 0 };
    const fgSummary = fgStats[0] || { totalBatches: 0, totalUnits: 0, totalValuation: 0 };

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                rawMaterials: rawSummary,
                finishedGoods: fgSummary,
                totalValuation: rawSummary.totalValuation + fgSummary.totalValuation,
                warehouseBreakdown,
            },
            "Inventory report generated successfully"
        )
    );
});

// ─── 3. PRODUCTION REPORT ─────────────────────────────────────────────────────
export const getProductionReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const [summary, machineStats, shiftStats] = await Promise.all([
        // Totals: Planned vs Produced vs Rejected
        ProductionPlan.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalPlans: { $sum: 1 },
                    totalPlannedQty: { $sum: "$quantity" },
                    totalProducedQty: { $sum: "$producedQuantity" },
                    totalRejectedQty: { $sum: "$rejectedQuantity" },
                },
            },
        ]),

        // Breakdown by Machine
        ProductionPlan.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$machine",
                    jobsCount: { $sum: 1 },
                    producedQty: { $sum: "$producedQuantity" },
                    rejectedQty: { $sum: "$rejectedQuantity" },
                },
            },
            { $sort: { producedQty: -1 } },
        ]),

        // Breakdown by Shift
        ProductionPlan.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$shift",
                    jobsCount: { $sum: 1 },
                    producedQty: { $sum: "$producedQuantity" },
                    rejectedQty: { $sum: "$rejectedQuantity" },
                },
            },
        ]),
    ]);

    const totals = summary[0] || {
        totalPlans: 0,
        totalPlannedQty: 0,
        totalProducedQty: 0,
        totalRejectedQty: 0,
    };

    const totalOutput = totals.totalProducedQty + totals.totalRejectedQty;
    const scrapRate = totalOutput > 0 ? ((totals.totalRejectedQty / totalOutput) * 100).toFixed(2) : "0.00";

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totals: {
                    ...totals,
                    scrapRatePercentage: Number(scrapRate),
                },
                machinePerformance: machineStats,
                shiftPerformance: shiftStats,
            },
            "Production report generated successfully"
        )
    );
});

// ─── 4. MATERIAL CONSUMPTION REPORT ───────────────────────────────────────────
export const getMaterialConsumptionReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const matchStage = {
        transactionType: "material_issue",
        itemType: "RawMaterial",
    };

    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const consumption = await InventoryTransaction.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: "$rawMaterial",
                totalConsumedQty: { $sum: { $abs: "$quantity" } },
                transactionCount: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: "rawmaterials",
                localField: "_id",
                foreignField: "_id",
                as: "material",
            },
        },
        { $unwind: "$material" },
        {
            $project: {
                _id: 1,
                materialCode: "$material.materialCode",
                name: "$material.name",
                unit: "$material.unit",
                unitPrice: "$material.unitPrice",
                totalConsumedQty: 1,
                totalConsumedCost: { $multiply: ["$totalConsumedQty", "$material.unitPrice"] },
                transactionCount: 1,
            },
        },
        { $sort: { totalConsumedCost: -1 } },
    ]);

    const totalCost = consumption.reduce((acc, curr) => acc + (curr.totalConsumedCost || 0), 0);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalConsumptionCost: totalCost,
                materials: consumption,
            },
            "Material consumption report generated successfully"
        )
    );
});

// ─── 5. DISPATCH REPORT ───────────────────────────────────────────────────────
export const getDispatchReport = asyncHandler(async (req, res) => {
    const { startDate, endDate, courier } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }
    if (courier) matchStage.courier = courier;

    const [statusStats, courierStats] = await Promise.all([
        // Group by status
        Dispatch.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]),

        // Group by Courier
        Dispatch.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$courier",
                    totalShipments: { $sum: 1 },
                    deliveredCount: {
                        $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
                    },
                },
            },
        ]),
    ]);

    const statusBreakdown = {};
    let totalShipments = 0;
    statusStats.forEach((s) => {
        statusBreakdown[s._id] = s.count;
        totalShipments += s.count;
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalShipments,
                statusBreakdown,
                courierBreakdown: courierStats,
            },
            "Dispatch report generated successfully"
        )
    );
});

// ─── 6. LOW STOCK REPORT ──────────────────────────────────────────────────────
export const getLowStockReport = asyncHandler(async (req, res) => {
    const materials = await RawMaterial.find({
        isActive: true,
        $expr: { $lte: ["$currentStock", "$minimumStockLevel"] },
    }).sort({ currentStock: 1 });

    const report = materials.map((m) => {
        const targetLevel = m.reorderLevel > 0 ? m.reorderLevel : m.minimumStockLevel * 2;
        const recommendedReorderQty = Math.max(0, targetLevel - m.currentStock);
        const estimatedProcurementCost = recommendedReorderQty * m.unitPrice;

        return {
            _id: m._id,
            materialCode: m.materialCode,
            name: m.name,
            unit: m.unit,
            warehouse: m.warehouse,
            currentStock: m.currentStock,
            reservedQuantity: m.reservedQuantity,
            availableQuantity: m.availableQuantity,
            minimumStockLevel: m.minimumStockLevel,
            reorderLevel: m.reorderLevel,
            unitPrice: m.unitPrice,
            recommendedReorderQty,
            estimatedProcurementCost,
        };
    });

    const totalReplenishmentCost = report.reduce((sum, item) => sum + item.estimatedProcurementCost, 0);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                lowStockCount: report.length,
                totalReplenishmentCost,
                materials: report,
            },
            "Low stock report generated successfully"
        )
    );
});
