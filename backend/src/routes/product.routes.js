import { Router } from "express";
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    getCategories,
    calculateMRP,
} from "../controllers/product.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// All product routes require authentication
router.use(verifyJWT);

// Create product with BOM (Production Manager & Admin)
router.post("/", authorizeRoles("admin", "production_manager"), createProduct);

// Get distinct product categories (Must precede /:id)
router.get(
    "/categories",
    authorizeRoles("admin", "production_manager", "sales_executive"),
    getCategories
);

// Get all products with search & category filter (Admin, Production, Sales, Inventory)
router.get(
    "/",
    authorizeRoles("admin", "production_manager", "sales_executive", "inventory_manager"),
    getAllProducts
);

// Get single product by ID (populated BOM)
router.get(
    "/:id",
    authorizeRoles("admin", "production_manager", "sales_executive", "inventory_manager"),
    getProductById
);

// Update product or BOM (Production Manager & Admin)
router.patch("/:id", authorizeRoles("admin", "production_manager"), updateProduct);

// MRP preview: calculate raw material needs & identify shortages for a target quantity
router.get(
    "/:id/mrp",
    authorizeRoles("admin", "production_manager", "sales_executive"),
    calculateMRP
);

export default router;
