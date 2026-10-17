import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        userName: {
            type: String,
            trim: true,
        },
        action: {
            type: String,
            required: [true, "Action is required"],
            trim: true,
            uppercase: true,
        },
        resource: {
            type: String,
            required: [true, "Resource is required"],
            trim: true,
        },
        resourceId: {
            type: Schema.Types.ObjectId,
        },
        details: {
            type: Schema.Types.Mixed,
            default: {},
        },
        ipAddress: {
            type: String,
            trim: true,
            default: "127.0.0.1",
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
