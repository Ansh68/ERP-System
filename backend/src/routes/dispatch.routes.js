import { Router } from "express";
import {
    createDispatch,
    getAllDispatches,
    getDispatchById,
    trackShipment,
    simulateCarrierProgress,
    markOrderAsDelivered,
} from "../controllers/dispatch.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// Public / open tracking route (track by tracking number)
router.get("/track/:trackingNumber", trackShipment);

// All other dispatch routes require authentication
router.use(verifyJWT);

// Create dispatch / shipment (Dispatch Manager & Admin)
router.post(
    "/",
    authorizeRoles("admin", "dispatch_manager"),
    createDispatch
);

// Get all dispatches
router.get(
    "/",
    authorizeRoles("admin", "dispatch_manager", "sales_executive", "inventory_manager"),
    getAllDispatches
);

// Get single dispatch details
router.get(
    "/:id",
    authorizeRoles("admin", "dispatch_manager", "sales_executive"),
    getDispatchById
);

// Simulate next carrier milestone event (Fake Carrier Service)
router.post(
    "/:id/simulate-progress",
    authorizeRoles("admin", "dispatch_manager"),
    simulateCarrierProgress
);

// Direct delivery confirmation
router.post(
    "/:id/deliver",
    authorizeRoles("admin", "dispatch_manager"),
    markOrderAsDelivered
);

export default router;
