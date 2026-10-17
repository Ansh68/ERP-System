import { Router } from "express";
import {
    createRawMaterial,
    getAllRawMaterials,
    getLowStockMaterials,
    getRawMaterialById,
    updateRawMaterial,
    adjustStock,
} from "../controllers/rawMaterial.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// All raw material routes require authentication
router.use(verifyJWT);

// Create raw material (Inventory Manager & Admin)
router.post("/", authorizeRoles("admin", "inventory_manager"), createRawMaterial);

// Low stock materials list (Must precede /:id)
router.get(
    "/low-stock",
    authorizeRoles("admin", "inventory_manager", "production_manager"),
    getLowStockMaterials
);

// Get all raw materials (Admin, Inventory, Production)
router.get(
    "/",
    authorizeRoles("admin", "inventory_manager", "production_manager"),
    getAllRawMaterials
);

// Get single raw material by ID
router.get(
    "/:id",
    authorizeRoles("admin", "inventory_manager", "production_manager"),
    getRawMaterialById
);

// Update raw material (Inventory Manager & Admin)
router.patch("/:id", authorizeRoles("admin", "inventory_manager"), updateRawMaterial);

// Adjust stock (positive/negative) (Inventory Manager & Admin)
router.post("/:id/adjust-stock", authorizeRoles("admin", "inventory_manager"), adjustStock);

export default router;
