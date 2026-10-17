import Customer from "../models/customer.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─── CREATE CUSTOMER ──────────────────────────────────────────────────────────
export const createCustomer = asyncHandler(async (req, res) => {
    const {
        companyName,
        contactPerson,
        email,
        phone,
        gstNumber,
        billingAddress,
        shippingAddress,
    } = req.body;

    if (!companyName || !contactPerson || !email || !phone) {
        throw new ApiError(400, "companyName, contactPerson, email, and phone are required");
    }

    // Strict validation: Contact person name must be letters and spaces only
    if (!/^[a-zA-Z\s]{2,50}$/.test(contactPerson.trim())) {
        throw new ApiError(400, "Contact person name must contain only letters and spaces (2-50 characters)");
    }

    // Strict validation: Phone must be exactly 10 digits
    if (!/^\d{10}$/.test(String(phone).trim())) {
        throw new ApiError(400, "Phone number must be exactly 10 digits");
    }

    // Strict validation: Email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw new ApiError(400, "Please provide a valid email address");
    }

    const existing = await Customer.findOne({ email });
    if (existing) {
        throw new ApiError(409, "Customer with this email already exists");
    }

    const customer = await Customer.create({
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim().toLowerCase(),
        phone: String(phone).trim(),
        gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : undefined,
        billingAddress,
        shippingAddress,
        createdBy: req.user._id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, customer, "Customer created successfully"));
});

// ─── GET ALL CUSTOMERS ────────────────────────────────────────────────────────
export const getAllCustomers = asyncHandler(async (req, res) => {
    const { search, isActive, page = 1, limit = 10 } = req.query;

    const filter = {};

    // Text search across companyName, contactPerson, email
    if (search) {
        filter.$text = { $search: search };
    }

    if (isActive !== undefined) {
        filter.isActive = isActive === "true";
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [customers, total] = await Promise.all([
        Customer.find(filter)
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Customer.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            customers,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Customers fetched successfully")
    );
});

// ─── GET CUSTOMER BY ID ───────────────────────────────────────────────────────
export const getCustomerById = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id).populate("createdBy", "name email");

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, customer, "Customer fetched successfully"));
});

// ─── UPDATE CUSTOMER ──────────────────────────────────────────────────────────
export const updateCustomer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    if (req.body.contactPerson && !/^[a-zA-Z\s]{2,50}$/.test(req.body.contactPerson.trim())) {
        throw new ApiError(400, "Contact person name must contain only letters and spaces (2-50 characters)");
    }

    if (req.body.phone && !/^\d{10}$/.test(String(req.body.phone).trim())) {
        throw new ApiError(400, "Phone number must be exactly 10 digits");
    }

    if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email.trim())) {
        throw new ApiError(400, "Please provide a valid email address");
    }

    // If email is being changed, check for duplicate
    if (req.body.email && req.body.email !== customer.email) {
        const duplicate = await Customer.findOne({ email: req.body.email });
        if (duplicate) {
            throw new ApiError(409, "Another customer with this email already exists");
        }
    }

    const allowedFields = [
        "companyName", "contactPerson", "email", "phone",
        "gstNumber", "billingAddress", "shippingAddress",
    ];

    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            customer[field] = req.body[field];
        }
    });

    await customer.save();

    return res
        .status(200)
        .json(new ApiResponse(200, customer, "Customer updated successfully"));
});

// ─── TOGGLE CUSTOMER STATUS ───────────────────────────────────────────────────
export const toggleCustomerStatus = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            { isActive: customer.isActive },
            `Customer ${customer.isActive ? "activated" : "deactivated"} successfully`
        )
    );
});
