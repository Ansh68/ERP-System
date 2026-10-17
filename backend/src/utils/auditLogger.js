import AuditLog from "../models/auditLog.model.js";

export const logActivity = async ({
    req,
    user,
    action,
    resource,
    resourceId,
    details = {},
}) => {
    try {
        const userId = user?._id || req?.user?._id;
        const userName = user?.name || req?.user?.name || "System";
        const ipAddress =
            req?.ip ||
            req?.headers?.["x-forwarded-for"] ||
            req?.socket?.remoteAddress ||
            "127.0.0.1";

        await AuditLog.create({
            user: userId,
            userName,
            action: action.toUpperCase(),
            resource,
            resourceId,
            details,
            ipAddress,
            timestamp: new Date(),
        });
    } catch (error) {
        // Logging should not break the main request execution
        console.error("Failed to write audit log:", error.message);
    }
};
