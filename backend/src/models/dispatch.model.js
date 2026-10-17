import mongoose, { Schema } from "mongoose";

const carrierEventSchema = new Schema(
    {
        status: { type: String, required: true },
        location: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        description: { type: String, required: true },
    },
    { _id: false }
);

const dispatchItemSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        batchNumber: {
            type: String,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, "Quantity must be at least 1"],
        },
    },
    { _id: false }
);

const dispatchSchema = new Schema(
    {
        dispatchNumber: {
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
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: [true, "Customer reference is required"],
        },
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        dispatchDate: {
            type: Date,
            default: Date.now,
        },
        items: [dispatchItemSchema],
        vehicle: {
            type: String,
            trim: true,
        },
        driver: {
            name: {
                type: String,
                trim: true,
                validate: {
                    validator: function (v) {
                        return !v || /^[a-zA-Z\s]{2,50}$/.test(v);
                    },
                    message: "Driver name must contain only letters and spaces (2-50 characters)",
                },
            },
            phone: {
                type: String,
                trim: true,
                validate: {
                    validator: function (v) {
                        return !v || /^\d{10}$/.test(v);
                    },
                    message: "Driver phone number must be exactly 10 digits",
                },
            },
        },
        courier: {
            type: String,
            default: "FloData Express",
            trim: true,
        },
        trackingNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        shippingAddress: {
            street: String,
            city: String,
            state: String,
            pincode: String,
            country: { type: String, default: "India" },
        },
        status: {
            type: String,
            enum: ["in_transit", "out_for_delivery", "delivered", "failed"],
            default: "in_transit",
        },
        carrierEvents: [carrierEventSchema],
        deliveredAt: {
            type: Date,
        },
        dispatchedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        remarks: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

dispatchSchema.index({ salesOrder: 1, status: 1 });

const Dispatch = mongoose.model("Dispatch", dispatchSchema);
export default Dispatch;
