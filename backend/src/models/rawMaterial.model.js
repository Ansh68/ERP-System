import mongoose, { Schema } from "mongoose";

const rawMaterialSchema = new Schema(
    {
        materialCode: {
            type: String,
            required: [true, "Material code is required"],
            unique: true,
            uppercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Material name is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        unit: {
            type: String,
            required: [true, "Unit is required"],
            enum: ["pcs", "kg", "g", "ltr", "ml", "meter", "cm", "box", "roll", "set"],
        },
        currentStock: {
            type: Number,
            required: true,
            default: 0,
            min: [0, "Stock cannot be negative"],
        },
        reservedQuantity: {
            type: Number,
            default: 0,
            min: [0, "Reserved quantity cannot be negative"],
        },
        minimumStockLevel: {
            type: Number,
            default: 0,
            min: 0,
        },
        reorderLevel: {
            type: Number,
            default: 0,
            min: 0,
        },
        unitPrice: {
            type: Number,
            required: [true, "Unit price is required"],
            min: [0, "Unit price cannot be negative"],
        },
        warehouse: {
            type: String,
            trim: true,
            default: "Main Warehouse",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Available quantity = currentStock - reservedQuantity
rawMaterialSchema.virtual("availableQuantity").get(function () {
    return Math.max(0, this.currentStock - this.reservedQuantity);
});

// True when stock is at or below minimum level
rawMaterialSchema.virtual("isLowStock").get(function () {
    return this.currentStock <= this.minimumStockLevel;
});

rawMaterialSchema.index({ name: "text", materialCode: "text" });

const RawMaterial = mongoose.model("RawMaterial", rawMaterialSchema);
export default RawMaterial;
