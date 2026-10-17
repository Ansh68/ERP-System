# FloData ERP — Decisions Log

---

## Phase 1 — Authentication & RBAC (Backend)

### JWT for Authentication
Using JWT (JSON Web Tokens) because the app is stateless — no session storage needed on the server. Each request carries the token itself. Works perfectly with a REST API consumed by React frontend or Postman.

### Two-Token Strategy (Access + Refresh)
- **Access Token** expires in 1 day — short-lived so if stolen, damage is limited.
- **Refresh Token** expires in 10 days — stored in DB and in an `httpOnly` cookie. Used to get a new access token without re-login.
- Why store refresh token in DB? So we can invalidate it on logout (delete it from DB), making logout actually secure.

### bcrypt for Password Hashing
Industry standard for hashing passwords. Uses a salt + cost factor (10 rounds) so the hash is slow to brute-force. Never store plain passwords.

### Pre-save Hook for Hashing
Password is hashed in the Mongoose `pre("save")` hook, not in the controller. This ensures the password is **always** hashed no matter where the save comes from, not just login.

### httpOnly Cookies for Tokens
Tokens are sent as `httpOnly` cookies (not accessible to JavaScript). This protects against XSS attacks. Tokens are also sent in the response body so Postman can test them easily via the `Authorization: Bearer` header.

### Role Enum in User Model
6 fixed roles defined as an enum in the schema: `admin`, `sales_executive`, `inventory_manager`, `production_manager`, `quality_inspector`, `dispatch_manager`. Enum prevents invalid roles being saved.

### `authorizeRoles` Middleware
A reusable middleware factory — `authorizeRoles("admin", "sales_executive")` — that wraps any route and checks `req.user.role`. Clean and composable.

### `asyncHandler` Wrapper
All controllers are wrapped in `asyncHandler` so we don't need `try/catch` in every function. Errors automatically flow to the global error handler.

### `ApiError` Custom Class
Extends native `Error` with a `statusCode` field. The global error handler in `app.js` reads this to send the correct HTTP status code and message. Consistent error shape across all endpoints.

### `ApiResponse` Class
All success responses use `{ statusCode, data, message, success }` shape. Makes it predictable for the frontend and Postman to handle responses.

### Global Error Handler in `app.js`
A single `(err, req, res, next)` middleware at the bottom of `app.js` catches all thrown `ApiError` instances. In development mode, it also sends the stack trace.

### Route Versioning `/api/v1/`
All routes are prefixed with `/api/v1/`. This makes it easy to release a v2 in future without breaking existing clients.

---

## API Endpoints — Phase 1

| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| POST | `/api/v1/auth/register` | No | — |
| POST | `/api/v1/auth/login` | No | — |
| POST | `/api/v1/auth/refresh-token` | No | — |
| POST | `/api/v1/auth/logout` | Yes | Any |
| GET | `/api/v1/auth/me` | Yes | Any |
| PATCH | `/api/v1/auth/change-password` | Yes | Any |
| GET | `/api/v1/auth/users` | Yes | Admin |
| PATCH | `/api/v1/auth/users/:userId/toggle-status` | Yes | Admin |

---

## Phase 2 — Master Data (Customers, Raw Materials, Products & BOM)

### Embedded BOM inside Product Model
BOM (Bill of Materials) is stored as an embedded array inside the `Product` schema rather than a separate collection. In manufacturing, a product's BOM recipe is always accessed whenever the product is viewed or planned. Embedding guarantees fast lookups with zero extra collection joins.

### Raw Material References in BOM Items
Each item in the BOM references a `RawMaterial` ObjectId with a required `quantity` per unit. We validate that each referenced material exists during product creation/updates. The `unit` is auto-filled for quick display, keeping the raw material catalog as the single source of truth for stock and pricing.

### Virtual Fields for Inventory (`availableQuantity` & `isLowStock`)
Instead of storing redundant fields that could become desynchronized, we used Mongoose virtual getters on `RawMaterial`:
- `availableQuantity = currentStock - reservedQuantity`
- `isLowStock = currentStock <= minimumStockLevel`

### MongoDB `$expr` for Dynamic Low-Stock Filtering
Comparing two fields on the same document (`currentStock <= minimumStockLevel`) requires MongoDB's `$expr` operator. This allows the database to filter low-stock alerts natively without loading all rows into Node.js memory.

### Route Ordering Before `/:id` Wildcards
In Express, generic routes like `/:id` will catch literal paths like `/low-stock` or `/categories` if placed above them. We positioned `/low-stock` and `/categories` above the parameter routes to prevent `CastError: Cast to ObjectId failed`.

### Stock Adjustment Endpoint (`/adjust-stock`)
Provides an endpoint to add stock (receiving supplier orders) or decrement stock (spoilage/corrections) with validations to prevent negative inventory, recording previous and updated stock balances.

### MRP Preview Engine (`/products/:id/mrp?quantity=N`)
Calculates required raw materials for any target order quantity (`quantity * bomQty`), compares with `availableQuantity`, and detects exact shortages. This allows sales and production to verify feasibility before committing to a manufacturing run.

### MongoDB Text Indexes for Search
Created text indexes on `Customer`, `RawMaterial`, and `Product`. This enables instant text search using `$text: { $search: query }` across search fields without full-table regex scans.

### Role-Based Access for Master Data
- **Customers**: Sales Executives and Admins can create/edit/toggle; Dispatch Managers have read-only access (for shipping addresses).
- **Raw Materials**: Inventory Managers and Admins can create, edit, and adjust stock; Production Managers have read access (for planning).
- **Products & BOM**: Production Managers and Admins create and modify recipes; Sales and Inventory have read access.

---

## API Endpoints — Phase 2

### Customer Endpoints
| Method | Endpoint | Auth Required | Role Allowed | Description |
|--------|----------|---------------|--------------|-------------|
| POST | `/api/v1/customers` | Yes | Admin, Sales Executive | Create customer |
| GET | `/api/v1/customers` | Yes | Admin, Sales Executive, Dispatch Manager | List customers (search, filter, pagination) |
| GET | `/api/v1/customers/:id` | Yes | Admin, Sales Executive, Dispatch Manager | Get customer profile & addresses |
| PATCH | `/api/v1/customers/:id` | Yes | Admin, Sales Executive | Update customer details |
| PATCH | `/api/v1/customers/:id/toggle-status` | Yes | Admin, Sales Executive | Activate / deactivate customer |

### Raw Material Endpoints
| Method | Endpoint | Auth Required | Role Allowed | Description |
|--------|----------|---------------|--------------|-------------|
| POST | `/api/v1/raw-materials` | Yes | Admin, Inventory Manager | Create raw material |
| GET | `/api/v1/raw-materials` | Yes | Admin, Inventory Manager, Production Manager | List materials (search, lowStock, pagination) |
| GET | `/api/v1/raw-materials/low-stock` | Yes | Admin, Inventory Manager, Production Manager | Get low stock materials list |
| GET | `/api/v1/raw-materials/:id` | Yes | Admin, Inventory Manager, Production Manager | Get single raw material details |
| PATCH | `/api/v1/raw-materials/:id` | Yes | Admin, Inventory Manager | Update raw material details |
| POST | `/api/v1/raw-materials/:id/adjust-stock` | Yes | Admin, Inventory Manager | Adjust stock (+add or -reduce) |

### Product & BOM Endpoints
| Method | Endpoint | Auth Required | Role Allowed | Description |
|--------|----------|---------------|--------------|-------------|
| POST | `/api/v1/products` | Yes | Admin, Production Manager | Create product with BOM recipe |
| GET | `/api/v1/products` | Yes | Admin, Production Manager, Sales Executive, Inventory Manager | List products (search, category, pagination) |
| GET | `/api/v1/products/categories` | Yes | Admin, Production Manager, Sales Executive | List distinct product categories |
| GET | `/api/v1/products/:id` | Yes | Admin, Production Manager, Sales Executive, Inventory Manager | Get product by ID with populated BOM |
| PATCH | `/api/v1/products/:id` | Yes | Admin, Production Manager | Update product or BOM |
| GET | `/api/v1/products/:id/mrp` | Yes | Admin, Production Manager, Sales Executive | MRP preview calculation (`?quantity=N`) |

---

## Phase 3 — Sales Order Management & Automated Inventory Flow

### Batch-Level Tracking for Finished Goods (`FinishedGood` model)
Finished goods are stored in a dedicated `FinishedGood` model with batch numbers, manufacturing dates, and warehouse locations rather than a single flat count on `Product`. In manufacturing, products are produced and tested in batches, and dispatch must support FIFO (First-In, First-Out) stock rotation.

### Dedicated `InventoryTransaction` Audit Ledger
Every inventory movement (purchase, material issue, production, adjustment, dispatch, return) creates an immutable transaction entry with `previousBalance`, `newBalance`, user, and reference document. This satisfies the audit requirement and prevents unexplained inventory shrinkage.

### Two-Path Automated Order Approval & Inventory Routing
When an order is approved via `POST /api/v1/orders/:id/approve`:
1. **Branch A (In Stock)**: System verifies finished goods inventory across active batches. If 100% available, batches are reserved via FIFO and the order immediately skips production to `ready_for_dispatch`.
2. **Branch B (Requires Manufacturing)**: If finished goods are insufficient, the system evaluates each product's Bill of Materials (BOM), aggregates required raw materials, reserves available raw materials, logs shortages, and transitions the order to `production_planned`.

### FIFO (First-In, First-Out) Batch Reservation
Finished goods are queried and sorted by `manufacturingDate: 1`. Oldest batches are reserved first, avoiding expired or aged inventory sitting in warehouses.

### Inventory Rollback on Order Cancellation
If an order is cancelled prior to dispatch, all reserved finished goods and raw materials are automatically released back into the pool of available stock (`reservedQuantity` is decremented), preventing locked or ghost inventory.

### Embedded `statusHistory` in Sales Orders
Every lifecycle transition (`draft` → `approved` → `production_planned` / `ready_for_dispatch` → `cancelled`) writes an entry to `statusHistory` with timestamp, user ID, and explanation note, ensuring end-to-end traceability across departments.

---

## API Endpoints — Phase 3

### Sales Order Endpoints
| Method | Endpoint | Auth Required | Role Allowed | Description |
|--------|----------|---------------|--------------|-------------|
| POST | `/api/v1/orders` | Yes | Admin, Sales Executive | Create new sales order (draft) |
| GET | `/api/v1/orders` | Yes | Admin, Sales, Production, Inventory, Dispatch | List sales orders (filter by status, customer, priority, search) |
| GET | `/api/v1/orders/:id` | Yes | Admin, Sales, Production, Inventory, Dispatch | Get order details with inventory validation report & history |
| PATCH | `/api/v1/orders/:id` | Yes | Admin, Sales Executive | Update order items or details (draft status only) |
| POST | `/api/v1/orders/:id/cancel` | Yes | Admin, Sales Executive | Cancel order and release reserved materials / FG |
| POST | `/api/v1/orders/:id/approve` | Yes | Admin, Sales Executive | **Approve order & trigger automatic inventory validation / MRP** |

### Finished Goods Inventory Endpoints
| Method | Endpoint | Auth Required | Role Allowed | Description |
|--------|----------|---------------|--------------|-------------|
| POST | `/api/v1/finished-goods` | Yes | Admin, Inventory Manager | Create new finished goods batch |
| GET | `/api/v1/finished-goods` | Yes | Admin, Inventory, Sales, Production, Dispatch | List batches (filter by product, warehouse, search) |
| GET | `/api/v1/finished-goods/:id` | Yes | Admin, Inventory, Sales, Production, Dispatch | Get batch details and available stock |
| POST | `/api/v1/finished-goods/:id/adjust-stock` | Yes | Admin, Inventory Manager | Adjust batch quantity with transaction logging |

### Inventory Audit Endpoints
| Method | Endpoint | Auth Required | Role Allowed | Description |
|--------|----------|---------------|--------------|-------------|
| GET | `/api/v1/inventory/transactions` | Yes | Admin, Inventory Manager, Production Manager | Filter transaction audit logs (by type, item, dates) |

---

## Phase 4 — Production Planning & Manufacturing Execution

### 6-Stage Manufacturing State Machine
Production execution follows a strict 6-stage lifecycle:
`planned → material_issued → manufacturing → assembly → packaging → completed` (or `cancelled`).
Each stage records timestamp, user, operator, units produced, units rejected, and supervisor remarks in `stageHistory`.

### Physical Inventory Deduction on `material_issued`
When transitioning to `material_issued`, raw materials are actually consumed from inventory (`currentStock` and `reservedQuantity` decremented) and an `InventoryTransaction` of type `"material_issue"` is recorded. This mirrors real-world factory floors where stock isn't consumed until physically issued to the machines.

### Automatic `SalesOrder` Synchronization
- On `material_issued`: Linked `SalesOrder` moves from `production_planned` to `in_production`.
- On `completed`: Linked `SalesOrder` moves from `in_production` to `quality_check`, unlocking the next department's workflow (Quality Inspection).

### Resource Planning (Machine, Shift, Supervisor)
Every production plan tracks machine allocation, 3-shift scheduling (`morning`, `afternoon`, `night`), and assigned supervisor for operational resource management.

### Real-Time Scrap / Defect Tracking
Tracks `producedQuantity` vs `rejectedQuantity` at each execution stage, providing visibility into scrap rates and preparing for Quality Control inspection in Phase 5.

---

## API Endpoints — Phase 4

### Production Planning & Execution Endpoints
| Method | Endpoint | Auth Required | Role Allowed | Description |
|--------|----------|---------------|--------------|-------------|
| POST | `/api/v1/production-plans` | Yes | Admin, Production Manager | Create production plan for an approved sales order |
| GET | `/api/v1/production-plans` | Yes | Admin, Production, Inventory, Sales, QC | List production plans (filter by stage, product, machine, shift) |
| GET | `/api/v1/production-plans/:id` | Yes | Admin, Production, Inventory, Sales, QC | Get plan details, machine, BOM materials, and stage history |
| PATCH | `/api/v1/production-plans/:id` | Yes | Admin, Production Manager | Update machine, shift, dates, supervisor, or remarks |
| POST | `/api/v1/production-plans/:id/update-stage` | Yes | Admin, Production Manager | Advance stage (deducts stock on `material_issued`, advances order to `quality_check` on `completed`) |

---

## Phase 5 — Quality Control & Dispatch Management (with Carrier Simulation)

### 4-Parameter QC Testing & Batch Receipt
Inspects manufactured goods across 4 critical metrics: `visualInspection`, `dimensions`, `weight`, and `finish`.
- **Passed**: Auto-generates a new `FinishedGood` batch number, records an inventory transaction (`production`), and advances the `SalesOrder` to `ready_for_dispatch`.
- **Rework Required**: Reverts `ProductionPlan` and `SalesOrder` back to `in_production` stage for factory remediation.
- **Failed**: Records defect audit log and halts order progression.

### Automated Finished Goods Decrement on Dispatch
When `Dispatch` is created, finished goods inventory is immediately reduced (`quantity` and `reservedQuantity` decremented) and an `InventoryTransaction` of type `"dispatch"` is logged. The `SalesOrder` status advances to `dispatched`.

### Third-Party Carrier Simulation Service
A simulated logistics engine generates realistic tracking numbers (e.g., `FDX-XXXXXXXX`, `BLU-XXXXXXXX`) and timeline milestone events (`manifest_created` → `picked_up` → `in_transit` → `out_for_delivery` → `delivered`). Allows testing realistic tracking before integrating real external courier APIs.

### Order Lifecycle Closure on Delivery
When carrier milestone advances to `delivered` (via simulation or manager confirmation), the linked `SalesOrder` status automatically transitions to `delivered`, completing the full 9-stage lifecycle:
`Draft → Approved → Inventory Check → Production Planned → In Production → Quality Check → Ready for Dispatch → Dispatched → Delivered`.

### Public Shipment Tracking Route
`GET /api/v1/dispatches/track/:trackingNumber` is publicly accessible without JWT tokens, mimicking consumer tracking portals like FedEx or BlueDart.

---

## API Endpoints — Phase 5

### Quality Inspection Endpoints
| Method | Endpoint | Auth Required | Role Allowed | Description |
|--------|----------|---------------|--------------|-------------|
| POST | `/api/v1/quality-inspections` | Yes | Admin, Quality Inspector | Record QC inspection (creates FG batch on pass, moves order to `ready_for_dispatch`) |
| GET | `/api/v1/quality-inspections` | Yes | Admin, Quality Inspector, Production, Sales | List QC inspections (filter by status, product, plan) |
| GET | `/api/v1/quality-inspections/:id` | Yes | Admin, Quality Inspector, Production, Sales | Get inspection details & parameter results |

### Dispatch Management Endpoints
| Method | Endpoint | Auth Required | Role Allowed | Description |
|--------|----------|---------------|--------------|-------------|
| POST | `/api/v1/dispatches` | Yes | Admin, Dispatch Manager | Create dispatch/shipment (auto-decrements inventory, moves order to `dispatched`) |
| GET | `/api/v1/dispatches` | Yes | Admin, Dispatch Manager, Sales, Inventory | List dispatches (filter by status, courier, search) |
| GET | `/api/v1/dispatches/:id` | Yes | Admin, Dispatch Manager, Sales Executive | Get dispatch details, invoice, and carrier event history |
| GET | `/api/v1/dispatches/track/:trackingNumber` | No (Public) | Any | Track shipment journey timeline using tracking number |
| POST | `/api/v1/dispatches/:id/simulate-progress` | Yes | Admin, Dispatch Manager | Advance fake carrier milestone (`in_transit` → `out_for_delivery` → `delivered`) |
| POST | `/api/v1/dispatches/:id/deliver` | Yes | Admin, Dispatch Manager | Direct delivery confirmation (moves order to `delivered`) |

---

## Phase 6 — Dashboard Statistics, Analytical Reports & Audit Logs

### Parallel Aggregation Pipeline for Dashboard KPIs
Dashboard metrics (total orders, running production, low stock count, inventory valuations, realized vs pipeline revenue, today's output) execute in parallel via `Promise.all` using native MongoDB aggregation pipelines. This avoids serial queries and keeps dashboard load times sub-second.

### Dual-Layer Inventory Valuation
Calculates and distinguishes:
1. **Raw Material Valuation**: `currentStock * unitPrice` (capital invested in raw inputs).
2. **Finished Goods Valuation**: `quantity * unitSellingPrice` (expected commercial value ready for dispatch).
Provides managers with clear insight into tied-up working capital.

### 6 Dedicated Analytic Report Engines
- **Sales Report**: Filterable by date range/status with top products and top customers by revenue.
- **Inventory Report**: Stock counts, total valuation, and warehouse-wise stock distribution.
- **Production Report**: Planned vs actual production, machine performance, shift performance, and defect/scrap rate percentage.
- **Material Consumption Report**: Raw material usage and cost aggregated from `material_issue` inventory transactions.
- **Dispatch Report**: Courier performance and shipment delivery completion rates.
- **Low Stock Report**: Identifies items at or below minimum level with recommended reorder quantities and procurement cost estimates.

### Non-Blocking Audit Logging System
The `logActivity` utility records actions, users, resources, and IP addresses asynchronously. Any logging exceptions are caught internally so they never fail or rollback the main business transaction.

### Role-Based Access for Reports & Auditing
- Operational reports are scoped to their respective department managers (e.g., Sales to Sales Executives, Production to Production Managers).
- Audit logs are strictly restricted to the `admin` role for corporate compliance.

---

## API Endpoints — Phase 6

### Dashboard Endpoints
| Method | Endpoint | Auth Required | Role Allowed | Description |
|--------|----------|---------------|--------------|-------------|
| GET | `/api/v1/dashboard/metrics` | Yes | Any logged-in user | Unified dashboard KPIs, inventory values, revenue, and status breakdown |

### Reports Endpoints
| Method | Endpoint | Auth Required | Role Allowed | Description |
|--------|----------|---------------|--------------|-------------|
| GET | `/api/v1/reports/sales` | Yes | Admin, Sales Executive | Sales summary, top products, top customers (`?startDate&endDate&status`) |
| GET | `/api/v1/reports/inventory` | Yes | Admin, Inventory Manager, Production Manager | Inventory stock totals, valuation, warehouse distribution |
| GET | `/api/v1/reports/production` | Yes | Admin, Production Manager | Production output, scrap rate %, machine and shift performance |
| GET | `/api/v1/reports/material-consumption` | Yes | Admin, Inventory Manager, Production Manager | Raw material quantities and cost consumed in production |
| GET | `/api/v1/reports/dispatch` | Yes | Admin, Dispatch Manager, Sales Executive | Shipment volume, courier breakdown, and delivery performance |
| GET | `/api/v1/reports/low-stock` | Yes | Admin, Inventory Manager, Production Manager | Low stock alerts with recommended reorder quantities and costs |

### Audit Log Endpoints
| Method | Endpoint | Auth Required | Role Allowed | Description |
|--------|----------|---------------|--------------|-------------|
| GET | `/api/v1/audit-logs` | Yes | Admin | Filter system activity logs (`?action&resource&user&startDate&endDate`) |
| GET | `/api/v1/audit-logs/:id` | Yes | Admin | Get single audit log entry and details payload |

---

## Phase 7 — Demo Data Generation & Data Reasoning

### Explicit Seed Script Execution (`npm run seed`)
The seeder runs as a standalone script (`node seed.js`) rather than automatically running on server launch. This prevents nodemon development reloads from flooding the database with duplicate records or wiping manual test data.

### Pre-Generated ObjectIds for Referential Consistency
To insert 1,000 orders and hundreds of linked dispatches and production plans without thousands of slow sequential DB lookups, MongoDB `ObjectId`s are pre-instantiated in memory. This guarantees that `SalesOrder.inventoryValidation`, `Dispatch.salesOrder`, `InventoryTransaction.referenceId`, and `ProductionPlan.salesOrder` remain 100% referentially consistent.

### Demo Data Architecture & Reasoning

1. **6 Departmental User Roles**:
   Pre-configures 1 active user account per operational role with a unified password (`Password@123`), enabling effortless role-switching during live UI walkthroughs:
   - `admin@flodata.com` (Admin)
   - `sales@flodata.com` (Sales Executive)
   - `inventory@flodata.com` (Inventory Manager)
   - `production@flodata.com` (Production Manager)
   - `qc@flodata.com` (Quality Inspector)
   - `dispatch@flodata.com` (Dispatch Manager)

2. **25 Realistic B2B Customers**:
   Corporate workspace buyers, retailers, and co-working chains located across major Indian commercial centers (Mumbai, Bangalore, Delhi, Pune, Hyderabad, Chennai) with valid GSTIN formats and independent billing/shipping addresses.

3. **30 Industrial Raw Materials**:
   Covers standard manufacturing inputs across 6 warehouse bays:
   - Metals (Steel tubes, aluminum sheets, cast iron bases, chrome stars)
   - Wood (Plywood, MDF boards, teak hardwood, PVC edge banding)
   - Hardware (Bolts, screws, gas lift cylinders, caster wheels, tilt mechanisms, hinges, sliders)
   - Upholstery (40D molded foam, nylon mesh, PU leatherette, velvet fabric)
   - Finishing (Powder coat paint, clear lacquer, industrial adhesive)
   - Packaging (Heavy-duty corrugated boxes, bubble wrap, corner foam caps)

4. **100 Distinct SKUs with Real Bills of Materials (BOM)**:
   Distributed equally (20 SKUs each) across 5 core commercial categories:
   - `Office Chairs` (Ergonomic, Executive Leather, Mesh High-Back, Drafting Stools, etc.)
   - `Desks & Workstations` (Electric Height-Adjustable, L-Shaped Executive, 4-Way Clusters, etc.)
   - `Storage & Cabinets` (Mobile Pedestals, Lateral Filing, Steel Lockers, Credenzas, etc.)
   - `Industrial & Workshop` (Heavy Duty Workbenches, Tool Storage, ESD Assembly Benches, etc.)
   - `Conference & Seating` (Boardroom 12-Seater, Breakout Lounge Sofas, Acoustic Pods, etc.)
   Each SKU has 5–7 BOM ingredients with exact consumption amounts, allowing the MRP engine to accurately calculate material requirements for any batch.

5. **1,000 Sales Orders Across 9 Lifecycle Stages**:
   - **800 Dispatched / Delivered**:
     - 650 `delivered` (completed lifecycle with carrier delivery confirmations)
     - 150 `dispatched` (live in-transit shipments)
     - All 800 link directly to `Dispatch` records, invoices, vehicles, drivers, and `InventoryTransaction` dispatch audit logs.
   - **200 Active Pipeline Orders**:
     - 25 `draft` (new customer orders pending sales review)
     - 25 `approved` (orders pending inventory check)
     - 30 `production_planned` (materials reserved, production plans scheduled)
     - 40 `in_production` (active factory runs across CNC/welding/coating machines with materials issued)
     - 30 `quality_check` (production complete, pending inspector review)
     - 35 `ready_for_dispatch` (QC passed or fulfilled from finished goods stock)
     - 15 `cancelled` (demonstrating reservation rollback)

6. **Fake Carrier Service Integration**:
   Simulates 5 courier carriers (`FloData Express`, `BlueDart`, `Delhivery`, `FedEx`, `DTDC`) with realistic tracking numbers and multi-milestone tracking events (`manifest_created` → `picked_up` → `in_transit` → `out_for_delivery` → `delivered`).






