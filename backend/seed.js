import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Models
import User from "./src/models/user.model.js";
import Customer from "./src/models/customer.model.js";
import RawMaterial from "./src/models/rawMaterial.model.js";
import Product from "./src/models/product.model.js";
import FinishedGood from "./src/models/finishedGood.model.js";
import SalesOrder from "./src/models/salesOrder.model.js";
import ProductionPlan from "./src/models/productionPlan.model.js";
import QualityInspection from "./src/models/qualityInspection.model.js";
import Dispatch from "./src/models/dispatch.model.js";
import InventoryTransaction from "./src/models/inventoryTransaction.model.js";
import AuditLog from "./src/models/auditLog.model.js";
import { generateTrackingNumber, createInitialCarrierEvents } from "./src/services/carrier.service.js";

dotenv.config({ path: ".env" });

const SEED_CONFIG = {
    TOTAL_SKUS: 100,
    TOTAL_ORDERS: 1000,
    DISPATCHED_ORDERS: 800,
};

// ─── 1. MONGODB CONNECTION ────────────────────────────────────────────────────
const connect = async () => {
    const uri = process.env.MONGODB_URI.replace(/\/$/, "");
    await mongoose.connect(`${uri}/${process.env.DB_NAME}`);
    console.log("Connected to MongoDB for seeding.");
};

// ─── 2. SEED USERS (6 ROLES) ──────────────────────────────────────────────────
const seedUsers = async () => {
    console.log("Seeding Users (6 roles)...");
    const hashedPassword = await bcrypt.hash("Password@123", 10);

    const usersData = [
        { name: "System Admin", email: "admin@flodata.com", role: "admin" },
        { name: "Parul Sharma", email: "sales@flodata.com", role: "sales_executive" },
        { name: "Keshav Gupta", email: "inventory@flodata.com", role: "inventory_manager" },
        { name: "Piyush Patel", email: "production@flodata.com", role: "production_manager" },
        { name: "Aarti Singh", email: "qc@flodata.com", role: "quality_inspector" },
        { name: "Manish", email: "dispatch@flodata.com", role: "dispatch_manager" },
    ].map((u) => ({
        ...u,
        password: hashedPassword,
        isActive: true,
    }));

    await User.deleteMany({});
    const users = await User.insertMany(usersData);

    const userMap = {};
    users.forEach((u) => {
        userMap[u.role] = u;
    });

    return userMap;
};

// ─── 3. SEED CUSTOMERS (25 B2B CLIENTS) ───────────────────────────────────────
const seedCustomers = async (adminUser) => {
    console.log("Seeding Customers (25 B2B clients)...");
    const cities = [
        { city: "Mumbai", state: "Maharashtra", pin: "400001" },
        { city: "Pune", state: "Maharashtra", pin: "411001" },
        { city: "Bangalore", state: "Karnataka", pin: "560001" },
        { city: "Delhi", state: "Delhi", pin: "110001" },
        { city: "Gurgaon", state: "Haryana", pin: "122001" },
        { city: "Ahmedabad", state: "Gujarat", pin: "380001" },
        { city: "Hyderabad", state: "Telangana", pin: "500001" },
        { city: "Chennai", state: "Tamil Nadu", pin: "600001" },
    ];

    const companyNames = [
        "Apex Corporate Solutions", "Zenith Workspace Design", "Nexus Enterprise Hub",
        "Regal Office Interiors", "Titan Industrial Supplies", "Horizon Coworking Spaces",
        "Vanguard Retail Chains", "Paramount Tech Campuses", "Metro Modular Systems",
        "Pinnacle Commercial Outfits", "BlueStar Furnishings", "Summit Architecture Labs",
        "Matrix Workspace Providers", "Sterling Corporate Furnishings", "Kalyan Commercial Corp",
        "Orbit Infrastructure Pvt Ltd", "Falcon Engineering Hub", "Global Logistics Towers",
        "Prestige Business Centers", "Emerald IT Parks", "AeroTech Headquarters",
        "Prime Property Developers", "Urban Nest Studios", "Grandview Hotels & Resorts",
        "Starlight Healthcare Systems",
    ];

    const customersData = companyNames.map((name, i) => {
        const loc = cities[i % cities.length];
        return {
            companyName: name,
            contactPerson: `Manager ${name.split(" ")[0]}`,
            email: `contact@${name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
            phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
            gstNumber: `27AAACA${Math.floor(1000 + Math.random() * 9000)}A1Z${(i % 9) + 1}`,
            billingAddress: {
                street: `Plot ${i + 10}, Phase ${((i % 4) + 1)}, Industrial Zone`,
                city: loc.city,
                state: loc.state,
                pincode: loc.pin,
                country: "India",
            },
            shippingAddress: {
                street: `Warehouse Block ${String.fromCharCode(65 + (i % 6))}, Logistics Park`,
                city: loc.city,
                state: loc.state,
                pincode: loc.pin,
                country: "India",
            },
            isActive: true,
            createdBy: adminUser._id,
        };
    });

    await Customer.deleteMany({});
    return await Customer.insertMany(customersData);
};

// ─── 4. SEED RAW MATERIALS (30 MATERIALS) ────────────────────────────────────
const seedRawMaterials = async () => {
    console.log("Seeding Raw Materials (30 materials)...");
    const materialsData = [
        // Metals & Tubes
        { materialCode: "RM-STL-01", name: "Steel Tube 25mm Round", unit: "meter", currentStock: 15000, minimumStockLevel: 2000, reorderLevel: 3000, unitPrice: 85, warehouse: "Bay A - Metals" },
        { materialCode: "RM-STL-02", name: "Steel Tube 50mm Square", unit: "meter", currentStock: 12000, minimumStockLevel: 1500, reorderLevel: 2500, unitPrice: 140, warehouse: "Bay A - Metals" },
        { materialCode: "RM-ALU-01", name: "Aluminum Sheet 2mm", unit: "meter", currentStock: 8000, minimumStockLevel: 1000, reorderLevel: 1800, unitPrice: 320, warehouse: "Bay A - Metals" },
        { materialCode: "RM-IRON-01", name: "Cast Iron Base Weighted", unit: "pcs", currentStock: 5000, minimumStockLevel: 600, reorderLevel: 1000, unitPrice: 450, warehouse: "Bay A - Metals" },
        { materialCode: "RM-CHR-01", name: "Chrome Star Base 5-Spoke", unit: "pcs", currentStock: 4500, minimumStockLevel: 800, reorderLevel: 1200, unitPrice: 380, warehouse: "Bay A - Metals" },

        // Wood & Boards
        { materialCode: "RM-PLY-01", name: "Commercial Plywood 18mm", unit: "meter", currentStock: 9000, minimumStockLevel: 1200, reorderLevel: 2000, unitPrice: 280, warehouse: "Bay B - Wood" },
        { materialCode: "RM-MDF-01", name: "Pre-laminated MDF 25mm", unit: "meter", currentStock: 11000, minimumStockLevel: 1500, reorderLevel: 2500, unitPrice: 350, warehouse: "Bay B - Wood" },
        { materialCode: "RM-TEAK-01", name: "Teak Hardwood Slats", unit: "meter", currentStock: 4000, minimumStockLevel: 500, reorderLevel: 1000, unitPrice: 520, warehouse: "Bay B - Wood" },
        { materialCode: "RM-OAK-01", name: "Veneer Oak Top Sheet", unit: "meter", currentStock: 3500, minimumStockLevel: 400, reorderLevel: 800, unitPrice: 420, warehouse: "Bay B - Wood" },
        { materialCode: "RM-EDGE-01", name: "PVC Edge Banding Tape 2mm", unit: "roll", currentStock: 500, minimumStockLevel: 80, reorderLevel: 150, unitPrice: 650, warehouse: "Bay B - Wood" },

        // Hardware & Mechanisms
        { materialCode: "RM-SCR-01", name: "Wood Screw M4x25mm", unit: "pcs", currentStock: 150000, minimumStockLevel: 20000, reorderLevel: 40000, unitPrice: 1.5, warehouse: "Bay C - Hardware" },
        { materialCode: "RM-BLT-01", name: "High Tensile Bolt M8x40mm", unit: "pcs", currentStock: 80000, minimumStockLevel: 10000, reorderLevel: 25000, unitPrice: 4.2, warehouse: "Bay C - Hardware" },
        { materialCode: "RM-GAS-01", name: "Class-4 Gas Lift Cylinder", unit: "pcs", currentStock: 4000, minimumStockLevel: 600, reorderLevel: 1200, unitPrice: 350, warehouse: "Bay C - Hardware" },
        { materialCode: "RM-CST-01", name: "Nylon Twin Caster Wheels", unit: "set", currentStock: 6000, minimumStockLevel: 800, reorderLevel: 1500, unitPrice: 180, warehouse: "Bay C - Hardware" },
        { materialCode: "RM-TIL-01", name: "Synchro Tilt Mechanism", unit: "pcs", currentStock: 3500, minimumStockLevel: 500, reorderLevel: 1000, unitPrice: 650, warehouse: "Bay C - Hardware" },
        { materialCode: "RM-HNG-01", name: "Soft Close Cabinet Hinge", unit: "pcs", currentStock: 25000, minimumStockLevel: 3000, reorderLevel: 6000, unitPrice: 45, warehouse: "Bay C - Hardware" },
        { materialCode: "RM-SLD-01", name: "Telescopic Drawer Slider 450mm", unit: "set", currentStock: 8000, minimumStockLevel: 1000, reorderLevel: 2000, unitPrice: 220, warehouse: "Bay C - Hardware" },
        { materialCode: "RM-LCK-01", name: "Central Locking Cam Lock", unit: "pcs", currentStock: 7000, minimumStockLevel: 900, reorderLevel: 1800, unitPrice: 110, warehouse: "Bay C - Hardware" },

        // Upholstery & Foam
        { materialCode: "RM-FOM-01", name: "High Density Molded Foam 40D", unit: "pcs", currentStock: 6500, minimumStockLevel: 1000, reorderLevel: 2000, unitPrice: 240, warehouse: "Bay D - Upholstery" },
        { materialCode: "RM-MSH-01", name: "Breathable Nylon Back Mesh", unit: "meter", currentStock: 5000, minimumStockLevel: 800, reorderLevel: 1500, unitPrice: 190, warehouse: "Bay D - Upholstery" },
        { materialCode: "RM-LTH-01", name: "PU Leatherette Fabric Black", unit: "meter", currentStock: 6000, minimumStockLevel: 1000, reorderLevel: 1800, unitPrice: 310, warehouse: "Bay D - Upholstery" },
        { materialCode: "RM-VLV-01", name: "Premium Velvet Fabric Grey", unit: "meter", currentStock: 4500, minimumStockLevel: 600, reorderLevel: 1200, unitPrice: 380, warehouse: "Bay D - Upholstery" },
        { materialCode: "RM-ARM-01", name: "3D Adjustable Armrest Set", unit: "set", currentStock: 5000, minimumStockLevel: 700, reorderLevel: 1400, unitPrice: 420, warehouse: "Bay D - Upholstery" },

        // Finishing & Paints
        { materialCode: "RM-PNT-01", name: "Epoxy Powder Coat Black", unit: "kg", currentStock: 2500, minimumStockLevel: 400, reorderLevel: 800, unitPrice: 175, warehouse: "Bay E - Finishing" },
        { materialCode: "RM-PNT-02", name: "Polyurethane Clear Lacquer", unit: "ltr", currentStock: 1800, minimumStockLevel: 300, reorderLevel: 600, unitPrice: 260, warehouse: "Bay E - Finishing" },
        { materialCode: "RM-GLU-01", name: "Industrial Laminate Adhesive", unit: "kg", currentStock: 3000, minimumStockLevel: 500, reorderLevel: 900, unitPrice: 145, warehouse: "Bay E - Finishing" },

        // Packaging Materials
        { materialCode: "RM-PKG-01", name: "Corrugated Box Heavy Duty (L)", unit: "pcs", currentStock: 12000, minimumStockLevel: 2000, reorderLevel: 4000, unitPrice: 95, warehouse: "Bay F - Packaging" },
        { materialCode: "RM-PKG-02", name: "Corrugated Box Compact (M)", unit: "pcs", currentStock: 18000, minimumStockLevel: 2500, reorderLevel: 5000, unitPrice: 65, warehouse: "Bay F - Packaging" },
        { materialCode: "RM-PKG-03", name: "Air Bubble Wrap Roll 100m", unit: "roll", currentStock: 800, minimumStockLevel: 120, reorderLevel: 250, unitPrice: 750, warehouse: "Bay F - Packaging" },
        { materialCode: "RM-PKG-04", name: "Corner Protection Foam Caps", unit: "pcs", currentStock: 40000, minimumStockLevel: 5000, reorderLevel: 10000, unitPrice: 8, warehouse: "Bay F - Packaging" },
    ];

    await RawMaterial.deleteMany({});
    return await RawMaterial.insertMany(materialsData);
};

// ─── 5. SEED PRODUCTS & BOMS (~100 SKUs) ──────────────────────────────────────
const seedProducts = async (rawMaterials, adminUser) => {
    console.log("Seeding Products (100 distinct SKUs with BOMs)...");
    const rmMap = {};
    rawMaterials.forEach((rm) => {
        rmMap[rm.materialCode] = rm;
    });

    const categories = [
        {
            name: "Office Chairs",
            prefix: "CHAIR",
            basePrice: 4200,
            models: [
                "Ergonomic Task", "Executive Leather", "Mesh High-Back", "Conference Swivel",
                "Drafting Stool", "Visitor Sled", "Operator Low-Back", "Orthopedic Lumbar",
                "Gaming Pro", "Synchro Heavy Duty", "Compact Flex", "Active Balance",
                "Director Deluxe", "Boardroom Elite", "Cantilever Guest", "Breathable Mid-Back",
                "Zero Gravity", "Reception Armchair", "Steno Typing", "Multi-shift 24/7",
            ],
            bomBuilder: () => [
                { rawMaterial: rmMap["RM-STL-01"]._id, quantity: 2.2, unit: "meter" },
                { rawMaterial: rmMap["RM-GAS-01"]._id, quantity: 1, unit: "pcs" },
                { rawMaterial: rmMap["RM-CST-01"]._id, quantity: 1, unit: "set" },
                { rawMaterial: rmMap["RM-FOM-01"]._id, quantity: 1, unit: "pcs" },
                { rawMaterial: rmMap["RM-MSH-01"]._id, quantity: 1.5, unit: "meter" },
                { rawMaterial: rmMap["RM-SCR-01"]._id, quantity: 16, unit: "pcs" },
                { rawMaterial: rmMap["RM-PKG-02"]._id, quantity: 1, unit: "pcs" },
            ],
        },
        {
            name: "Desks & Workstations",
            prefix: "DESK",
            basePrice: 8500,
            models: [
                "Modular Single", "L-Shaped Executive", "Electric Height-Adjustable", "Dual Pod Workstation",
                "4-Way Cluster", "6-Way Call Center", "Managerial Solid Oak", "Compact Home Office",
                "Reception Front Desk", "Meeting Table Desk", "Corner Wedge Desk", "Folding Training",
                "Linear Bench Desk", "C-Leg Sturdy", "Steel Frame Tech", "Glass Inset Modern",
                "Acoustic Partitioned", "Collaborative Island", "Study Carrel", "Mobile Workstation",
            ],
            bomBuilder: () => [
                { rawMaterial: rmMap["RM-MDF-01"]._id, quantity: 2.8, unit: "meter" },
                { rawMaterial: rmMap["RM-STL-02"]._id, quantity: 4.5, unit: "meter" },
                { rawMaterial: rmMap["RM-EDGE-01"]._id, quantity: 0.1, unit: "roll" },
                { rawMaterial: rmMap["RM-BLT-01"]._id, quantity: 24, unit: "pcs" },
                { rawMaterial: rmMap["RM-PNT-01"]._id, quantity: 1.8, unit: "kg" },
                { rawMaterial: rmMap["RM-PKG-01"]._id, quantity: 1, unit: "pcs" },
            ],
        },
        {
            name: "Storage & Cabinets",
            prefix: "STOR",
            basePrice: 6200,
            models: [
                "Mobile Pedestal 3-Drawer", "Lateral Filing 4-Tier", "Steel Locker 6-Door", "Tambour Door Credenza",
                "Glass Door Bookcase", "Heavy Duty Metal Almirah", "Under-Desk Caddy", "Plan File Archive",
                "Wardrobe Modular", "Supply Storage Cabinet", "Fire-Resistant Safe Box", "Open Utility Shelving",
                "Pigeon Hole Organizer", "Sliding Door Unit", "Overhead Hutch", "Tower Storage Pullout",
                "Blueprint Flat File", "Personal Locker 4-Tier", "Pedestal Cushion Top", "Tambour Low Credenza",
            ],
            bomBuilder: () => [
                { rawMaterial: rmMap["RM-ALU-01"]._id, quantity: 3.5, unit: "meter" },
                { rawMaterial: rmMap["RM-SLD-01"]._id, quantity: 3, unit: "set" },
                { rawMaterial: rmMap["RM-LCK-01"]._id, quantity: 1, unit: "pcs" },
                { rawMaterial: rmMap["RM-BLT-01"]._id, quantity: 18, unit: "pcs" },
                { rawMaterial: rmMap["RM-PNT-01"]._id, quantity: 2.2, unit: "kg" },
                { rawMaterial: rmMap["RM-PKG-01"]._id, quantity: 1, unit: "pcs" },
            ],
        },
        {
            name: "Industrial & Workshop",
            prefix: "IND",
            basePrice: 11500,
            models: [
                "Heavy Duty Steel Workbench", "Cantilever Material Rack", "ESD Safe Electronic Assembly", "Mobile Tool Trolley",
                "Pallet Stacking Stand", "Industrial Assembly Bench", "Packing Station Table", "Cleanroom Stainless Table",
                "Die & Mold Storage Rack", "Machine Operator Stand", "Chemical Storage Cabinet", "Sheet Metal Storage",
                "Maintenance Work Bench", "Inspection Quality Table", "Conveyor Feed Table", "Soldering Workstation",
                "Drafting Tilt Table", "Welding Guard Bench", "Drum Containment Pallet", "Tool Cabinet 7-Drawer",
            ],
            bomBuilder: () => [
                { rawMaterial: rmMap["RM-STL-02"]._id, quantity: 7.5, unit: "meter" },
                { rawMaterial: rmMap["RM-IRON-01"]._id, quantity: 2, unit: "pcs" },
                { rawMaterial: rmMap["RM-BLT-01"]._id, quantity: 36, unit: "pcs" },
                { rawMaterial: rmMap["RM-PNT-01"]._id, quantity: 3.5, unit: "kg" },
                { rawMaterial: rmMap["RM-PKG-01"]._id, quantity: 2, unit: "pcs" },
            ],
        },
        {
            name: "Conference & Seating",
            prefix: "CONF",
            basePrice: 14800,
            models: [
                "Boardroom Table 12-Seater", "Conference Boat-Shape 8-Seater", "Round Discussion Table", "Auditorium Tip-Up Chair",
                "Modular Training Table", "Breakout Lounge Sofa 3-Seater", "Ottoman Bench Seating", "Bar Height Cafe Table",
                "Stackable Banquet Chair", "Acoustic High-Back Pod", "Media Wall Conference Table", "Executive Meeting Oval",
                "Reception Waiting Bench", "Tub Chair Velvet", "Booth Seating Upholstered", "Coffee Lounge Table",
                "Lectern Presentation Podium", "Video Conference V-Table", "Club Armchair Leather", "Bar Stool Swivel",
            ],
            bomBuilder: () => [
                { rawMaterial: rmMap["RM-MDF-01"]._id, quantity: 4.5, unit: "meter" },
                { rawMaterial: rmMap["RM-STL-01"]._id, quantity: 5.0, unit: "meter" },
                { rawMaterial: rmMap["RM-VLV-01"]._id, quantity: 3.0, unit: "meter" },
                { rawMaterial: rmMap["RM-GLU-01"]._id, quantity: 2.0, unit: "kg" },
                { rawMaterial: rmMap["RM-BLT-01"]._id, quantity: 32, unit: "pcs" },
                { rawMaterial: rmMap["RM-PKG-01"]._id, quantity: 2, unit: "pcs" },
            ],
        },
    ];

    const productsData = [];
    let skuCount = 1;

    for (const cat of categories) {
        for (let i = 0; i < cat.models.length; i++) {
            const codeNum = String(skuCount).padStart(3, "0");
            const productCode = `PRD-${cat.prefix}-${codeNum}`;
            const priceVariance = Math.floor(Math.random() * 8) * 250;
            const unitSellingPrice = cat.basePrice + priceVariance;

            productsData.push({
                productCode,
                name: `${cat.models[i]} (${cat.prefix}-${codeNum})`,
                category: cat.name,
                description: `High-durability commercial grade ${cat.models[i].toLowerCase()} engineered for modern workspaces.`,
                unitSellingPrice,
                bom: cat.bomBuilder(),
                isActive: true,
                createdBy: adminUser._id,
            });

            skuCount++;
        }
    }

    await Product.deleteMany({});
    return await Product.insertMany(productsData);
};

// ─── 6. SEED ORDERS, PRODUCTION, QC & DISPATCHES (1,000 ORDERS) ──────────────
const seedOrdersAndLifecycle = async (users, customers, products, rawMaterials) => {
    console.log("Seeding 1,000 Sales Orders, Dispatches, Production Runs & History...");

    await SalesOrder.deleteMany({});
    await ProductionPlan.deleteMany({});
    await QualityInspection.deleteMany({});
    await FinishedGood.deleteMany({});
    await Dispatch.deleteMany({});
    await InventoryTransaction.deleteMany({});
    await AuditLog.deleteMany({});

    const salesUser = users["sales_executive"];
    const prodUser = users["production_manager"];
    const qcUser = users["quality_inspector"];
    const dispatchUser = users["dispatch_manager"];
    const inventoryUser = users["inventory_manager"];

    // Target Status Distribution for 1,000 Orders:
    // 650: delivered (dispatched + completed delivery confirmation)
    // 150: dispatched (in transit / out for delivery)
    //  35: ready_for_dispatch
    //  30: quality_check
    //  40: in_production
    //  30: production_planned
    //  25: approved
    //  25: draft
    //  15: cancelled
    // Total = 1,000 orders (800 dispatched/delivered)

    const distribution = [
        { status: "delivered", count: 650 },
        { status: "dispatched", count: 150 },
        { status: "ready_for_dispatch", count: 35 },
        { status: "quality_check", count: 30 },
        { status: "in_production", count: 40 },
        { status: "production_planned", count: 30 },
        { status: "approved", count: 25 },
        { status: "draft", count: 25 },
        { status: "cancelled", count: 15 },
    ];

    const couriers = ["FloData Express", "BlueDart", "Delhivery", "FedEx", "DTDC"];
    const machines = ["CNC Line 01", "Extruder Press A", "Assembly Station 4", "Powder Coating Line 2", "Robotic Welder 3"];
    const shifts = ["morning", "afternoon", "night"];

    const ordersToInsert = [];
    const plansToInsert = [];
    const qcsToInsert = [];
    const dispatchesToInsert = [];
    const transactionsToInsert = [];
    const fgBatchesToInsert = [];
    const auditLogsToInsert = [];

    let orderIndex = 1;
    const now = new Date();

    for (const dist of distribution) {
        for (let i = 0; i < dist.count; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const product = products[Math.floor(Math.random() * products.length)];
            const orderQty = Math.floor(2 + Math.random() * 25);
            const unitPrice = product.unitSellingPrice;
            const totalPrice = unitPrice * orderQty;

            // Generate realistic historical dates based on status
            const daysAgo = dist.status === "delivered"
                ? Math.floor(10 + Math.random() * 80)
                : dist.status === "dispatched"
                    ? Math.floor(1 + Math.random() * 8)
                    : Math.floor(Math.random() * 15);

            const createdAt = new Date(now.getTime() - daysAgo * 24 * 3600 * 1000);
            const expectedDelivery = new Date(createdAt.getTime() + 14 * 24 * 3600 * 1000);

            const orderId = new mongoose.Types.ObjectId();
            const orderNumber = `SO-${createdAt.toISOString().slice(0, 10).replace(/-/g, "")}-${String(orderIndex).padStart(4, "0")}`;

            // Build status history
            const statusHistory = [
                {
                    status: "draft",
                    changedBy: salesUser._id,
                    changedAt: createdAt,
                    note: "Order created by Sales Executive",
                },
            ];

            if (dist.status !== "draft") {
                statusHistory.push({
                    status: "approved",
                    changedBy: salesUser._id,
                    changedAt: new Date(createdAt.getTime() + 2 * 3600 * 1000),
                    note: "Order approved by Sales",
                });
            }

            // ─── CASE: DISPATCHED OR DELIVERED (800 ORDERS) ───────────────────
            if (dist.status === "delivered" || dist.status === "dispatched") {
                const isDelivered = dist.status === "delivered";
                const dispatchDate = new Date(createdAt.getTime() + 5 * 24 * 3600 * 1000);
                const deliveredDate = isDelivered ? new Date(dispatchDate.getTime() + 3 * 24 * 3600 * 1000) : null;

                const courier = couriers[Math.floor(Math.random() * couriers.length)];
                const trackingNumber = generateTrackingNumber(courier);
                const dispatchNumber = `DSP-${dispatchDate.toISOString().slice(0, 10).replace(/-/g, "")}-${String(orderIndex).padStart(4, "0")}`;
                const invoiceNumber = `INV-${dispatchDate.toISOString().slice(0, 10).replace(/-/g, "")}-${String(orderIndex).padStart(4, "0")}`;
                const batchNumber = `BAT-${orderNumber.slice(-8)}`;

                statusHistory.push(
                    { status: "production_planned", changedBy: prodUser._id, changedAt: new Date(createdAt.getTime() + 4 * 3600 * 1000), note: "Production planned" },
                    { status: "in_production", changedBy: prodUser._id, changedAt: new Date(createdAt.getTime() + 24 * 3600 * 1000), note: "Materials issued. In production." },
                    { status: "quality_check", changedBy: prodUser._id, changedAt: new Date(createdAt.getTime() + 3 * 24 * 3600 * 1000), note: "Manufacturing completed. Sent to QC." },
                    { status: "ready_for_dispatch", changedBy: qcUser._id, changedAt: new Date(createdAt.getTime() + 4 * 24 * 3600 * 1000), note: "QC passed. Batch received." },
                    { status: "dispatched", changedBy: dispatchUser._id, changedAt: dispatchDate, note: `Shipped via ${courier}. Tracking: ${trackingNumber}` }
                );

                if (isDelivered) {
                    statusHistory.push({
                        status: "delivered",
                        changedBy: dispatchUser._id,
                        changedAt: deliveredDate,
                        note: "Delivery confirmed and signed by customer recipient.",
                    });
                }

                // Carrier events timeline
                const carrierEvents = createInitialCarrierEvents(courier, "Mumbai", customer.shippingAddress.city);
                if (isDelivered) {
                    carrierEvents.push(
                        { status: "out_for_delivery", location: `${customer.shippingAddress.city} Hub`, timestamp: new Date(deliveredDate.getTime() - 4 * 3600000), description: "Out for delivery with driver." },
                        { status: "delivered", location: customer.shippingAddress.city, timestamp: deliveredDate, description: "Delivered to customer reception." }
                    );
                } else {
                    carrierEvents.push({
                        status: "in_transit",
                        location: `En route to ${customer.shippingAddress.city}`,
                        timestamp: new Date(dispatchDate.getTime() + 12 * 3600000),
                        description: "Consignment in transit between sorting facilities.",
                    });
                }

                // Dispatch record
                const dispatchId = new mongoose.Types.ObjectId();
                dispatchesToInsert.push({
                    _id: dispatchId,
                    dispatchNumber,
                    salesOrder: orderId,
                    customer: customer._id,
                    invoiceNumber,
                    dispatchDate,
                    items: [{ product: product._id, batchNumber, quantity: orderQty }],
                    vehicle: `MH-04-TR-${Math.floor(1000 + Math.random() * 9000)}`,
                    driver: {
                        name: [
                            "Rajesh Kumar", "Suresh Sharma", "Ramesh Verma", "Anil Yadav", "Sunil Singh",
                            "Vikram Patel", "Manoj Tiwari", "Dinesh Gupta", "Ajay Chauhan", "Vijay Joshi",
                            "Mukesh Das", "Prakash Mishra", "Sanjay Rawat", "Deepak Rao", "Ashok Nair"
                        ][orderIndex % 15],
                        phone: `98200${Math.floor(10000 + Math.random() * 90000)}`
                    },
                    courier,
                    trackingNumber,
                    shippingAddress: customer.shippingAddress,
                    status: isDelivered ? "delivered" : "in_transit",
                    carrierEvents,
                    deliveredAt: deliveredDate,
                    dispatchedBy: dispatchUser._id,
                    remarks: `Standard delivery to ${customer.companyName}`,
                    createdAt: dispatchDate,
                });

                // Dispatch inventory transaction
                transactionsToInsert.push({
                    transactionType: "dispatch",
                    itemType: "FinishedGood",
                    product: product._id,
                    quantity: -orderQty,
                    previousBalance: orderQty,
                    newBalance: 0,
                    referenceType: "Dispatch",
                    referenceId: dispatchId,
                    referenceNumber: dispatchNumber,
                    remarks: `Order shipped via ${courier} (${trackingNumber})`,
                    performedBy: dispatchUser._id,
                    createdAt: dispatchDate,
                });
            }

            // ─── CASE: READY FOR DISPATCH (35 ORDERS) ─────────────────────────
            else if (dist.status === "ready_for_dispatch") {
                const batchNumber = `BAT-STK-${String(orderIndex).padStart(4, "0")}`;
                statusHistory.push(
                    { status: "approved", changedBy: salesUser._id, changedAt: new Date(createdAt.getTime() + 2 * 3600000), note: "Approved" },
                    { status: "ready_for_dispatch", changedBy: qcUser._id, changedAt: new Date(createdAt.getTime() + 24 * 3600000), note: "Finished Goods verified & reserved. Awaiting vehicle." }
                );

                fgBatchesToInsert.push({
                    product: product._id,
                    batchNumber,
                    quantity: orderQty + 10,
                    reservedQuantity: orderQty,
                    manufacturingDate: new Date(createdAt.getTime() - 2 * 24 * 3600000),
                    warehouse: "Main FG Warehouse",
                });
            }

            // ─── CASE: QUALITY CHECK (30 ORDERS) ──────────────────────────────
            else if (dist.status === "quality_check") {
                statusHistory.push(
                    { status: "production_planned", changedBy: prodUser._id, changedAt: new Date(createdAt.getTime() + 2 * 3600000), note: "Planned" },
                    { status: "in_production", changedBy: prodUser._id, changedAt: new Date(createdAt.getTime() + 12 * 3600000), note: "In Production" },
                    { status: "quality_check", changedBy: prodUser._id, changedAt: new Date(createdAt.getTime() + 48 * 3600000), note: "Assembly complete. Pending QC inspection." }
                );

                plansToInsert.push({
                    productionOrderNumber: `PRD-${String(orderIndex).padStart(4, "0")}`,
                    salesOrder: orderId,
                    product: product._id,
                    quantity: orderQty,
                    producedQuantity: orderQty,
                    rejectedQuantity: 0,
                    machine: machines[orderIndex % machines.length],
                    shift: shifts[orderIndex % shifts.length],
                    supervisor: prodUser._id,
                    startDate: createdAt,
                    endDate: new Date(createdAt.getTime() + 48 * 3600000),
                    stage: "completed",
                    materialsIssued: true,
                    stageHistory: [{ stage: "completed", timestamp: new Date(), updatedBy: prodUser._id }],
                    createdBy: prodUser._id,
                });
            }

            // ─── CASE: IN PRODUCTION (40 ORDERS) ──────────────────────────────
            else if (dist.status === "in_production") {
                statusHistory.push(
                    { status: "production_planned", changedBy: prodUser._id, changedAt: new Date(createdAt.getTime() + 2 * 3600000), note: "Planned" },
                    { status: "in_production", changedBy: prodUser._id, changedAt: new Date(createdAt.getTime() + 10 * 3600000), note: "Materials issued. Currently manufacturing." }
                );

                plansToInsert.push({
                    productionOrderNumber: `PRD-${String(orderIndex).padStart(4, "0")}`,
                    salesOrder: orderId,
                    product: product._id,
                    quantity: orderQty,
                    producedQuantity: Math.floor(orderQty / 2),
                    rejectedQuantity: 0,
                    machine: machines[orderIndex % machines.length],
                    shift: shifts[orderIndex % shifts.length],
                    supervisor: prodUser._id,
                    startDate: createdAt,
                    endDate: expectedDelivery,
                    stage: "manufacturing",
                    materialsIssued: true,
                    stageHistory: [{ stage: "manufacturing", timestamp: new Date(), updatedBy: prodUser._id }],
                    createdBy: prodUser._id,
                });
            }

            // ─── CASE: PRODUCTION PLANNED (30 ORDERS) ─────────────────────────
            else if (dist.status === "production_planned") {
                statusHistory.push({
                    status: "production_planned",
                    changedBy: prodUser._id,
                    changedAt: new Date(createdAt.getTime() + 4 * 3600000),
                    note: "Production scheduled. Materials reserved.",
                });

                plansToInsert.push({
                    productionOrderNumber: `PRD-${String(orderIndex).padStart(4, "0")}`,
                    salesOrder: orderId,
                    product: product._id,
                    quantity: orderQty,
                    machine: machines[orderIndex % machines.length],
                    shift: shifts[orderIndex % shifts.length],
                    supervisor: prodUser._id,
                    startDate: new Date(now.getTime() + 24 * 3600000),
                    endDate: new Date(now.getTime() + 5 * 24 * 3600000),
                    stage: "planned",
                    materialsIssued: false,
                    stageHistory: [{ stage: "planned", timestamp: new Date(), updatedBy: prodUser._id }],
                    createdBy: prodUser._id,
                });
            }

            // ─── CASE: CANCELLED (15 ORDERS) ──────────────────────────────────
            else if (dist.status === "cancelled") {
                statusHistory.push({
                    status: "cancelled",
                    changedBy: salesUser._id,
                    changedAt: new Date(createdAt.getTime() + 6 * 3600000),
                    note: "Cancelled upon customer request. Reserved inventory released.",
                });
            }

            // Push Sales Order
            ordersToInsert.push({
                _id: orderId,
                orderNumber,
                customer: customer._id,
                items: [
                    {
                        product: product._id,
                        quantity: orderQty,
                        unitPrice,
                        totalPrice,
                        fulfillmentSource: dist.status === "ready_for_dispatch" ? "finished_goods" : "production",
                    },
                ],
                totalAmount: totalPrice,
                expectedDeliveryDate: expectedDelivery,
                priority: orderQty > 15 ? "high" : "medium",
                remarks: `Order for ${customer.companyName}`,
                status: dist.status,
                statusHistory,
                createdBy: salesUser._id,
                createdAt,
                updatedAt: createdAt,
            });

            // Occasional Audit Log
            if (orderIndex % 5 === 0) {
                auditLogsToInsert.push({
                    user: salesUser._id,
                    userName: salesUser.name,
                    action: dist.status === "delivered" ? "ORDER_DELIVERED" : "ORDER_CREATED",
                    resource: "SalesOrder",
                    resourceId: orderId,
                    details: { orderNumber, status: dist.status, totalAmount: totalPrice },
                    ipAddress: "192.168.1.105",
                    timestamp: createdAt,
                });
            }

            orderIndex++;
        }
    }

    console.log(`Writing ${ordersToInsert.length} Orders to Database...`);
    await SalesOrder.insertMany(ordersToInsert);

    console.log(`Writing ${dispatchesToInsert.length} Dispatches to Database...`);
    await Dispatch.insertMany(dispatchesToInsert);

    if (plansToInsert.length > 0) {
        console.log(`Writing ${plansToInsert.length} Production Plans...`);
        await ProductionPlan.insertMany(plansToInsert);
    }

    if (fgBatchesToInsert.length > 0) {
        console.log(`Writing ${fgBatchesToInsert.length} Finished Goods Batches...`);
        await FinishedGood.insertMany(fgBatchesToInsert);
    }

    if (transactionsToInsert.length > 0) {
        console.log(`Writing ${transactionsToInsert.length} Inventory Transactions...`);
        await InventoryTransaction.insertMany(transactionsToInsert);
    }

    if (auditLogsToInsert.length > 0) {
        console.log(`Writing ${auditLogsToInsert.length} Audit Logs...`);
        await AuditLog.insertMany(auditLogsToInsert);
    }
};

// ─── 7. MAIN RUNNER ───────────────────────────────────────────────────────────
export const runSeed = async () => {
    try {
        await connect();

        const users = await seedUsers();
        const customers = await seedCustomers(users["admin"]);
        const rawMaterials = await seedRawMaterials();
        const products = await seedProducts(rawMaterials, users["admin"]);
        await seedOrdersAndLifecycle(users, customers, products, rawMaterials);

        console.log("\n========================================================");
        console.log(" FloData ERP Database Seeded Successfully!");
        console.log(` • Users: 6 (1 for each role, password: Password@123)`);
        console.log(` • Customers: 25 B2B clients across India`);
        console.log(` • Raw Materials: 30 industrial items`);
        console.log(` • Finished Products: 100 SKUs with complete BOM recipes`);
        console.log(` • Sales Orders: 1,000 orders across full 9-stage lifecycle`);
        console.log(` • Dispatches: 800 shipments with fake carrier tracking`);
        console.log("========================================================\n");

        process.exit(0);
    } catch (error) {
        console.error("Seeding Error:", error);
        process.exit(1);
    }
};

// Automatically execute seeding when script is run
runSeed();
