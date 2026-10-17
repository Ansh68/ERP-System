import mongoose, { Schema } from "mongoose";

const stageHistorySchema = new Schema(
    {
        stage: {
            type: String,
            required: true,
            enum: [
                "planned",
                "material_issued",
                "manufacturing",
                "assembly",
                "packaging",
                "completed",
                "cancelled",
            ],
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        producedQuantity: {
            type: Number,
            default: 0,
        },
        rejectedQuantity: {
            type: Number,
            default: 0,
        },
        remarks: {
            type: String,
            trim: true,
        },
    },
    { _id: false }
);

const productionPlanSchema = new Schema(
    {
        productionOrderNumber: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
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
        quantity: {
            type: Number,
            required: [true, "Planned quantity is required"],
            min: [1, "Quantity must be at least 1"],
        },
        producedQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },
        rejectedQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },
        machine: {
            type: String,
            required: [true, "Machine assignment is required"],
            trim: true,
        },
        shift: {
            type: String,
            required: [true, "Shift is required"],
            enum: ["morning", "afternoon", "night"],
            default: "morning",
        },
        operator: {
            type: String,
            trim: true,
        },
        supervisor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Supervisor is required"],
        },
        startDate: {
            type: Date,
            required: [true, "Start date is required"],
        },
        endDate: {
            type: Date,
            required: [true, "End date is required"],
        },
        stage: {
            type: String,
            enum: [
                "planned",
                "material_issued",
                "manufacturing",
                "assembly",
                "packaging",
                "completed",
                "cancelled",
            ],
            default: "planned",
        },
        materialsIssued: {
            type: Boolean,
            default: false,
        },
        stageHistory: [stageHistorySchema],
        remarks: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

productionPlanSchema.index({ salesOrder: 1, stage: 1 });
productionPlanSchema.index({ stage: 1, startDate: 1 });

const ProductionPlan = mongoose.model("ProductionPlan", productionPlanSchema);
export default ProductionPlan;
