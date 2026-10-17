import { Router } from "express";
import {
    createFinishedGood,
    getAllFinishedGoods,
    getFinishedGoodById,
    adjustFinishedGoodStock,
} from "../controllers/finishedGood.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Create Finished Goods batch (Inventory & Admin)
router.post("/", authorizeRoles("admin", "inventory_manager"), createFinishedGood);

// List Finished Goods batches
router.get(
    "/",
    authorizeRoles("admin", "inventory_manager", "sales_executive", "dispatch_manager", "production_manager"),
    getAllFinishedGoods
);

// Get single batch details
router.get(
    "/:id",
    authorizeRoles("admin", "inventory_manager", "sales_executive", "dispatch_manager", "production_manager"),
    getFinishedGoodById
);

// Adjust batch stock
router.post("/:id/adjust-stock", authorizeRoles("admin", "inventory_manager"), adjustFinishedGoodStock);

export default router;
