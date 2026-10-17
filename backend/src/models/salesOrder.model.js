import mongoose, { Schema } from "mongoose";

const orderItemSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1"],
        },
        unitPrice: {
            type: Number,
            required: [true, "Unit price is required"],
            min: [0, "Unit price cannot be negative"],
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        fulfillmentSource: {
            type: String,
            enum: ["pending", "finished_goods", "production"],
            default: "pending",
        },
    },
    { _id: false }
);

const salesOrderSchema = new Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: [true, "Customer reference is required"],
        },
        items: {
            type: [orderItemSchema],
            validate: {
                validator: (val) => val && val.length > 0,
                message: "Order must have at least one product item",
            },
        },
        totalAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        expectedDeliveryDate: {
            type: Date,
            required: [true, "Expected delivery date is required"],
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },
        remarks: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: [
                "draft",
                "approved",
                "inventory_check",
                "production_planned",
                "in_production",
                "quality_check",
                "ready_for_dispatch",
                "dispatched",
                "delivered",
                "cancelled",
            ],
            default: "draft",
        },
        statusHistory: [
            {
                status: { type: String, required: true },
                changedBy: { type: Schema.Types.ObjectId, ref: "User" },
                changedAt: { type: Date, default: Date.now },
                note: { type: String },
            },
        ],
        // Automated Inventory & MRP Validation Report
        inventoryValidation: {
            checkedAt: { type: Date },
            isFinishedGoodsSufficient: { type: Boolean },
            reservedFinishedGoods: [
                {
                    product: { type: Schema.Types.ObjectId, ref: "Product" },
                    batchNumber: { type: String },
                    quantity: { type: Number },
                },
            ],
            isProductionRequired: { type: Boolean, default: false },
            reservedRawMaterials: [
                {
                    rawMaterial: { type: Schema.Types.ObjectId, ref: "RawMaterial" },
                    materialCode: { type: String },
                    quantity: { type: Number },
                },
            ],
            shortages: [
                {
                    rawMaterial: { type: Schema.Types.ObjectId, ref: "RawMaterial" },
                    materialCode: { type: String },
                    name: { type: String },
                    requiredQuantity: { type: Number },
                    availableQuantity: { type: Number },
                    shortage: { type: Number },
                },
            ],
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

salesOrderSchema.index({ customer: 1, status: 1 });
salesOrderSchema.index({ status: 1, createdAt: -1 });

const SalesOrder = mongoose.model("SalesOrder", salesOrderSchema);
export default SalesOrder;
