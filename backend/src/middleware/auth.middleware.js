import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Verifies JWT from Authorization header or cookie
export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized: No token provided");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw new ApiError(401, "Unauthorized: Invalid or expired token");
    }

    const user = await User.findById(decoded._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(401, "Unauthorized: User not found");
    }

    if (!user.isActive) {
        throw new ApiError(403, "Forbidden: Account is deactivated");
    }

    req.user = user;
    next();
});

// Restricts access to specific roles
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            throw new ApiError(
                403,
                `Forbidden: Role '${req.user?.role}' is not allowed to access this resource`
            );
        }
        next();
    };
};
