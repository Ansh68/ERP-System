import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Get real-time dashboard KPIs and business statistics
router.get("/metrics", getDashboardMetrics);

export default router;
