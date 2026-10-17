import mongoose, { Schema } from "mongoose";

const inventoryTransactionSchema = new Schema(
    {
        transactionType: {
            type: String,
            required: [true, "Transaction type is required"],
            enum: [
                "purchase",        // New raw material received
                "material_issue",  // Raw material reserved/issued to production
                "production",      // Finished goods produced and received into stock
                "adjustment",      // Manual stock correction (spoilage, count)
                "dispatch",        // Finished goods shipped to customer
                "return",          // Customer or production return
            ],
        },
        itemType: {
            type: String,
            required: [true, "Item type is required"],
            enum: ["RawMaterial", "FinishedGood"],
        },
        rawMaterial: {
            type: Schema.Types.ObjectId,
            ref: "RawMaterial",
        },
        finishedGood: {
            type: Schema.Types.ObjectId,
            ref: "FinishedGood",
        },
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
        },
        previousBalance: {
            type: Number,
            required: true,
        },
        newBalance: {
            type: Number,
            required: true,
        },
        referenceType: {
            type: String,
            enum: ["SalesOrder", "ProductionPlan", "Manual", "PurchaseOrder", "Dispatch"],
            default: "Manual",
        },
        referenceId: {
            type: Schema.Types.ObjectId,
        },
        referenceNumber: {
            type: String,
            trim: true,
        },
        remarks: {
            type: String,
            trim: true,
        },
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

inventoryTransactionSchema.index({ transactionType: 1, createdAt: -1 });
inventoryTransactionSchema.index({ rawMaterial: 1, createdAt: -1 });
inventoryTransactionSchema.index({ product: 1, createdAt: -1 });

const InventoryTransaction = mongoose.model("InventoryTransaction", inventoryTransactionSchema);
export default InventoryTransaction;
