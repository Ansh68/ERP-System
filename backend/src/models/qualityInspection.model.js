import mongoose, { Schema } from "mongoose";

const qualityInspectionSchema = new Schema(
    {
        inspectionNumber: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        productionPlan: {
            type: Schema.Types.ObjectId,
            ref: "ProductionPlan",
            required: [true, "Production plan reference is required"],
        },
        salesOrder: {
            type: Schema.Types.ObjectId,
            ref: "SalesOrder",
            required: [true, "Sales order reference is required"],
        },
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product reference is required"],
        },
        inspectedQuantity: {
            type: Number,
            required: [true, "Inspected quantity is required"],
            min: [1, "Inspected quantity must be at least 1"],
        },
        passedQuantity: {
            type: Number,
            required: [true, "Passed quantity is required"],
            min: [0, "Passed quantity cannot be negative"],
        },
        failedQuantity: {
            type: Number,
            default: 0,
            min: [0, "Failed quantity cannot be negative"],
        },
        parameters: {
            visualInspection: {
                type: String,
                enum: ["pass", "fail", "na"],
                default: "pass",
            },
            dimensions: {
                type: String,
                enum: ["pass", "fail", "na"],
                default: "pass",
            },
            weight: {
                type: String,
                enum: ["pass", "fail", "na"],
                default: "pass",
            },
            finish: {
                type: String,
                enum: ["pass", "fail", "na"],
                default: "pass",
            },
        },
        status: {
            type: String,
            required: [true, "Inspection status is required"],
            enum: ["passed", "failed", "rework_required"],
            default: "passed",
        },
        generatedBatchNumber: {
            type: String,
            trim: true,
            uppercase: true,
        },
        remarks: {
            type: String,
            trim: true,
        },
        inspector: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        inspectionDate: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

qualityInspectionSchema.index({ inspectionNumber: 1 });
qualityInspectionSchema.index({ salesOrder: 1, status: 1 });
qualityInspectionSchema.index({ productionPlan: 1 });

const QualityInspection = mongoose.model("QualityInspection", qualityInspectionSchema);
export default QualityInspection;
