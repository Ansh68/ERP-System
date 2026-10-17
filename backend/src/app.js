import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const allowedOrigins = [
    process.env.CORS_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
            return callback(null, true);
        }
        // Allow any local development port
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "FloData ERP API is running",
    });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
import authRoutes from "./routes/auth.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import rawMaterialRoutes from "./routes/rawMaterial.routes.js";
import productRoutes from "./routes/product.routes.js";
import salesOrderRoutes from "./routes/salesOrder.routes.js";
import finishedGoodRoutes from "./routes/finishedGood.routes.js";
import inventoryTransactionRoutes from "./routes/inventoryTransaction.routes.js";
import productionPlanRoutes from "./routes/productionPlan.routes.js";
import qualityInspectionRoutes from "./routes/qualityInspection.routes.js";
import dispatchRoutes from "./routes/dispatch.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportRoutes from "./routes/report.routes.js";
import auditLogRoutes from "./routes/auditLog.routes.js";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/raw-materials", rawMaterialRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", salesOrderRoutes);
app.use("/api/v1/finished-goods", finishedGoodRoutes);
app.use("/api/v1/inventory", inventoryTransactionRoutes);
app.use("/api/v1/production-plans", productionPlanRoutes);
app.use("/api/v1/quality-inspections", qualityInspectionRoutes);
app.use("/api/v1/dispatches", dispatchRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/audit-logs", auditLogRoutes);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errors = err.errors || [];

    // Mongoose Validation Error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ");
        errors = Object.values(err.errors).map((val) => val.message);
    }
    // Mongoose Duplicate Key Error
    else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || "Field";
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }
    // Mongoose Invalid ObjectId / CastError
    else if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
});

export default app;