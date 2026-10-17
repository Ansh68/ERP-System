# FloData ERP — Discrete Manufacturing Platform

FloData ERP is an enterprise-grade discrete manufacturing ERP platform engineered to manage end-to-end factory operations: from commercial sales order intake and automated Material Requirements Planning (MRP) to 6-stage shopfloor execution, 4-point quality inspection, carrier dispatch logistics, and executive financial reporting.

---

## Key Features & Operational Modules

### 1. 9-Stage Closed-Loop Sales Order Lifecycle
- **Complete Pipeline**: `Draft` → `Approved` → `Inventory Checked` → `Production Planned` → `In Production` → `Quality Check` → `Ready for Dispatch` → `Dispatched` → `Delivered` (or `Cancelled`).
- **Automated Inventory Check & MRP Verification**: On order approval, the engine checks finished goods stock. If available, batches are reserved immediately; if deficient, it evaluates the Bill of Materials (BOM), detects component shortages, reserves available raw materials, and triggers shopfloor scheduling.
- **Audit Trails**: Full status transition history tracking every stage advancement with actor attribution and timestamps.

### 2. Multi-Tier Bill of Materials (BOM) & MRP Engine
- **Product Recipe Architecture**: Define finished goods with itemized raw material ingredients, units of measure, and standard unit selling prices.
- **Interactive MRP Simulation**: Run arbitrary batch simulations (e.g. 50, 100, 500 units) to verify production feasibility, calculate exact material requirements against on-hand stock, and identify specific shortage quantities before launching production.

### 3. Shopfloor Scheduling & 6-Stage Manufacturing Execution
- **State Machine**: `Planned` → `Material Issued` → `Manufacturing` → `Assembly` → `Packaging` → `Completed`.
- **Physical Inventory Deduction**: Raw materials are deducted from inventory upon transitioning to `material_issued`, preventing artificial paper-stock discrepancies.
- **Scrap & Scrap Yield Tracking**: Real-time tracking of `producedQuantity` vs `rejectedQuantity` at every execution phase.
- **Resource Management**: Workstation machine allocation, 3-shift scheduling (`morning`, `evening`, `night`), and supervisor assignment.

### 4. Quality Control (QC) Station & 4-Point Certification
- **Pending Inspection Queue**: Automatically flags completed manufacturing batches ready for quality clearance.
- **4-Point Parameter Testing**: Visual inspection, dimensional accuracy, weight verification, and surface finish.
- **Finished Goods Lot Generation**: Approving inspection automatically generates a unique Finished Goods batch (`FG-YYYYMMDD-XXXX`), records an inventory transaction, and marks the sales order `ready_for_dispatch`.

### 5. Dispatch Logistics & Carrier Telematics Simulation
- **Consignment Management**: Generate waybills (`DSP-YYYYMMDD-XXXX`), commercial invoices (`INV-YYYYMMDD-XXXX`), and assign carriers (*FloData Express*, *Blue Dart*, *Delhivery*, *DTDC*, *FedEx*).
- **Carrier Telematics Simulation**: Step through live milestones (`in_transit` → `out_for_delivery` → `delivered`) with simulated location events.
- **Public Tracking Portal**: Dedicated public endpoint allowing clients to track shipments by tracking number (`TRK-...`) without authentication.

### 6. Dual-Layer Immutable Audit & Inventory Ledgers
- **Inventory Ledger**: Real-time record of all physical stock receipts, issues, dispatches, adjustments, and write-offs.
- **Security Audit Trail**: Tamper-proof activity stream tracking user logins, stage transitions, record creations, and administrative status changes with client IP addresses.

### 7. Executive Intelligence & Analytics Reports
- **Sales Performance**: Gross revenue, order counts, average deal sizes, top 10 products, and top client volume.
- **Inventory Asset Valuation**: Combined physical book value across raw material storage bays and finished goods warehouse lots.
- **Production & Scrap Audit**: Output quantities, machine performance, and scrap defect rates.
- **Material Consumption**: Material issuance volume and financial expenditure grouped by component.
- **Carrier Logistics**: Courier SLA fulfillment rates and delivery success performance.
- **Low-Stock Replenishment**: Critical safety threshold warnings and estimated procurement replenishment costs.

### 8. Modern Enterprise Frontend (Vantus Light Aesthetic)
- **Visual Design**: Curated light-mode theme (`#f4f6f8` canvas, white elevated cards, subtle `#e8ecf1` borders, sky/cyan accents).
- **Typography**: Google Fonts pairing — **Poppins** for headings and **Open Sans** for body.
- **Collapsible Sidebar**: Collapsible navigation rail with state persistence and mobile responsive drawer.
- **Interactive Dossiers**: Click any row in any table (Customers, Orders, Materials, Products, Production, QC, Dispatches, Users, Audit Logs) to inspect detailed modal dossiers with inline edit forms.
- **Notifications**: Replaced native browser alerts with animated, responsive `react-hot-toast` notifications.

---

## Tech Stack

### Backend
- **Runtime**: Node.js (v20+ recommended)
- **Framework**: Express.js (v5)
- **Database**: MongoDB Atlas (or local MongoDB) with Mongoose (v9)
- **Authentication**: JWT (Access Token + Refresh Token in HTTP-only cookies)
- **Security**: Bcrypt.js, CORS, Cookie-Parser, Dotenv

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design Tokens
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Routing**: React Router DOM (v7)
- **HTTP Client**: Axios with credentials interceptors

---

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v20.x` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v10.x` or higher
- **MongoDB**: MongoDB Atlas connection string (or running local MongoDB instance on port `27017`)

---

## Step-by-Step Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Ansh68/ERP-System.git
cd ERP-System
```

---

### 2. Backend Configuration & Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=8000
   DB_NAME=flodata_erp
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.zugwyon.mongodb.net/
   ACCESS_TOKEN_SECRET=your_super_secret_access_token_key_here
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here
   REFRESH_TOKEN_EXPIRY=10d
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Seed the Database with Demo Data**:
   Populates 6 department users, 25 customers, 30 raw materials, 100 products with BOM recipes, 1,000 sales orders, 800 dispatches, 100 production plans, 35 FG batches, 800 inventory transactions, and 200 audit logs:
   ```bash
   npm run seed
   ```

4. **Start the Backend Server**:
   ```bash
   npm run dev
   ```
   The backend API will start on: **`http://localhost:8000`**

---

### 3. Frontend Configuration & Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Verify or create `.env.local` in the `frontend/` directory:
   ```env
   VITE_API_URL=http://localhost:8000/api/v1
   ```

3. **Start the Frontend Development Server**:
   ```bash
   npm run dev
   ```
   The frontend application will start on: **`http://localhost:5173`**

4. **Build for Production (Optional Validation)**:
   ```bash
   npm run build
   ```

---

## Demo Accounts & Role-Based Access Control (RBAC)

Use any of the following pre-configured credentials to test different department permissions. The password for all accounts is: **`Password@123`**

| Department / Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@flodata.com` | `Password@123` | Full access across all modules, user administration, security audit stream, all reports |
| **Sales Executive** | `sales@flodata.com` | `Password@123` | Customer master, sales orders draft & approval, MRP lookups, sales reports |
| **Inventory Manager** | `inventory@flodata.com` | `Password@123` | Raw materials catalog, stock adjustments, valuation & low-stock replenishment reports |
| **Production Manager** | `production@flodata.com` | `Password@123` | BOM recipes, shopfloor scheduling, 6-stage execution, machine allocation, scrap audits |
| **Quality Inspector** | `qc@flodata.com` | `Password@123` | Pending inspection queue, 4-point parameter certification, FG batch receipt |
| **Dispatch Manager** | `dispatch@flodata.com` | `Password@123` | Consignment creation, carrier assignment, telematics simulation, delivery fulfillment |

> **Tip**: You can log in using any of the role credentials above to test department-specific views and permission boundaries.

---

## Project Directory Structure

```text
erp-system/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route controllers (auth, orders, production, qc, dispatch, reports, etc.)
│   │   ├── middleware/       # JWT verification & RBAC role authorization
│   │   ├── models/           # 11 Mongoose data models
│   │   ├── routes/           # 13 Express route definitions
│   │   ├── services/         # Carrier simulation & logistics engine
│   │   ├── utils/            # ApiError, ApiResponse, asyncHandler, auditLogger
│   │   ├── app.js            # Express application configuration
│   │   └── server.js         # HTTP server entrypoint
│   ├── .env                  # Environment variables
│   ├── package.json          # Backend dependencies and scripts
│   └── seed.js               # Database population script
│
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios instance with baseURL & credentials
│   │   ├── components/       # Layout shell (AppLayout, Navbar, UserProfileModal)
│   │   │   └── ui/           # Design system primitives (Button, Card, Badge, Dialog, Input, Skeleton)
│   │   ├── context/          # AuthContext (login, logout, session restoration)
│   │   ├── pages/            # 10 Redesigned ERP module pages
│   │   ├── App.jsx           # Protected routing and guards
│   │   ├── index.css         # Google Fonts, Tailwind tokens, global styles
│   │   └── main.jsx          # React DOM root and Hot-Toaster mount
│   ├── .env.local            # Frontend environment variables
│   ├── package.json          # Frontend dependencies and scripts
│   └── vite.config.js        # Vite configuration
│
├── DATABASE_SCHEMA.md        # Comprehensive 11-collection schema documentation & ERD
├── API_DOCUMENTATION.md      # Complete REST API reference & RBAC permissions matrix
├── decisions.md              # Architectural decisions, changelog, and phase records
└── README.md                 # Project overview and setup instructions
```

---

## Documentation Links

- **[Database Schema Documentation](file:///c:/Users/archi/Desktop/erp-system/DATABASE_SCHEMA.md)**: Field-by-field definitions, indexes, embedded schemas, and Entity Relationship Diagram.
- **[API Reference Documentation](file:///c:/Users/archi/Desktop/erp-system/API_DOCUMENTATION.md)**: All REST endpoints, request/response payloads, and 6-role RBAC permission matrix.
- **[Architectural Decisions & Implementation Log](file:///c:/Users/archi/Desktop/erp-system/decisions.md)**: Complete development history across all 7 frontend redesign phases.
