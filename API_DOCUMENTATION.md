# FloData ERP — API Documentation & Role-Based Access Control (RBAC)

This document provides complete reference documentation for all REST API endpoints implemented in the **FloData ERP Discrete Manufacturing Platform**.

---

## 1. Global API Architecture & Conventions

- **Base URL**: `http://localhost:8000/api/v1`
- **Content Type**: `application/json`
- **Authentication**: Bearer Token in `Authorization` header (`Bearer <accessToken>`) OR HTTP-only cookie (`accessToken`).
- **Standard Success Response Format (`ApiResponse`)**:
  ```json
  {
    "statusCode": 200,
    "data": { ... },
    "message": "Resource fetched successfully",
    "success": true
  }
  ```
- **Standard Error Response Format (`ApiError`)**:
  ```json
  {
    "statusCode": 400,
    "message": "Validation error or business logic exception",
    "success": false,
    "errors": []
  }
  ```

---

## 2. Role-Based Access Control (RBAC) Matrix

The system enforces strict operational segregation across 6 discrete manufacturing departments:

| Module / Endpoint Category | Admin (`admin`) | Sales Exec (`sales_executive`) | Inventory Mgr (`inventory_manager`) | Production Mgr (`production_manager`) | Quality Inspector (`quality_inspector`) | Dispatch Mgr (`dispatch_manager`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Auth & Session Management** | Full | Self | Self | Self | Self | Self |
| **User RBAC & Status Control** | Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Executive Dashboard KPIs** | Read | Read | Read | Read | Read | Read |
| **Customer Master Management** | Full | Full | ❌ | ❌ | ❌ | Read |
| **Raw Materials Catalog & Stock** | Full | ❌ | Full | Read | ❌ | ❌ |
| **Products & Multi-Tier BOM** | Full | Read | Read | Full | ❌ | ❌ |
| **MRP Shortage Simulation** | Full | Full | Full | Full | ❌ | ❌ |
| **Sales Orders (Draft & Submit)**| Full | Full | ❌ | ❌ | ❌ | ❌ |
| **Sales Orders (Approve / Cancel)**| Full | Full | ❌ | ❌ | ❌ | ❌ |
| **Sales Orders (Directory Read)**| Read | Read | Read | Read | ❌ | Read |
| **Finished Goods Batches** | Full | Read | Full | Read | ❌ | Read |
| **Production Plan Scheduling** | Full | ❌ | ❌ | Full | ❌ | ❌ |
| **Manufacturing Stage Execution** | Full | ❌ | ❌ | Full | ❌ | ❌ |
| **Production Visibility (Read)** | Read | Read | Read | Read | Read | ❌ |
| **Quality Inspections (Record)** | Full | ❌ | ❌ | ❌ | Full | ❌ |
| **Dispatch & Shipment Creation** | Full | ❌ | ❌ | ❌ | ❌ | Full |
| **Carrier Telematics Simulation**| Full | ❌ | ❌ | ❌ | ❌ | Full |
| **Public Shipment Tracking** | Public | Public | Public | Public | Public | Public |
| **Inventory Transaction Ledger**| Read | ❌ | Read | Read | ❌ | ❌ |
| **Sales Reports** | Read | Read | ❌ | ❌ | ❌ | ❌ |
| **Inventory Valuation Reports** | Read | ❌ | Read | Read | ❌ | ❌ |
| **Production & Scrap Reports** | Read | ❌ | ❌ | Read | ❌ | ❌ |
| **Material Consumption Reports** | Read | ❌ | Read | Read | ❌ | ❌ |
| **Dispatch Performance Reports**| Read | Read | ❌ | ❌ | ❌ | Read |
| **Low-Stock Replenishment Reports**| Read | ❌ | Read | Read | ❌ | ❌ |
| **System Security Audit Trail** | Full | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Detailed Endpoint Documentation

### 3.1. Authentication & Session Management (`/auth`)

#### `POST /auth/register`
- **Access**: Public
- **Description**: Registers a new system account.
- **Request Body**:
  ```json
  {
    "name": "Arjun Sharma",
    "email": "arjun@flodata.com",
    "password": "Password@123",
    "role": "production_manager"
  }
  ```
- **Response**: `201 Created` with created user object (excluding password).

#### `POST /auth/login`
- **Access**: Public
- **Description**: Authenticates user credentials, sets HTTP-only cookies, and returns JWT tokens.
- **Request Body**:
  ```json
  {
    "email": "admin@flodata.com",
    "password": "Password@123"
  }
  ```
- **Response**: `200 OK` with `accessToken`, `refreshToken`, and user identity object.

#### `POST /auth/refresh-token`
- **Access**: Public
- **Description**: Generates new `accessToken` using valid `refreshToken` in request body or cookie.

#### `POST /auth/logout`
- **Access**: Authenticated (Any role)
- **Description**: Clears session cookies and removes refresh token from database.

#### `GET /auth/me`
- **Access**: Authenticated (Any role)
- **Description**: Returns authenticated profile of the current active session.

#### `PATCH /auth/change-password`
- **Access**: Authenticated (Any role)
- **Request Body**: `{ "oldPassword": "...", "newPassword": "..." }`

#### `GET /auth/users`
- **Access**: `admin`
- **Description**: Returns list of all system accounts with roles and status.

#### `PATCH /auth/users/:userId/toggle-status`
- **Access**: `admin`
- **Description**: Toggles active/deactivated state of a user account.

---

### 3.2. Dashboard Command Center (`/dashboard`)

#### `GET /dashboard/kpis`
- **Access**: Authenticated (Any role)
- **Description**: Returns aggregated executive KPI stats, 9-stage order counts, recent orders, inventory valuation, and live audit feed.
- **Response Structure**:
  ```json
  {
    "summary": {
      "totalOrders": 1000,
      "pendingOrders": 35,
      "inProduction": 12,
      "lowStockMaterials": 4,
      "readyForDispatch": 8,
      "totalRevenue": 48250000
    },
    "inventoryValuation": {
      "rawMaterialsValuation": 18500000,
      "finishedGoodsValuation": 12400000,
      "totalValuation": 30900000
    },
    "orderPipeline": [ ... ],
    "recentOrders": [ ... ],
    "recentActivity": [ ... ]
  }
  ```

---

### 3.3. Customer Master (`/customers`)

#### `POST /customers`
- **Access**: `admin`, `sales_executive`
- **Description**: Creates a new commercial customer account.
- **Validation**:
  - `contactPerson`: 2–50 characters, letters and spaces only.
  - `phone`: Exactly 10 digits.
  - `email`: Valid email syntax.
  - `gstNumber`: Valid 15-character Indian GSTIN (e.g. `27AAACA1234A1Z5`).
- **Request Body**:
  ```json
  {
    "companyName": "Apex Furniture Solutions Pvt Ltd",
    "contactPerson": "Rajesh Sharma",
    "email": "rajesh@apexfurniture.com",
    "phone": "9820123456",
    "gstNumber": "27AAACA1234A1Z5",
    "billingAddress": {
      "street": "Plot 42, MIDC Industrial Area",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400093",
      "country": "India"
    },
    "shippingAddress": { ... }
  }
  ```

#### `GET /customers`
- **Access**: `admin`, `sales_executive`, `dispatch_manager`
- **Query Parameters**:
  - `search`: Substring search across company name, contact person, email, and phone.
  - `isActive`: `"true"` | `"false"`.
  - `status`: `"active"` | `"inactive"`.
  - `page`: Page number (default `1`).
  - `limit`: Items per page (default `10`).

#### `GET /customers/:id`
- **Access**: `admin`, `sales_executive`, `dispatch_manager`
- **Description**: Fetches detailed customer record with billing & shipping addresses.

#### `PATCH /customers/:id`
- **Access**: `admin`, `sales_executive`
- **Description**: Updates customer profile information.

#### `PATCH /customers/:id/toggle-status`
- **Access**: `admin`, `sales_executive`
- **Description**: Toggles customer active / deactivated state.

---

### 3.4. Raw Materials Inventory (`/raw-materials`)

#### `POST /raw-materials`
- **Access**: `admin`, `inventory_manager`
- **Description**: Creates a new raw material component SKU.
- **Request Body**:
  ```json
  {
    "materialCode": "RM-STL-01",
    "name": "Steel Tube 25mm Round",
    "unit": "meter",
    "currentStock": 5000,
    "minimumStockLevel": 500,
    "reorderLevel": 1000,
    "unitPrice": 85,
    "warehouse": "Bay A - Metals"
  }
  ```

#### `GET /raw-materials`
- **Access**: `admin`, `inventory_manager`, `production_manager`
- **Query Parameters**: `search`, `lowStock` (`"true"`), `warehouse`, `page`, `limit`.

#### `GET /raw-materials/:id`
- **Access**: `admin`, `inventory_manager`, `production_manager`
- **Description**: Fetches material details including virtual `availableQuantity`.

#### `PATCH /raw-materials/:id`
- **Access**: `admin`, `inventory_manager`
- **Description**: Modifies material metadata, minimum stock thresholds, or unit prices.

#### `POST /raw-materials/:id/adjust-stock`
- **Access**: `admin`, `inventory_manager`
- **Description**: Directly adds or reduces physical stock and writes to the immutable `InventoryTransaction` ledger.
- **Request Body**:
  ```json
  {
    "quantityChange": 250,
    "reason": "purchase",
    "remarks": "Received supplier batch PO-9812"
  }
  ```
- **Valid Reasons**: `purchase`, `material_issue`, `adjustment`, `scrap`, `return`.

---

### 3.5. Products & Multi-Tier Bill of Materials (BOM) (`/products`)

#### `POST /products`
- **Access**: `admin`, `production_manager`
- **Description**: Defines a finished product and binds its component BOM recipe.
- **Request Body**:
  ```json
  {
    "productCode": "PRD-CHAIR-101",
    "name": "Ergonomic Task Chair",
    "category": "Office Chairs",
    "unitSellingPrice": 6500,
    "description": "Adjustable lumbar support task chair with dual castors",
    "bom": [
      { "rawMaterial": "66f1234...", "quantity": 2.5, "unit": "meter" },
      { "rawMaterial": "66f5678...", "quantity": 1, "unit": "pcs" },
      { "rawMaterial": "66f9012...", "quantity": 5, "unit": "set" }
    ]
  }
  ```

#### `GET /products`
- **Access**: `admin`, `production_manager`, `sales_executive`, `inventory_manager`
- **Query Parameters**: `search`, `category`, `page`, `limit`.

#### `GET /products/:id`
- **Access**: `admin`, `production_manager`, `sales_executive`, `inventory_manager`
- **Description**: Returns product details populated with raw material BOM references.

#### `PATCH /products/:id`
- **Access**: `admin`, `production_manager`
- **Description**: Updates product specifications, pricing, or BOM ingredient requirements.

#### `GET /products/:id/mrp`
- **Access**: `admin`, `sales_executive`, `production_manager`
- **Description**: Simulates production feasibility for a specified batch quantity.
- **Query Parameters**: `quantity` (e.g. `?quantity=100`).
- **Response**: Returns feasibility status, detailed component requirements, live available stock, and itemized shortage quantities.

---

### 3.6. Sales Orders Hub (`/orders`)

#### `POST /orders`
- **Access**: `admin`, `sales_executive`
- **Description**: Creates a new Sales Order in `draft` state.
- **Request Body**:
  ```json
  {
    "customer": "66f1111...",
    "items": [
      { "product": "66f2222...", "quantity": 50, "unitPrice": 6500 },
      { "product": "66f3333...", "quantity": 20, "unitPrice": 14500 }
    ],
    "priority": "high",
    "expectedDeliveryDate": "2026-11-15",
    "remarks": "Urgent corporate branch setup"
  }
  ```

#### `GET /orders`
- **Access**: `admin`, `sales_executive`, `inventory_manager`, `production_manager`, `dispatch_manager`
- **Query Parameters**: `status` (any of the 9 stages), `customer`, `priority`, `search`, `page`, `limit`.

#### `GET /orders/:id`
- **Access**: `admin`, `sales_executive`, `inventory_manager`, `production_manager`, `dispatch_manager`
- **Description**: Fetches order dossier with items, customer details, and full status history timeline.

#### `PATCH /orders/:id`
- **Access**: `admin`, `sales_executive`
- **Description**: Modifies order priority, delivery dates, or notes (only allowed in `draft` stage).

#### `POST /orders/:id/approve`
- **Access**: `admin`, `sales_executive`
- **Description**: Approves order and triggers the **Automated Inventory & MRP Engine**:
  1. Checks if finished goods batches exist in stock.
  2. If sufficient FG exists: Reserves batches and transitions order directly to `ready_for_dispatch`.
  3. If stock is insufficient: Evaluates raw materials required via BOM; reserves available components, records shortages, and transitions order to `production_planned`.

#### `POST /orders/:id/cancel`
- **Access**: `admin`, `sales_executive`
- **Description**: Cancels order and releases all reserved raw materials and finished goods back to uncommitted stock.
- **Request Body**: `{ "reason": "Client cancelled procurement tender" }`

---

### 3.7. Finished Goods Inventory (`/finished-goods`)

#### `GET /finished-goods`
- **Access**: `admin`, `inventory_manager`, `sales_executive`, `production_manager`, `dispatch_manager`
- **Query Parameters**: `product`, `warehouse`, `search`, `page`, `limit`.

#### `GET /finished-goods/:id`
- **Access**: `admin`, `inventory_manager`, `sales_executive`, `production_manager`, `dispatch_manager`
- **Description**: Returns batch details, current quantity, and reserved quantity.

#### `POST /finished-goods/:id/adjust-stock`
- **Access**: `admin`, `inventory_manager`
- **Description**: Adjusts batch count and creates an inventory transaction audit record.

---

### 3.8. Production Planning & Execution (`/production-plans`)

#### `POST /production-plans`
- **Access**: `admin`, `production_manager`
- **Description**: Schedules a new production run for an approved sales order.
- **Request Body**:
  ```json
  {
    "salesOrder": "66f4444...",
    "product": "66f2222...",
    "quantity": 50,
    "machine": "CNC Mill Line 01",
    "shift": "morning",
    "operator": "Vikram Rathore",
    "supervisor": "66f5555...",
    "startDate": "2026-10-20",
    "endDate": "2026-10-25",
    "remarks": "High precision batch setup"
  }
  ```

#### `GET /production-plans`
- **Access**: `admin`, `production_manager`, `inventory_manager`, `sales_executive`, `quality_inspector`
- **Query Parameters**: `stage`, `machine`, `shift`, `page`, `limit`.

#### `GET /production-plans/:id`
- **Access**: `admin`, `production_manager`, `inventory_manager`, `sales_executive`, `quality_inspector`
- **Description**: Returns plan details, BOM recipe breakdown, and historical stage transitions.

#### `PATCH /production-plans/:id`
- **Access**: `admin`, `production_manager`
- **Description**: Updates machine workstation, shift, operator, or dates (allowed prior to completion).

#### `POST /production-plans/:id/update-stage`
- **Access**: `admin`, `production_manager`
- **Description**: Advances the plan through the 6-stage lifecycle:
  `planned` → `material_issued` → `manufacturing` → `assembly` → `packaging` → `completed`.
- **Special Business Logic**:
  - Transitioning to `material_issued`: Deducts raw material stock from inventory and marks linked SalesOrder as `in_production`.
  - Transitioning to `completed`: Marks linked SalesOrder as `quality_check`, unlocking the QA station.
- **Request Body**:
  ```json
  {
    "stage": "manufacturing",
    "producedQuantity": 48,
    "rejectedQuantity": 2,
    "remarks": "Machining phase passed inspection"
  }
  ```

---

### 3.9. Quality Control Station (`/quality-inspections`)

#### `POST /quality-inspections`
- **Access**: `admin`, `quality_inspector`
- **Description**: Certifies completed production runs and records 4-point QA evaluation.
- **Special Business Logic**:
  - If status = `passed`: Auto-generates a new Finished Goods batch (`FG-YYYYMMDD-XXXX`), logs an inventory transaction, and advances linked SalesOrder to `ready_for_dispatch`.
- **Request Body**:
  ```json
  {
    "productionPlan": "66f6666...",
    "inspectedQuantity": 48,
    "passedQuantity": 48,
    "failedQuantity": 0,
    "parameters": {
      "visualInspection": "pass",
      "dimensions": "pass",
      "weight": "pass",
      "finish": "pass"
    },
    "status": "passed",
    "remarks": "All parts verified within ±0.05mm tolerance"
  }
  ```

#### `GET /quality-inspections`
- **Access**: `admin`, `quality_inspector`, `production_manager`, `sales_executive`
- **Query Parameters**: `status`, `page`, `limit`.

#### `GET /quality-inspections/:id`
- **Access**: `admin`, `quality_inspector`, `production_manager`, `sales_executive`
- **Description**: Returns full inspection dossier including parameter checklist outcomes.

---

### 3.10. Dispatch Logistics & Carrier Simulation (`/dispatches`)

#### `POST /dispatches`
- **Access**: `admin`, `dispatch_manager`
- **Description**: Fulfills a `ready_for_dispatch` order, assigns courier, issues waybill & invoice numbers, and decrements Finished Goods inventory batches.
- **Validation**:
  - `driver.name`: Letters and spaces only (2–50 characters).
  - `driver.phone`: Exactly 10 digits.
- **Request Body**:
  ```json
  {
    "salesOrder": "66f4444...",
    "vehicle": "MH-04-AZ-9921",
    "driver": {
      "name": "Ramesh Kumar",
      "phone": "9876543210"
    },
    "courier": "FloData Express",
    "remarks": "Fragile items packed in wooden crate"
  }
  ```

#### `GET /dispatches`
- **Access**: `admin`, `dispatch_manager`, `sales_executive`, `inventory_manager`
- **Query Parameters**: `status`, `courier`, `search`, `page`, `limit`.

#### `GET /dispatches/:id`
- **Access**: `admin`, `dispatch_manager`, `sales_executive`
- **Description**: Returns dispatch consignment details with full telematics milestone timeline.

#### `GET /dispatches/track/:trackingNumber`
- **Access**: Public (No JWT required)
- **Description**: Public tracking lookup for clients using tracking number (e.g. `TRK-FloData-...`).

#### `POST /dispatches/:id/simulate-progress`
- **Access**: `admin`, `dispatch_manager`
- **Description**: Simulates the next carrier milestone event (`in_transit` → `out_for_delivery` → `delivered`).

#### `POST /dispatches/:id/deliver`
- **Access**: `admin`, `dispatch_manager`
- **Description**: Confirms delivery, appends final milestone event, and completes the SalesOrder lifecycle (`status = "delivered"`).

---

### 3.11. Inventory Transactions Ledger (`/inventory/transactions`)

#### `GET /inventory/transactions`
- **Access**: `admin`, `inventory_manager`, `production_manager`
- **Description**: Returns paginated, immutable stock movement logs.
- **Query Parameters**: `transactionType`, `itemType`, `startDate`, `endDate`, `page`, `limit`.

---

### 3.12. Executive Intelligence & Analytics Reports (`/reports`)

#### `GET /reports/sales`
- **Access**: `admin`, `sales_executive`
- **Description**: Gross revenue, order counts, average order values, top 10 products, and top 10 customers.
- **Query Parameters**: `startDate`, `endDate`, `status`.

#### `GET /reports/inventory`
- **Access**: `admin`, `inventory_manager`, `production_manager`
- **Description**: Book value of raw materials, finished goods batches, total combined valuation, and warehouse bay breakdowns.

#### `GET /reports/production`
- **Access**: `admin`, `production_manager`
- **Description**: Planned vs produced units, scrap defect rates, machine performance metrics, and shift breakdowns.
- **Query Parameters**: `startDate`, `endDate`.

#### `GET /reports/material-consumption`
- **Access**: `admin`, `inventory_manager`, `production_manager`
- **Description**: Material consumption volume and financial expenditure grouped and ranked by cost.
- **Query Parameters**: `startDate`, `endDate`.

#### `GET /reports/dispatch`
- **Access**: `admin`, `dispatch_manager`, `sales_executive`
- **Description**: Shipment volume, status breakdowns, and carrier partner delivery fulfillment rates.
- **Query Parameters**: `startDate`, `endDate`, `courier`.

#### `GET /reports/low-stock`
- **Access**: `admin`, `inventory_manager`, `production_manager`
- **Description**: Materials at or below safety threshold, recommended reorder quantities, and estimated replenishment procurement costs.

---

### 3.13. Security Audit Trail (`/audit-logs`)

#### `GET /audit-logs`
- **Access**: `admin`
- **Description**: Paginated query of immutable security and operational audit records.
- **Query Parameters**: `action` (`CREATE`, `UPDATE`, `DELETE`, etc.), `resource`, `user`, `startDate`, `endDate`, `page`, `limit`.

#### `GET /audit-logs/:id`
- **Access**: `admin`
- **Description**: Returns detailed audit record with actor information and modified payload.
