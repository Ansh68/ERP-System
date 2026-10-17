import mongoose, { Schema } from "mongoose";

// BOM line item — one raw material + quantity needed per 1 unit of product
const bomItemSchema = new Schema(
    {
        rawMaterial: {
            type: Schema.Types.ObjectId,
            ref: "RawMaterial",
            required: [true, "Raw material reference is required"],
        },
        quantity: {
            type: Number,
            required: [true, "Quantity per unit is required"],
            min: [0.001, "Quantity must be greater than 0"],
        },
        // Unit is stored here for display — source of truth is RawMaterial.unit
        unit: {
            type: String,
            trim: true,
        },
    },
    { _id: false }
);

const productSchema = new Schema(
    {
        productCode: {
            type: String,
            required: [true, "Product code is required"],
            unique: true,
            uppercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        unitSellingPrice: {
            type: Number,
            required: [true, "Unit selling price is required"],
            min: [0, "Price cannot be negative"],
        },
        // Bill of Materials — ingredients list for manufacturing 1 unit
        bom: [bomItemSchema],
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

productSchema.index({ name: "text", productCode: "text", category: "text" });

const Product = mongoose.model("Product", productSchema);
export default Product;
