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

---

## Phase 8 — Minimal Functional Frontend (Light Mode Test Console)

### Functionality-First Light-Mode Design
Built with a minimal, clean light-mode palette (white surfaces, slate borders, clear text, status badges) prioritized specifically for testing end-to-end API correctness and state machines across all 6 roles.

### 1-Click Role Switcher in Navigation
A topbar role switcher allows testing any role account (`admin`, `sales_executive`, `inventory_manager`, `production_manager`, `quality_inspector`, `dispatch_manager`) with a single click, instantly re-authenticating the session without typing passwords.

### Interactive API Verification Stations
1. **Orders**: Features the `Approve & Run MRP Check` action that calls `POST /orders/:id/approve` and displays real-time inventory validation (whether FG was sufficient to skip production or raw materials were reserved with shortages).
2. **Products & BOM**: Includes a live interactive **MRP Simulation Station** to test material requirement planning and shortage detection for any simulated order quantity.
3. **Raw Materials**: Includes an interactive **Stock Adjustment Modal** to test positive and negative stock movements with reason logging.
4. **Production**: Features stage progression buttons (`material_issued` → `manufacturing` → `assembly` → `packaging` → `completed`), verifying physical stock deduction and automatic order transitions.
5. **Quality Control**: Provides an inspection modal testing 4 quality metrics (Visual, Dimensions, Weight, Finish), verifying that `Passed` automatically generates Finished Goods batches and advances the order to `ready_for_dispatch`.
6. **Dispatch & Tracking**: Allows shipping ready orders (auto-decrementing FG stock), simulating carrier milestone progression (`in_transit` → `out_for_delivery` → `delivered`), and looking up public tracking timelines.
7. **Reports & Audit**: Dedicated tabbed viewer for all 6 analytical manufacturing reports and the system activity audit log.

---

## Phase 9 — Universal Input Validation & Data Integrity Suite

### Strict 10-Digit Phone Number Rule
- **Rule**: All phone numbers (Customer contacts, Dispatch driver contacts) must strictly contain exactly 10 digits (`/^\d{10}$/`).
- **Frontend Enforcement**: Phone inputs use `type="tel"`, `maxLength={10}`, and dynamic regex sanitization (`e.target.value.replace(/\D/g, "").slice(0, 10)`), actively preventing users from entering letters or more than 10 digits. Submission handlers perform pre-flight regex validation with user alerts.
- **Backend Model & Controller Enforcement**: Mongoose schemas for `Customer` and `Dispatch` enforce `match: [/^\d{10}$/, "Phone number must be exactly 10 digits"]`. Controllers explicitly validate phone strings before database insertion, rejecting invalid payloads with `400 Bad Request`.

### Alphabetic String Validation for Personal Names
- **Rule**: Personal names (User registered name, Customer contact person, Driver name, Machine operator) must strictly be alphabetic strings containing only letters and spaces (`/^[a-zA-Z\s]{2,50}$/`).
- **Rationale**: Prevents accidental inclusion of numbers, punctuation, or corrupted data in contact fields.
- **Enforcement**: Inputs sanitize input on keypress (`replace(/[^a-zA-Z\s]/g, "")`), enforce a maximum length of 50 characters, and validate on submit. Mongoose schemas enforce matching regex validators.

### Standardized Email & Password Validation
- **Email**: Validated with `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` across both client forms and backend auth/customer controllers, trimming and lowercasing values before storage.
- **Password**: Enforces a minimum length of 6 characters across registration and login controllers.

### Operational Numeric Bounds & Formula Integrity
- **Inventory & Pricing**: Unit selling prices, raw material purchase costs, and stock levels are strictly bounded to non-negative numbers (`min: 0`).
- **BOM Quantities**: Bill of Materials items must specify quantities strictly greater than 0 (`min: 0.001`).
- **Orders & Production**: Order line item quantities and production plan target quantities must be integers >= 1.
- **Quality Control**: QC inspection validates that inspected quantity >= 1 and that `passedQuantity + failedQuantity <= inspectedQuantity`, preventing logical inconsistencies in batch reporting.

### Express Global Error Handler Translation for Mongoose Validation
- **Architecture**: The Express error handler in `app.js` was enhanced to catch native Mongoose `ValidationError`, `CastError`, and Mongo duplicate key error `11000`.
- **User Impact**: Instead of emitting unformatted 500 Internal Server Errors, Mongoose validation failures are transformed into clear, user-friendly 400 or 409 responses with exact error descriptions displayed directly in client alert dialogs or form banners.

---

## Frontend Redesign Phase 1 — Foundation Setup & Modern Design System

### 1. Typography Hierarchy
- **Heading Font**: `Poppins` (Google Fonts, weights 500, 600, 700) applied across all headings (`h1`–`h6`), titles, and branding.
- **Body & Data Font**: `Open Sans` (Google Fonts, weights 300–800) applied across all form controls, table data, navigation items, and body copy.
- **Implementation**: Loaded via `@import` in `index.css` with CSS custom properties `--font-heading` and `--font-body`, configured with antialiased rendering.

### 2. Design System Tokens & Base Theme
- **Theme**: Enterprise Light Mode with pure white surfaces (`#ffffff`), subtle slate backgrounds (`#f8fafc`), clean border lines (`#e2e8f0`), and crisp custom scrollbars.
- **Component Primitives**: Created reusable Tailwind + class-merge (`cn`) UI primitives in `src/components/ui/`:
  - `Button.jsx`: Variants (`default`, `secondary`, `outline`, `ghost`, `danger`, `success`) and sizes (`sm`, `default`, `lg`, `icon`).
  - `Badge.jsx`: Color-coded pill badges (`default`, `slate`, `success`, `warning`, `danger`, `purple`, `indigo`).
  - `Card.jsx`: Structured cards with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
  - `Skeleton.jsx`: Pulse animation placeholders for async loading states.

### 3. Left Sidebar Shell & Navigation (`AppLayout.jsx`)
- **Structure**: Replaced the previous top horizontal navbar with an enterprise left sidebar layout:
  - **Brand Header**: FloData ERP Manufacturing Suite logo and badge.
  - **Role-Aware Navigation Menu**: Dynamically filters navigation links based on user role (Admin, Sales, Inventory, Production, QC, Dispatch) using Lucide icons.
  - **Dev Mode Quick Role Switcher**: Interactive switcher buttons for seamless role transition during testing.
  - **User Profile & Session**: User initial avatar, full name, role badge, and sign-out button.
  - **Mobile Responsive Drawer**: Auto-collapsing hamburger drawer for tablets and mobile viewports.
- **App Wrapper**: `App.jsx` wrapped with `AppLayout` across all protected routes, replacing legacy `Navbar`.

### 4. Global Toast Notification Architecture
- **Library**: `react-hot-toast` mounted at application root in `main.jsx`.
- **Styling**: Configured with light-mode surfaces, rounded borders, subtle elevation, and custom font mapping.
- **Interactions**: Replaces native browser `alert()` and dialog prompts with animated, timed feedback toasts for login, role changes, and error handling.

---

## Frontend Redesign Phase 2 — Modern Login & Authentication Screen

### 1. Visual Card & Aesthetics
- **Surface**: Centered elevated auth card with soft drop-shadow (`shadow-xl shadow-slate-200/60`), subtle slate border (`border-slate-200/80`), and rounded-2xl geometry.
- **Branding**: FloData ERP wordmark with multi-tier gradient badge and subtitle description.
- **Mode Switching**: Segmented pill-style tab control switching between "Sign In" and "Create Account".

### 2. Interactive Form Controls & Micro-Interactions
- **Input Primitives**: Built reusable `Input.jsx` and `Label.jsx` components supporting icons (`Mail`, `Lock`, `User`).
- **Show/Hide Password**: Added interactive toggle button with `Eye` / `EyeOff` Lucide icons.
- **Role Selection**: Dropdown with detailed role responsibilities for account creation.
- **Button Feedback**: Primary action button features loading spinner state with `Loader2` during network requests.

### 3. Toast Notifications & Validation Enforcement
- **Native Alert Replacement**: Removed all browser `alert()` prompts, replacing them with animated `toast.loading()`, `toast.success()`, and `toast.error()`.
- **Universal Validation**: Preserved strict regex check on full name (letters and spaces only, 2-50 chars), valid email regex, and 6+ character password constraint with immediate toast feedback.

### 4. 1-Click Demo Testing Cards
- **Grid Layout**: 2-column quick login matrix with department-coded icons and titles (`Admin`, `Sales Exec`, `Inventory Mgr`, `Production Mgr`, `QC Inspector`, `Dispatch Mgr`), allowing 1-click test sessions without manual typing.

---

## Design Refinement — Vantus ERP Modern Minimal Light Aesthetic

### 1. Palette Realignment (Goodbye Loud Colors, Hello Refined SaaS)
- **Background**: Replaced saturated blue gradients with a calm, neutral light slate canvas (`#f4f6f8`).
- **Surfaces**: Pure white cards (`#ffffff`) with ultra-delicate borders (`border-slate-200/80`), subtle 1px border shadows (`shadow-[0_1px_3px_rgba(0,0,0,0.03)]`), and rounded-2xl geometry.
- **Accents**: Replaced harsh royal blue with clean, crisp cyan/sky accents (`#0ea5e9` / `bg-sky-500`), matching modern high-end ERP benchmarks like Vantus.
- **Badges**: Soft pastel pills (`bg-emerald-50 text-emerald-700`, `bg-sky-50 text-sky-700`, `bg-slate-100 text-slate-700`) without loud dark fills.

### 2. Collapsible Sidebar Shell (`AppLayout.jsx`)
- **Toggle Mechanism**: Added the `«` / `»` (`ChevronsLeft` / `ChevronsRight`) collapse button at the top-right of the sidebar.
- **States**:
  - **Expanded (`w-64`)**: Displays brand mark, title, section headers (`MAIN`, `DEV`), full text labels, sub-icons, and user profile card.
  - **Collapsed (`w-20`)**: Transforms into a slim icon rail, maximizing dashboard workspace and table viewing area. State is persisted in `localStorage`.
- **Active Navigation Pill**: Active link adopts a cyan/sky rounded-xl pill (`bg-sky-500 text-white`) with white icon, exactly mirroring the reference design.

---

## Frontend Redesign Phase 3 — Executive Command Dashboard

### 1. Vantus-Inspired Operational KPI Matrix
- **Metrics Grid**: 6 high-density cards displaying Total Orders, Pending Orders, Active Shopfloor Production, Ready to Ship, Low Stock Warnings, and Today's Output.
- **Card Aesthetics**: Pure white surfaces, 2xl rounded geometry, subtle border elevation, category icons with soft background fills, and bold `Poppins` metrics with contextual subtext badges.

### 2. Financial Valuation & Commercial Performance
- **Inventory Valuation**: Large valuation counter in formatted INR (`₹`), accompanied by a dual-segment progress bar illustrating raw material vs. finished goods stock value split.
- **Revenue Realization**: Tracks realized order value against the active pipeline backlog, complete with an overall order fulfillment percentage indicator.

### 3. Visual 9-Step Manufacturing Pipeline
- **Milestone Stepper**: Horizontal flow of all 9 lifecycle stages (`Draft` → `Approved` → `Inventory Check` → `Planned` → `Production` → `QC Check` → `Ready Ship` → `Dispatched` → `Delivered`), highlighting active order counts per milestone.

### 4. Recent Sales Orders & Audit Stream
- **Recent Orders Table**: Monospace order tags (`SO-1001`), customer names, formatted currency, colored status pills (`Badge`), and direct detail navigation links.
- **Audit Activity Stream**: Timestamped live feed of manufacturing operations with actor attribution and resource tags.
- **Interactive User Profile Dialog**: Built `UserProfileModal.jsx` and `Dialog.jsx` primitive, allowing users to inspect their account credentials, active role badge, and department authorization matrix directly by clicking their profile chip.

---

## Frontend Redesign Phase 4 — Customer Master & Sales Orders Hub

### 1. Click-to-View & Update Customer Master (`CustomersPage.jsx`)
- **Row Interaction**: Clicking any customer opens a comprehensive Customer Profile dialog.
- **View & Edit Modes**: Inspect company name, contact person, 10-digit phone, email, 15-character GSTIN, billing address, and shipping address. Provides an inline edit form invoking `PATCH /customers/:id` with real-time validation and toast feedback.
- **Status Toggle**: 1-click active/inactive toggle calling `PATCH /customers/:id/toggle-status` with immediate UI update.
- **Search & Tabs**: Search input with live filtering across company name, contact person, and email; filter tabs for `All`, `Active`, and `Inactive`.
- **Add Customer Modal**: Standardized dialog with strict client-side validation (alphabetic contact person, 10-digit phone, email regex, 15-character GST format).

### 2. Sales Orders Lifecycle & Automated MRP Verification (`OrdersPage.jsx`)
- **Interactive Order Inspection**: Clicking any order row opens the full order dossier:
  - Header with order tag (`SO-1001`), status badge, priority pill, customer details, and total amount.
  - Multi-product line items table with quantity, unit selling price, total price, and fulfillment source.
  - **Automated Inventory & MRP Validation Report**: Real-time display indicating whether finished goods were 100% in stock (skipping production and reserving specific batches) or generated production requirements with itemized raw material shortages.
  - **Lifecycle Audit Trail**: Full status history timeline documenting all stage advancements with timestamps and notes.
- **Order Creation Modal**: Dynamic multi-item product selector allowing live addition/removal of finished goods, quantity bounding (>= 1), target delivery date, priority, and remarks.
- **Order Actions**:
  - `Approve & Run MRP Check`: Calls `POST /orders/:id/approve` with real-time toast feedback displaying material reservation results.
  - `Cancel Order`: Calls `POST /orders/:id/cancel` with reason prompt, releasing reserved inventory.
  - `Edit Draft Order`: Allows updating priority, delivery date, and remarks via `PATCH /orders/:id`.
- **Status Filter Strip**: Vantus-styled tab bar filtering orders across `All`, `Draft`, `Approved`, `Planned`, `In Production`, `QC Check`, `Ready Ship`, `Dispatched`, `Delivered`, `Cancelled`.

---

## Frontend Redesign Phase 5 — Raw Materials Inventory & Products / BOM MRP

### 1. Raw Materials Warehouse & Stock Adjustments (`RawMaterialsPage.jsx`)
- **Click-to-View & Update**: Clicking any material row opens a Material Dossier modal displaying unit cost, current stock, reserved stock, available quantity, minimum stock thresholds, reorder level, and total asset valuation (`stock * unitCost`). Provides an inline edit form invoking `PATCH /raw-materials/:id` with real-time toast feedback.
- **Interactive Stock Adjustment**: Built-in modal supporting segmented direction toggle (`+ Add Stock` for supplier receipts vs. `- Reduce Stock` for shopfloor consumption or scrap write-off), reason category selector (`purchase`, `material_issue`, `adjustment`, `return`, `scrap`), and audit note logging via `POST /raw-materials/:id/adjust-stock`.
- **Low Stock Filter**: 1-click filter toggle displaying items at or below minimum threshold with soft red highlight rows and warning pills.
- **Add Raw Material Modal**: Standardized dialog with non-negative bounds validation and unit of measure picker.

### 2. Products & Multi-Tier Bill of Materials (`ProductsPage.jsx`)
- **Click-to-View Product & Recipe**: Clicking any finished product row opens the Product Dossier dialog:
  - Header with SKU code (`PRD-CHAIR-101`), category badge, unit selling price, and description.
  - Full BOM Component Recipe table displaying required raw materials, consumption quantity per finished unit, and warehouse availability.
  - Inline Edit Mode: Allows updating product metadata and dynamic BOM ingredients via `PATCH /products/:id`.
- **Interactive MRP Simulation Engine**: Dedicated simulator modal allowing users to enter arbitrary batch order quantities (e.g. 50, 100, 500 units), invoking `GET /products/:id/mrp?quantity=N` to compute:
  - Feasibility status banner (green for 100% sufficient inventory, red for shortages).
  - Ingredient requirement table comparing batch requirements against live stock, with itemized shortage quantities.
- **Add Product & BOM Modal**: Multi-ingredient recipe builder with dynamic line item addition/removal, selling price validation, and toast feedback.
- **Category Filter Strip**: Vantus-styled category pill tabs (`All Categories`, `Office Chairs`, `Executive Desks`, etc.).

---

## Frontend Redesign Phase 6 — Production Planning, Quality Control, and Dispatch Logistics Hub

### 1. Customer Status Filtering & Substring Search Resolution
- **Backend Controller (`customer.controller.js`)**: Updated `getAllCustomers` to support case-insensitive regex search (`$or`) across `companyName`, `contactPerson`, `email`, and `phone` instead of whole-word-only text index matching. Added robust parsing for both `isActive` (`String(isActive) === "true"`) and `status` (`status === "active"`).
- **Frontend Master (`CustomersPage.jsx`)**: Connected search state into `fetchCustomers` query params alongside status filter keys (`params.status` and `params.isActive`). Seeded database with both active (23) and inactive (2) accounts so filtering can be verified immediately.

### 2. Shop Floor Scheduling & 6-Stage Production Execution (`ProductionPage.jsx`)
- **Vantus Light Aesthetic**: Clean white cards, soft slate borders, Poppins headers, Open Sans body, and 4 KPI summary cards (Active In-Flight, Completed Batches, Produced Units, Scrap/Rejection Rate).
- **Click-to-View Production Plan Dossier**:
  - Interactive 6-stage lifecycle stepper: `Planned` → `Material Issued` → `Manufacturing` → `Assembly` → `Packaging` → `Completed`.
  - Comprehensive operational details: Target, produced, and rejected quantities, machine allocation, shift, operator, supervisor, and linked sales order.
  - Audit trail timeline displaying all historical stage transitions with actor attribution and remarks.
  - Inline Edit Plan Setup (`PATCH /production-plans/:id`) allowing updates to machine, shift, operator, supervisor, dates, and setup notes.
- **Advance Stage Modal**: Selects next logical manufacturing stage, records produced and rejected scrap units with non-negative bounds validation, and triggers toast notifications.
- **Schedule Production Run Modal**: Binds approved sales orders to BOM recipes, assigns workstation machines, shifts (`morning`, `evening`, `night`), operator, and dates via `POST /production-plans`.
- **Stage Filter Strip**: Interactive pill tabs filtering runs across `All`, `Planned`, `Material Issued`, `Manufacturing`, `Assembly`, `Packaging`, `Completed`, and `Cancelled`.

### 3. Quality Control (QC) Station & 4-Point Certification (`QualityControlPage.jsx`)
- **Vantus Light Aesthetic**: 4 KPI summary cards (First-Pass Yield %, Passed Batches, Awaiting Inspection, Rework/Rejected Count).
- **Pending QC Queue Banner**: Highlights completed manufacturing runs awaiting inspection, with 1-click "Inspect Batch" quick actions that pre-fill inspection forms.
- **Click-to-View Quality Inspection Dossier**:
  - Inspection #, linked product, sales order reference, inspector name, and inspection date.
  - Pass/fail yield metrics with percentage bar.
  - Generated Finished Goods (FG) Batch number badge (`FG-YYYYMMDD-XXXX`).
  - 4-point parameter checklist cards: Visual Inspection, Dimensional Accuracy, Weight Verification, and Surface Finish.
  - Inspector notes and observations.
- **Record QC Inspection Modal (`POST /quality-inspections`)**:
  - Production run selector auto-calculating output quantities.
  - Inspected, passed, and failed quantity inputs with sum validation (`passed + failed <= inspected`).
  - Interactive pass/fail toggle switches for all 4 quality parameters.
  - Overall outcome selector (`passed`, `rework_required`, `rejected`).
  - Real-time toast feedback: Approving a batch automatically generates a new FG inventory batch and advances linked sales order to `ready_for_dispatch`.
- **Search & Outcome Tabs**: Filters inspections across `All`, `Passed`, `Rework Required`, and `Rejected`.

### 4. Dispatch Logistics & Carrier Milestone Hub (`DispatchPage.jsx`)
- **Vantus Light Aesthetic**: 4 KPI summary cards (In Transit, Delivered Orders, Ready for Dispatch, Pending Waybills).
- **Ready for Dispatch Banner**: Dynamic queue of orders certified by QC in `ready_for_dispatch` status, with 1-click "Ship Order" quick dispatch buttons.
- **Click-to-View Dispatch Dossier & Carrier Timeline**:
  - Consignment #, Waybill Invoice #, Tracking #, Courier provider, vehicle plate, and driver contact info.
  - Consignment manifest table listing shipped finished goods batches and quantities.
  - Interactive Carrier Milestones & Telematics timeline displaying milestone progression with timestamps and locations.
  - In-dossier **"Advance Milestone"** action (`POST /dispatches/:id/simulate-progress`) simulating carrier steps (`in_transit` → `out_for_delivery` → `delivered`) with immediate timeline re-rendering.
  - In-dossier **"Deliver"** action (`POST /dispatches/:id/deliver`) closing the full order lifecycle.
- **Create Dispatch Modal (`POST /dispatches`)**:
  - Order picker from `ready_for_dispatch` orders.
  - Carrier selection (`FloData Express`, `Blue Dart`, `Delhivery`, `DTDC`, `FedEx Supply Chain`).
  - Driver name validation (alphabetic 2-50 chars) and 10-digit phone number validation.
  - Immediate FG batch deduction and order status transition to `dispatched`.
- **Public / Live Tracking Lookup Bar**: Quick search by tracking number calling `GET /dispatches/track/:trackingNumber` and opening the tracking timeline modal.
- **Filter Tabs**: Filter dispatches across `All`, `Pending`, `In Transit`, `Out for Delivery`, and `Delivered`.

---

## Frontend Redesign Phase 7 — Executive Reports & System Security Audit Hub

### 1. Executive Reports & Manufacturing Intelligence (`ReportsPage.jsx`)
- **Vantus Light Aesthetic**: Clean white cards, formatted INR currency (`₹`), numbers formatted with commas (`toLocaleString()`), and top action bar with **Print / Export Report** (`window.print()`), Refresh, and Date Range Filter controls (`startDate`, `endDate`).
- **6 Comprehensive Report Modules**:
  1. **Sales & Revenue Performance**: Total Orders, Gross Revenue, and Average Order Value KPI cards, Top 10 Revenue-Generating Finished Goods table, and Top 10 Enterprise Clients spend ranking.
  2. **Inventory Valuation & Asset Holding**: Combined Enterprise Asset Valuation hero banner (`₹` total), Raw Materials vs. Finished Goods asset breakdown cards, and Warehouse Storage Bay location valuation breakdown.
  3. **Production & Scrap Defect Audit**: Scheduled Runs, Planned Units, Produced Units, Scrap Rate % gauge KPI, and Machine Workstation performance table with produced vs. rejected yield metrics.
  4. **Raw Material Consumption**: Total Material Consumption Expenditure KPI card, and Consumed Materials ranked by total cost table with unit costs, physical consumption, and issuance frequency.
  5. **Dispatch Logistics Performance**: Total Dispatches, Delivered Shipments, and In-Transit KPIs, with Carrier Partner Performance table tracking assigned shipments, delivered packages, and SLA fulfillment rates.
  6. **Low Stock Replenishment Planning**: Critical Safety Threshold Alerts KPI, Total Estimated Replenishment Procurement Cost, and Reorder Planning table comparing current stock against minimum thresholds and computing recommended reorder units and procurement budgets.

### 2. User Management & Security Audit (`UsersAuditPage.jsx`)
- **Admin Access Gate**: Non-admin users are greeted with a clean, friendly security banner explaining that Admin privileges are required, with advice on using the role switcher.
- **Segmented Dual Tabs**:
  - `System Users & RBAC Accounts`
  - `Immutable Security Audit Stream`
- **System Users Directory**:
  - 4 KPI cards: Total Users, Active Accounts, Deactivated Accounts, RBAC Roles.
  - Search by name or email, plus role filter pill tabs (`All`, `admin`, `sales_executive`, `inventory_manager`, `production_manager`, `quality_inspector`, `dispatch_manager`).
  - Directory table displaying user initials avatar, name, email, department role badge, account status badge (`ACTIVE` / `DEACTIVATED`), and registration date.
  - 1-click **Activate / Deactivate** account status toggle (`PATCH /auth/users/:userId/toggle-status`) with toast confirmation.
  - **Click-to-View User Profile & RBAC Dossier Modal**: Displays user identity details and the complete functional authorization matrix for their assigned department.
- **Immutable Security Audit Stream**:
  - Filter by action pills (`All`, `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `STAGE_CHANGE`) and search input.
  - Audit stream table with formatted timestamp, colored action badge, target resource identifier, actor name & role, and client IP address.
  - **Click-to-View Audit Entry Inspection Modal**: Inspects full contextual JSON payload, operation metadata, and actor attribution.
