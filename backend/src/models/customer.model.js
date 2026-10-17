import mongoose, { Schema } from "mongoose";

const addressSchema = new Schema(
    {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        pincode: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return !v || /^\d{6}$/.test(v);
                },
                message: "PIN code must be a 6-digit number",
            },
        },
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
            minlength: [2, "Company name must be at least 2 characters"],
            maxlength: [100, "Company name cannot exceed 100 characters"],
        },
        contactPerson: {
            type: String,
            required: [true, "Contact person is required"],
            trim: true,
            minlength: [2, "Contact person name must be at least 2 characters"],
            maxlength: [50, "Contact person name cannot exceed 50 characters"],
            match: [/^[a-zA-Z\s]+$/, "Contact person name must contain only letters and spaces"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            match: [/^\d{10}$/, "Phone number must be exactly 10 digits"],
        },
        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
            validate: {
                validator: function (v) {
                    return !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
                },
                message: "Please enter a valid 15-character GSTIN (e.g. 27AAACA1234A1Z5)",
            },
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
