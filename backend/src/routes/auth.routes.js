import { Router } from "express";
import {
    register,
    login,
    logout,
    refreshAccessToken,
    getCurrentUser,
    changePassword,
    getAllUsers,
    toggleUserStatus,
} from "../controllers/auth.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);

// Protected routes (any logged-in user)
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, getCurrentUser);
router.patch("/change-password", verifyJWT, changePassword);

// Admin-only routes
router.get("/users", verifyJWT, authorizeRoles("admin"), getAllUsers);
router.patch("/users/:userId/toggle-status", verifyJWT, authorizeRoles("admin"), toggleUserStatus);

export default router;
