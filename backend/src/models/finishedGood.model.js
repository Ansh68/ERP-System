import mongoose, { Schema } from "mongoose";

const finishedGoodSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product reference is required"],
        },
        batchNumber: {
            type: String,
            required: [true, "Batch number is required"],
            unique: true,
            trim: true,
            uppercase: true,
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [0, "Quantity cannot be negative"],
            default: 0,
        },
        reservedQuantity: {
            type: Number,
            default: 0,
            min: [0, "Reserved quantity cannot be negative"],
        },
        manufacturingDate: {
            type: Date,
            default: Date.now,
        },
        expiryDate: {
            type: Date,
        },
        warehouse: {
            type: String,
            trim: true,
            default: "Main FG Warehouse",
        },
        locationRack: {
            type: String,
            trim: true,
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

// Virtual for available quantity (total batch qty - reserved for orders)
finishedGoodSchema.virtual("availableQuantity").get(function () {
    return Math.max(0, this.quantity - this.reservedQuantity);
});

finishedGoodSchema.index({ product: 1, batchNumber: 1 });

const FinishedGood = mongoose.model("FinishedGood", finishedGoodSchema);
export default FinishedGood;
