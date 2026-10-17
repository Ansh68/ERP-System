import { Router } from "express";
import {
    getSalesReport,
    getInventoryReport,
    getProductionReport,
    getMaterialConsumptionReport,
    getDispatchReport,
    getLowStockReport,
} from "../controllers/report.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Sales Report
router.get(
    "/sales",
    authorizeRoles("admin", "sales_executive"),
    getSalesReport
);

// Inventory Report
router.get(
    "/inventory",
    authorizeRoles("admin", "inventory_manager", "production_manager"),
    getInventoryReport
);

// Production Report
router.get(
    "/production",
    authorizeRoles("admin", "production_manager"),
    getProductionReport
);

// Material Consumption Report
router.get(
    "/material-consumption",
    authorizeRoles("admin", "inventory_manager", "production_manager"),
    getMaterialConsumptionReport
);

// Dispatch Report
router.get(
    "/dispatch",
    authorizeRoles("admin", "dispatch_manager", "sales_executive"),
    getDispatchReport
);

// Low Stock Report
router.get(
    "/low-stock",
    authorizeRoles("admin", "inventory_manager", "production_manager"),
    getLowStockReport
);

export default router;
