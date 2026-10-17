import { Router } from "express";
import {
    createQualityInspection,
    getAllQualityInspections,
    getQualityInspectionById,
} from "../controllers/qualityInspection.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Create QC Inspection (Quality Inspector & Admin)
router.post(
    "/",
    authorizeRoles("admin", "quality_inspector"),
    createQualityInspection
);

// Get all inspections
router.get(
    "/",
    authorizeRoles("admin", "quality_inspector", "production_manager", "sales_executive"),
    getAllQualityInspections
);

// Get single inspection details
router.get(
    "/:id",
    authorizeRoles("admin", "quality_inspector", "production_manager", "sales_executive"),
    getQualityInspectionById
);

export default router;
