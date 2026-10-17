import { Router } from "express";
import {
    createSalesOrder,
    getAllSalesOrders,
    getSalesOrderById,
    updateSalesOrder,
    cancelSalesOrder,
    approveAndValidateOrder,
} from "../controllers/salesOrder.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Create order (Sales Executive & Admin)
router.post("/", authorizeRoles("admin", "sales_executive"), createSalesOrder);

// List orders (All operational roles need visibility)
router.get(
    "/",
    authorizeRoles("admin", "sales_executive", "production_manager", "inventory_manager", "dispatch_manager"),
    getAllSalesOrders
);

// Get order details
router.get(
    "/:id",
    authorizeRoles("admin", "sales_executive", "production_manager", "inventory_manager", "dispatch_manager"),
    getSalesOrderById
);

// Update draft order
router.patch("/:id", authorizeRoles("admin", "sales_executive"), updateSalesOrder);

// Cancel order and release reservations
router.post("/:id/cancel", authorizeRoles("admin", "sales_executive"), cancelSalesOrder);

// Approve order & trigger automated Inventory Validation & MRP
router.post("/:id/approve", authorizeRoles("admin", "sales_executive"), approveAndValidateOrder);

export default router;
