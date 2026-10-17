import { Router } from "express";
import { getAllInventoryTransactions } from "../controllers/inventoryTransaction.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// View transaction audit log
router.get(
    "/transactions",
    authorizeRoles("admin", "inventory_manager", "production_manager"),
    getAllInventoryTransactions
);

export default router;
