# FloData ERP — End-to-End Project Explanation & Video Demonstration Script

This document is your complete guide for recording the **3–7 minute walkthrough video** and presenting the FloData ERP system. It provides an exact scene-by-scene script, talking points, on-screen actions, and detailed answers to the data reasoning questions required by the assignment.

---

## 1. Video Recording Setup & Checklist

- **Target Video Duration**: 5 to 7 minutes.
- **Recording Software**: Loom, OBS Studio, or Windows Screen Recorder (`Win + Alt + R`).
- **Prerequisites Running Before Recording**:
  1. Backend running: `cd backend && npm run dev` (Port `8000`).
  2. Frontend running: `cd frontend && npm run dev` (Port `5173`).
  3. Browser open at: `http://localhost:5173`.
- **Demo Logins** (All passwords are `Password@123`):
  - Admin: `admin@flodata.com`
  - Sales Executive: `sales@flodata.com`
  - Inventory Manager: `inventory@flodata.com`
  - Production Manager: `production@flodata.com`
  - Quality Inspector: `qc@flodata.com`
  - Dispatch Manager: `dispatch@flodata.com`
- **Recommended Setup**: Log in as `admin@flodata.com`. You can showcase all modules directly with full administrator privileges, and highlight the user profile modal and department permission matrix.

---

## 2. Step-by-Step Video Walkthrough Script

### Scene 1: Introduction & Architecture Overview (0:00 – 0:45)
- **Screen to Show**: FloData ERP Dashboard (`http://localhost:5173`).
- **On-Screen Action**: Hover over the executive KPI cards, the collapsible left sidebar, and the 9-stage pipeline stepper.
- **What to Say**:
  > *"Hello everyone! Today I am presenting **FloData ERP**, an enterprise-grade discrete manufacturing platform built specifically for manufacturing companies that transform raw materials into finished goods.*
  >
  > *This full-stack application connects all 5 core manufacturing departments—**Sales, Inventory, Production, Quality Control, and Dispatch**—into a unified workflow with strict Role-Based Access Control.*
  >
  > *On the technology side, the backend is powered by **Node.js, Express, and MongoDB**, featuring 11 data models, JWT authentication, and an automated Material Requirements Planning (MRP) engine. The frontend is built with **React 19, Vite, and Tailwind CSS**, adhering to a modern, light-mode executive aesthetic with custom typography (Poppins and Open Sans), interactive modal dossiers, and real-time toast feedback."*

---

### Scene 2: Authentication & Role-Based Access Control (RBAC) (0:45 – 1:30)
- **Screen to Show**: Left sidebar user profile card & the User Profile modal.
- **On-Screen Action**: Click the User Profile card at the bottom of the sidebar to open the `UserProfileModal`. Point out the active user role, email, and the complete Department Functional Authorization Matrix.
- **What to Say**:
  > *"First, let's look at Authentication and Role-Based Access Control. Security is enforced with JSON Web Tokens (Access and Refresh tokens) stored securely in HTTP-only cookies and bcrypt password hashing.*
  >
  > *The system supports 6 distinct roles: System Administrator, Sales Executive, Inventory Manager, Production Manager, Quality Inspector, and Dispatch Manager.*
  >
  > *Notice how the sidebar navigation dynamically adapts based on the active user's permissions. For example, a Sales Executive only sees Customer Management and Sales Orders, while a Production Manager accesses BOM recipes, machine scheduling, and execution tracking.*
  >
  > *I've also built an interactive User Profile modal where staff can inspect their assigned permissions matrix and session details."*

---

### Scene 3: Customer Master & Sales Order Creation (1:30 – 2:30)
- **Screen to Show**: Customers Page (`/customers`) then Orders Page (`/orders`).
- **On-Screen Action**:
  1. Go to **Customers**: Show search, active/inactive filter tabs, and click any customer row to open their profile dossier.
  2. Go to **Sales Orders**: Click **"+ Create Sales Order"**, select a customer, add multiple line items with products and quantities, set priority to `High`, and submit.
- **What to Say**:
  > *"Now, let's begin the manufacturing journey with Customer Management and Sales Orders.*
  >
  > *In the Customer Master, we maintain corporate client records with strict 10-digit phone validation, 15-character Indian GSTIN verification, and separate billing and shipping addresses.*
  >
  > *Now let's switch to Sales Orders. A Sales Executive can draft orders with multiple line items. Let's create an order for 50 Ergonomic Chairs and 20 Executive Desks.*
  >
  > *Notice that every order starts in the `Draft` stage of our **9-stage closed-loop lifecycle**."*

---

### Scene 4: Automated Inventory Check & MRP Verification (2:30 – 3:30)
- **Screen to Show**: Orders Page (`/orders`).
- **On-Screen Action**: Click on the draft order you just created to open the Order Dossier modal. Click the **"Approve & Run MRP Check"** button. Point out the toast notification and the MRP verification report inside the modal.
- **What to Say**:
  > *"Here is one of the most powerful features of FloData ERP: our **Automated Inventory & MRP Verification Engine**.*
  >
  > *When a sales executive clicks 'Approve', the backend immediately checks existing Finished Goods batches in the warehouse.*
  >
  > *If finished goods are already available in stock, the system reserves them and skips production entirely, moving the order straight to `Ready for Dispatch`.*
  >
  > *However, if stock is insufficient, the system automatically pulls the multi-tier Bill of Materials (BOM) for each product, evaluates raw material stock levels, checks for shortages, reserves the available raw materials, and advances the order to `Production Planned`.*
  >
  > *We also provide an interactive MRP Simulator on the Products page where managers can input any batch quantity to view exact material feasibility and itemized shortages before scheduling production."*

---

### Scene 5: Shopfloor Production Planning & 6-Stage Manufacturing Execution (3:30 – 4:30)
- **Screen to Show**: Production Page (`/production`).
- **On-Screen Action**:
  1. Show the 4 KPI cards (*Active In-Flight*, *Completed Batches*, *Produced Units*, *Scrap Rate*).
  2. Click a plan to open the dossier modal with the **6-stage visual pipeline stepper**.
  3. Click **"Advance Stage"** on a plan (e.g. advance from `Planned` to `Material Issued`, or `Material Issued` to `Manufacturing`).
- **What to Say**:
  > *"Next, the order enters the Shopfloor Production Planning hub.*
  >
  > *The Production Manager assigns workstation machines (like CNC lines or Assembly bays), operators, supervisors, and shifts—Morning, Evening, or Night.*
  >
  > *Execution follows a strict **6-stage state machine**: Planned → Material Issued → Manufacturing → Assembly → Packaging → Completed.*
  >
  > *Crucially, when a plan transitions to `Material Issued`, raw materials are physically deducted from inventory and logged in the immutable transaction ledger. This mirrors real factory floors where materials are committed to the machines.*
  >
  > *At each stage, operators record produced units versus rejected scrap, giving us real-time yield and scrap rate tracking. Once marked `Completed`, the order automatically advances to Quality Check."*

---

### Scene 6: Quality Control (QC) Station & Batch Certification (4:30 – 5:15)
- **Screen to Show**: Quality Control Page (`/qc`).
- **On-Screen Action**:
  1. Point out the top **"Pending Inspection Queue"** banner showing completed runs awaiting QC.
  2. Click **"Inspect Batch"** on a pending run.
  3. Show the 4-point parameters (Visual, Dimensions, Weight, Finish), keep them on `Pass`, and click **"Submit Inspection"**.
  4. Show the toast: A new Finished Goods batch number (`FG-YYYYMMDD-XXXX`) has been generated!
- **What to Say**:
  > *"Now we move to Quality Control. Notice the top banner highlighting batches awaiting inspection.*
  >
  > *Inspectors evaluate manufactured batches against 4 rigorous physical parameters: Visual Inspection, Dimensional Accuracy, Weight Verification, and Surface Finish.*
  >
  > *If a batch passes, the backend automatically generates a new **Finished Goods Batch number**, deposits the inventory into the warehouse, and advances the linked Sales Order to `Ready for Dispatch`.*
  >
  > *If defects are found, inspectors can flag the batch as `Rework Required`, sending it back to assembly, or mark it as `Rejected` for scrap recording."*

---

### Scene 7: Dispatch Logistics & Fake Carrier Simulation (5:15 – 6:00)
- **Screen to Show**: Dispatch Page (`/dispatch`).
- **On-Screen Action**:
  1. Show the **"Orders Ready for Dispatch"** queue.
  2. Click **"Create Dispatch"** or click on an existing dispatch.
  3. Click **"Advance Milestone"** to simulate the carrier step (`in_transit` → `out_for_delivery` → `delivered`).
  4. Copy a tracking number and paste it into the **"Track Consignment"** lookup bar to show public live tracking.
- **What to Say**:
  > *"Once orders are certified by QC, they enter Dispatch Logistics.*
  >
  > *The Dispatch Manager assigns courier partners (like FloData Express, Blue Dart, or Delhivery), vehicle license plates, and validated driver details. Creating a dispatch automatically decrements the finished goods batches using FIFO logic and generates an invoice and tracking number.*
  >
  > *To test logistics without depending on external courier APIs, we built a **Fake Carrier Simulation Engine**.*
  >
  > *Clicking 'Advance Milestone' simulates GPS telematics events—from manifest created to picked up, in transit, out for delivery, and delivered.*
  >
  > *When marked `Delivered`, the linked Sales Order automatically completes its 9th and final stage! We also provide a public tracking route where clients can inspect their shipment timeline without logging in."*

---

### Scene 8: Executive Reports, Audit Stream & Conclusion (6:00 – 6:45)
- **Screen to Show**: Reports Page (`/reports`) and Users/Audit Page (`/audit`).
- **On-Screen Action**:
  1. Quickly toggle across a couple of report tabs: **Sales Performance**, **Inventory Valuation**, and **Low Stock Replenishment**. Click **"Print / Export"** to show window print formatting.
  2. Open the **Security Audit Stream** to show immutable logging of every operation with timestamps, user attribution, and IP addresses.
- **What to Say**:
  > *"Finally, management intelligence. The Reports module provides 6 analytical reports covering Sales Revenue, Total Inventory Asset Valuation across warehouses, Machine Scrap Rates, Material Consumption costs, and Low Stock Replenishment budgets.*
  >
  > *Everything across the platform is backed by dual-layer immutable ledgers: an Inventory Transaction Ledger recording every stock delta, and an Audit Log capturing all user actions, logins, and stage overrides with timestamps and IP addresses.*
  >
  > *In conclusion, FloData ERP provides a complete, robust, and production-ready manufacturing solution that models real-world discrete manufacturing workflows from order intake to doorstep delivery. Thank you!"*

---

## 3. Data Reasoning & Demo Dataset Architecture

In your video or written submission, you must be prepared to answer why the demo data was designed this way. Here are the structured explanations addressing every assignment prompt:

### Part A: Why These Products, Customers, Order Quantities, Dates, and Status Distribution Were Chosen

#### 1. Why 100 SKUs Across 6 Product Categories?
- **Choice**: 100 distinct finished goods divided into:
  - *Office Chairs* (Task chairs, executive high-back, mesh ergonomic chairs)
  - *Executive Desks* (L-shaped workstations, solid wood manager desks)
  - *Storage Cabinets* (2-drawer pedestals, steel filing cabinets, credenzas)
  - *Conference Tables* (10-seater boardroom tables, modular meeting tables)
  - *Workstations* (4-pod linear cubicles, height-adjustable standing desks)
  - *Accessories* (Monitor arms, cable trays, keyboard drawers)
- **Reasoning**:
  - Discrete manufacturing typically involves assembly of structured parts (tubes, fasteners, boards, mechanisms). Furniture manufacturing provides an intuitive, realistic domain where Bills of Materials (BOMs) have clear hierarchical dependencies.
  - Having 100 SKUs ensures that search filters, pagination, category tabs, and MRP simulations test real database indexing and frontend rendering performance rather than trivial 2-item lists.

#### 2. Why 25 B2B Corporate Customers?
- **Choice**: Enterprise clients across Tier-1 and Tier-2 Indian commercial hubs (Mumbai, Bengaluru, Delhi NCR, Hyderabad, Pune, Chennai) with realistic names (e.g., *Apex Furniture Solutions*, *Zenith Tech Parks*, *Nexus Workspace Solutions*), distinct contact persons, and 15-character GSTINs.
- **Reasoning**:
  - Manufacturing ERPs do not serve direct retail consumers; they serve B2B corporate buyers, educational institutions, and logistics parks with separate billing entities and delivery warehouses.
  - 25 clients allow customer search, active/inactive filtering, and customer spend ranking reports to exhibit genuine variance.

#### 3. Why These Order Quantities (5 to 500 units)?
- **Choice**: Quantities range from small sample orders (5–10 units) to typical departmental office outfitting (20–100 units) and large corporate procurement contracts (250–500 units).
- **Reasoning**:
  - Small orders demonstrate direct fulfillment from available finished goods inventory.
  - Large orders (e.g. 500 chairs requiring 1,000 steel tubes, 4,000 screws, and 500 cushions) intentionally exceed warehouse stock to demonstrate Material Requirements Planning (MRP), shortage detection, and production requirement generation.

#### 4. Why This Chronological Date Distribution?
- **Choice**: Orders and transactions are distributed across the last 90 days up to the current date.
- **Reasoning**:
  - Real manufacturing businesses have historical orders that are already fulfilled and active orders currently in flight.
  - Spreading timestamps across a 90-day horizon allows the analytical reports (monthly sales revenue, machine output over time, and dispatch delivery SLAs) to display meaningful, realistic historical curves rather than artificial single-day spikes.

#### 5. Why This Order Status Distribution (800 Dispatched / 200 In-Flight)?
- **Choice**: Out of 1,000 total sales orders:
  - **800 orders** are in `dispatched` or `delivered` status, backed by linked dispatch consignments, tracking numbers, driver manifests, and finished goods deduction transactions.
  - **200 orders** are systematically distributed across the active pipeline:
    - `draft` (newly entered bids)
    - `approved` (pending inventory verification)
    - `inventory_checked` (evaluated by MRP engine)
    - `production_planned` (scheduled on machine lines)
    - `in_production` (undergoing machining, assembly, or packaging)
    - `quality_check` (completed runs awaiting QA sign-off)
    - `ready_for_dispatch` (QC passed, boxed, and waiting for carrier pickup)
    - `cancelled` (demonstrating inventory reservation rollback)
- **Reasoning**:
  - An active manufacturing company always has 80–85% of its cumulative order volume in fulfilled historical status, while 15–20% is in active factory progression.
  - This ensures every single module in the application (Production queue, QC queue, Ready-for-Dispatch drawer, and Dashboard KPI counters) has live, interactive data to demonstrate without having to manually create records from scratch.

---

### Part B: Operational Scenarios Demonstrated by the Dataset

The seed data was specifically engineered to demonstrate 5 distinct operational edge-cases:

1. **Available Finished Goods (Direct Fulfillment — Bypassing Production)**:
   - *Data State*: 35 Finished Goods batches exist in warehouse storage bays.
   - *Demonstration*: When an order is placed for an in-stock product with quantity ≤ available batch quantity, approving the order reserves the finished goods immediately, changes fulfillment source to `inventory`, and advances the order directly to `ready_for_dispatch` without wasting factory capacity.

2. **Raw Material Shortages & MRP Shortage Alerts**:
   - *Data State*: Several high-demand components (e.g. specialized mesh fabric or veneer oak tops) have stock levels below large batch requirements.
   - *Demonstration*: Running an MRP simulation for 200 executive desks highlights negative delta quantities, triggers low-stock alerts, and lists exact procurement shortages required before releasing work orders.

3. **Production Requirements & 6-Stage Manufacturing Progression**:
   - *Data State*: 100 production plans exist across various stages (`planned`, `material_issued`, `manufacturing`, `assembly`, `packaging`).
   - *Demonstration*: Proves that raw materials are physically deducted on `material_issued`, workstation machine allocation operates across 3 shifts, and scrap/scrap defect rates are tracked per run.

4. **Quality Control Failures & Defect Management**:
   - *Data State*: The dataset includes inspections with `passed`, `rework_required`, and `rejected` outcomes.
   - *Demonstration*: Proves that only batches passing all 4 parameters (`visual`, `dimensions`, `weight`, `finish`) generate Finished Goods batches and unlock dispatch, while failed batches are quarantined or sent back for assembly rework.

5. **Dispatch Logistics & Real-Time Inventory Decrement**:
   - *Data State*: 800 historical dispatches linked to sales orders.
   - *Demonstration*: Verifies that dispatch creation automatically reduces finished goods stock using First-In-First-Out (FIFO) batch deduction, generates waybills and commercial invoices, and logs an `InventoryTransaction`.

---

### Part C: Consistency of Related Records & Fake Carrier Integration

#### 1. How Related Records Remain Consistent
- **Referential Integrity**:
  - Every `SalesOrder` references a valid `Customer` and `Product`.
  - Every `ProductionPlan` references an approved `SalesOrder` and the product's `BOM`.
  - Every `FinishedGood` batch links back to its originating `ProductionPlan` and certified `QualityInspection`.
  - Every `Dispatch` references the exact `FinishedGood` batch numbers decremented.
- **Stock Invariant Formulas**:
  - `Available Stock = Physical Current Stock - Reserved Quantity`.
  - At no point can physical stock be negative; validations enforce non-negative bounds across all models.
- **Rollback Consistency**:
  - Cancelling an approved order automatically decrements `reservedQuantity` on the raw materials or finished goods, returning uncommitted stock back to the available pool.

#### 2. How the Fake Carrier Fits into the Dispatch Workflow
- In real-world enterprise ERPs (like SAP or Oracle SCM), ERPs do not handle physical vehicle GPS themselves; they integrate with carrier APIs (like FedEx, Blue Dart, or Delhivery Webhooks) that push telematics updates.
- To simulate this realistically without requiring paid third-party API keys or internet webhooks:
  1. Creating a dispatch initializes carrier timeline events: `manifest_created` and `picked_up`.
  2. The **Fake Carrier Simulation Engine** (`carrier.service.js`) generates realistic Indian logistics tracking numbers (e.g. `TRK-FloData-XXXXXXXX` or `TRK-Delhivery-XXXXXXXX`).
  3. Clicking **"Advance Milestone"** simulates the carrier pinging back an API event: appending city locations (e.g. "Arrived at Bhiwandi Sorting Hub") and transitioning the status:
     `in_transit` → `out_for_delivery` → `delivered`.
  4. Once `delivered` is triggered by the carrier engine, the linked `SalesOrder` automatically updates its final status to `delivered`, closing the entire discrete manufacturing order loop.
  5. The public tracking route (`GET /dispatches/track/:trackingNumber`) allows clients to track consignments without authentication, exactly like consumer courier tracking portals.

---

## 4. Quick Cheatsheet: What to Click During the Recording

| Step | Page to Navigate | Action on Screen | Key Highlight to Mention |
| :---: | :--- | :--- | :--- |
| **1** | `/` (Dashboard) | Hover on KPI cards and 9-stage pipeline | Discrete manufacturing scope & light-mode Vantus UI |
| **2** | Sidebar (Any page) | Click user profile card to open modal | JWT auth, 6 RBAC roles, department permission matrix |
| **3** | `/customers` | Filter by `Active` / `Inactive`; click a row | Strict 10-digit phone and 15-char GSTIN validation |
| **4** | `/orders` | Click **"+ Create Sales Order"** | Draft multi-item order in 9-stage lifecycle |
| **5** | `/orders` | Click **"Approve & Run MRP Check"** | Automated inventory check: reserves FG or triggers BOM MRP |
| **6** | `/products` | Click **"MRP Simulator"** modal | Batch feasibility calculation and shortage detection |
| **7** | `/production` | Click a plan; click **"Advance Stage"** | 6-stage execution, stock deduction on material issue |
| **8** | `/qc` | Click **"Inspect Batch"** from pending queue | 4-point QA evaluation, generates `FG-...` batch |
| **9** | `/dispatch` | Click **"Advance Milestone"** on shipment | Carrier telematics simulation & public tracking lookup |
| **10**| `/reports` | Switch tabs (Sales, Inventory, Low Stock) | Asset valuation in INR, scrap rates, and print export |
| **11**| `/audit` | Switch to **Security Audit Stream** tab | Immutable activity ledger with timestamps & IP addresses |
