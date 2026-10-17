import mongoose, { Schema } from "mongoose";

const addressSchema = new Schema(
    {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        pincode: { type: String, trim: true },
        country: { type: String, trim: true, default: "India" },
    },
    { _id: false }
);

const customerSchema = new Schema(
    {
        companyName: {
            type: String,
            required: [true, "Company name is required"],
            trim: true,
        },
        contactPerson: {
            type: String,
            required: [true, "Contact person is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
        },
        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
        },
        billingAddress: addressSchema,
        shippingAddress: addressSchema,
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

// Text index for global search
customerSchema.index({ companyName: "text", contactPerson: "text", email: "text" });

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
