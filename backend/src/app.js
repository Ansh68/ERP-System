import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
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
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
});

export default app;