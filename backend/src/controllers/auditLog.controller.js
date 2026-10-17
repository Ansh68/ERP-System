import AuditLog from "../models/auditLog.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─── GET ALL AUDIT LOGS ───────────────────────────────────────────────────────
export const getAllAuditLogs = asyncHandler(async (req, res) => {
    const { action, resource, user, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (action) filter.action = action.toUpperCase();
    if (resource) filter.resource = resource;
    if (user) filter.user = user;

    if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
        AuditLog.find(filter)
            .populate("user", "name email role")
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(Number(limit)),
        AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                logs,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
            "Audit logs fetched successfully"
        )
    );
});

// ─── GET AUDIT LOG BY ID ──────────────────────────────────────────────────────
export const getAuditLogById = asyncHandler(async (req, res) => {
    const log = await AuditLog.findById(req.params.id).populate("user", "name email role");

    if (!log) {
        throw new ApiError(404, "Audit log not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, log, "Audit log fetched successfully"));
});
