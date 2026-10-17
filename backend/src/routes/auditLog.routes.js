import { Router } from "express";
import {
    getAllAuditLogs,
    getAuditLogById,
} from "../controllers/auditLog.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Admin-only access to audit logs
router.get("/", authorizeRoles("admin"), getAllAuditLogs);
router.get("/:id", authorizeRoles("admin"), getAuditLogById);

export default router;
