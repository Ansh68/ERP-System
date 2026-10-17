import { Router } from "express";
import {
    createProductionPlan,
    getAllProductionPlans,
    getProductionPlanById,
    updateProductionPlan,
    updateProductionStage,
} from "../controllers/productionPlan.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Create production plan (Production Manager & Admin)
router.post(
    "/",
    authorizeRoles("admin", "production_manager"),
    createProductionPlan
);

// List production plans (Operational visibility across departments)
router.get(
    "/",
    authorizeRoles("admin", "production_manager", "inventory_manager", "sales_executive", "quality_inspector"),
    getAllProductionPlans
);

// Get production plan details
router.get(
    "/:id",
    authorizeRoles("admin", "production_manager", "inventory_manager", "sales_executive", "quality_inspector"),
    getProductionPlanById
);

// Update plan details (machine, shift, dates)
router.patch(
    "/:id",
    authorizeRoles("admin", "production_manager"),
    updateProductionPlan
);

// Update manufacturing stage (material_issued, manufacturing, assembly, packaging, completed)
router.post(
    "/:id/update-stage",
    authorizeRoles("admin", "production_manager"),
    updateProductionStage
);

export default router;
