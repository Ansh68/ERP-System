import { Router } from "express";
import {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    toggleCustomerStatus,
} from "../controllers/customer.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// All customer routes require authentication
router.use(verifyJWT);

// Create customer (Sales & Admin)
router.post("/", authorizeRoles("admin", "sales_executive"), createCustomer);

// Get all customers with pagination & search (Admin, Sales, Dispatch)
router.get(
    "/",
    authorizeRoles("admin", "sales_executive", "dispatch_manager"),
    getAllCustomers
);

// Get single customer details
router.get(
    "/:id",
    authorizeRoles("admin", "sales_executive", "dispatch_manager"),
    getCustomerById
);

// Update customer details (Sales & Admin)
router.patch("/:id", authorizeRoles("admin", "sales_executive"), updateCustomer);

// Toggle active/inactive status (Sales & Admin)
router.patch(
    "/:id/toggle-status",
    authorizeRoles("admin", "sales_executive"),
    toggleCustomerStatus
);

export default router;
