import SalesOrder from "../models/salesOrder.model.js";
import ProductionPlan from "../models/productionPlan.model.js";
import RawMaterial from "../models/rawMaterial.model.js";
import FinishedGood from "../models/finishedGood.model.js";
import QualityInspection from "../models/qualityInspection.model.js";
import AuditLog from "../models/auditLog.model.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─── GET COMPREHENSIVE DASHBOARD METRICS ──────────────────────────────────────
export const getDashboardMetrics = asyncHandler(async (req, res) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
        totalOrders,
        pendingOrders,
        readyForDispatchOrders,
        runningProduction,
        lowStockMaterials,
        rawMaterialValuation,
        finishedGoodsValuation,
        revenueData,
        todayProductionData,
        orderStatusCounts,
        recentOrders,
        recentAuditLogs,
    ] = await Promise.all([
        // 1. Total non-cancelled orders
        SalesOrder.countDocuments({ status: { $ne: "cancelled" } }),

        // 2. Pending orders in pipeline
        SalesOrder.countDocuments({
            status: {
                $in: [
                    "draft",
                    "approved",
                    "inventory_check",
                    "production_planned",
                    "in_production",
                    "quality_check",
                ],
            },
        }),

        // 3. Orders ready for dispatch
        SalesOrder.countDocuments({ status: "ready_for_dispatch" }),

        // 4. Running production jobs on shop floor
        ProductionPlan.countDocuments({
            stage: { $in: ["material_issued", "manufacturing", "assembly", "packaging"] },
        }),

        // 5. Low stock raw materials
        RawMaterial.countDocuments({
            isActive: true,
            $expr: { $lte: ["$currentStock", "$minimumStockLevel"] },
        }),

        // 6. Raw Materials inventory valuation
        RawMaterial.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: { $multiply: ["$currentStock", "$unitPrice"] } },
                    totalStockUnits: { $sum: "$currentStock" },
                },
            },
        ]),

        // 7. Finished Goods inventory valuation
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
                    totalValue: {
                        $sum: { $multiply: ["$quantity", "$productDoc.unitSellingPrice"] },
                    },
                    totalStockUnits: { $sum: "$quantity" },
                },
            },
        ]),

        // 8. Revenue summary
        SalesOrder.aggregate([
            { $match: { status: { $ne: "cancelled" } } },
            {
                $group: {
                    _id: null,
                    totalOrderValue: { $sum: "$totalAmount" },
                    realizedRevenue: {
                        $sum: {
                            $cond: [
                                { $in: ["$status", ["dispatched", "delivered"]] },
                                "$totalAmount",
                                0,
                            ],
                        },
                    },
                    pipelineRevenue: {
                        $sum: {
                            $cond: [
                                {
                                    $in: [
                                        "$status",
                                        [
                                            "draft",
                                            "approved",
                                            "inventory_check",
                                            "production_planned",
                                            "in_production",
                                            "quality_check",
                                            "ready_for_dispatch",
                                        ],
                                    ],
                                },
                                "$totalAmount",
                                0,
                            ],
                        },
                    },
                },
            },
        ]),

        // 9. Today's production output (units passed in QC today)
        QualityInspection.aggregate([
            {
                $match: {
                    status: "passed",
                    createdAt: { $gte: todayStart },
                },
            },
            {
                $group: {
                    _id: null,
                    unitsProducedToday: { $sum: "$passedQuantity" },
                },
            },
        ]),

        // 10. Status breakdown of all orders
        SalesOrder.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]),

        // 11. Recent 5 orders
        SalesOrder.find()
            .populate("customer", "companyName")
            .sort({ createdAt: -1 })
            .limit(5)
            .select("orderNumber customer totalAmount status createdAt priority"),

        // 12. Recent 5 audit logs
        AuditLog.find()
            .sort({ timestamp: -1 })
            .limit(5)
            .select("action resource userName timestamp ipAddress"),
    ]);

    const rawVal = rawMaterialValuation[0]?.totalValue || 0;
    const fgVal = finishedGoodsValuation[0]?.totalValue || 0;
    const totalInventoryValue = rawVal + fgVal;

    const rev = revenueData[0] || {
        totalOrderValue: 0,
        realizedRevenue: 0,
        pipelineRevenue: 0,
    };

    const statusMap = {};
    orderStatusCounts.forEach((s) => {
        statusMap[s._id] = s.count;
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                kpis: {
                    totalOrders,
                    pendingOrders,
                    ordersReadyForDispatch: readyForDispatchOrders,
                    runningProduction,
                    lowStockMaterials,
                    todayProduction: todayProductionData[0]?.unitsProducedToday || 0,
                    inventoryValue: {
                        rawMaterials: rawVal,
                        finishedGoods: fgVal,
                        total: totalInventoryValue,
                    },
                    revenue: {
                        realizedRevenue: rev.realizedRevenue,
                        pipelineRevenue: rev.pipelineRevenue,
                        totalOrderValue: rev.totalOrderValue,
                    },
                },
                orderStatusDistribution: statusMap,
                recentOrders,
                recentActivities: recentAuditLogs,
            },
            "Dashboard metrics fetched successfully"
        )
    );
});
