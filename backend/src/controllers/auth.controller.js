import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Cookie options — httpOnly prevents JS access (XSS protection)
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
};

const generateTokens = async (userId) => {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

// ─── REGISTER ───────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        throw new ApiError(400, "All fields are required: name, email, password, role");
    }

    if (!/^[a-zA-Z\s]{2,50}$/.test(name.trim())) {
        throw new ApiError(400, "Name must contain only letters and spaces (2-50 characters)");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw new ApiError(400, "Please provide a valid email address");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    const validRoles = [
        "admin",
        "sales_executive",
        "inventory_manager",
        "production_manager",
        "quality_inspector",
        "dispatch_manager",
    ];
    if (!validRoles.includes(role)) {
        throw new ApiError(400, `Invalid role. Allowed roles: ${validRoles.join(", ")}`);
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    const user = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw new ApiError(400, "Please provide a valid email address");
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
        throw new ApiError(401, "Invalid credentials");
    }

    if (!user.isActive) {
        throw new ApiError(403, "Account is deactivated. Contact admin.");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 10 * 24 * 60 * 60 * 1000 })
        .json(
            new ApiResponse(200, { user: loggedInUser, accessToken }, "Login successful")
        );
});

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },
        { new: true }
    );

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ─── REFRESH ACCESS TOKEN ─────────────────────────────────────────────────────
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token missing");
    }

    let decoded;
    try {
        decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decoded._id);

    if (!user || user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Refresh token mismatch or user not found");
    }

    const { accessToken, refreshToken } = await generateTokens(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 10 * 24 * 60 * 60 * 1000 })
        .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// ─── UPDATE PASSWORD ──────────────────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Both oldPassword and newPassword are required");
    }

    const user = await User.findById(req.user._id);
    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isOldPasswordCorrect) {
        throw new ApiError(400, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// ─── ADMIN: GET ALL USERS ─────────────────────────────────────────────────────
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password -refreshToken").sort({ createdAt: -1 });
    return res
        .status(200)
        .json(new ApiResponse(200, users, "All users fetched"));
});

// ─── ADMIN: TOGGLE USER STATUS ────────────────────────────────────────────────
export const toggleUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isActive: user.isActive },
                `User ${user.isActive ? "activated" : "deactivated"} successfully`
            )
        );
});
